const Material      = require('../models/Material');
const MaterialStock = require('../models/MaterialStock');
const MaterialBatch = require('../models/MaterialBatch');
const Transaction   = require('../models/Transaction');

// ─── Helper: log transaction ──────────────────────────────────────────────────
const logAction = async (materialId, type, user, note, quantity = 0) => {
  try {
    await Transaction.create({
      material_id:      materialId,
      transaction_type: type,
      quantity,
      quantity_before:  quantity,
      quantity_after:   quantity,
      performed_by:     user || 'system',
      note,
    });
  } catch (_) {}
};

// ─── Helper: stock + nearest_expiry per material ──────────────────────────────
const getStockMap = async (materialIds) => {
  // Tồn kho từ MaterialStock
  const stocks = await MaterialStock.find({ product_id: { $in: materialIds } }).lean();
  const stockMap = {};
  stocks.forEach(s => {
    const key = s.product_id.toString();
    stockMap[key] = (stockMap[key] || 0) + (s.quantity_on_hand || 0);
  });

  // Nearest expiry từ MaterialBatch (lô còn hàng, chưa hết hạn)
  const batches = await MaterialBatch.find({
    material_id: { $in: materialIds },
    quantity:    { $gt: 0 },
  }).sort({ expiry_date: 1 }).lean();

  const expiryMap   = {};  // nearest expiry date
  const expiredMap  = {};  // có lô đã hết hạn không
  const now = new Date();

  batches.forEach(b => {
    const key = b.material_id.toString();
    // Nearest expiry (đã sort asc nên lấy lần đầu)
    if (!expiryMap[key]) expiryMap[key] = b.expiry_date;
    // Flag expired
    if (new Date(b.expiry_date) < now) expiredMap[key] = true;
  });

  return { stockMap, expiryMap, expiredMap };
};

// ─── GET /api/materials ───────────────────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const { search, group_id, status, page = 1, limit = 200 } = req.query;

    const filter = { deleted_at: null };
    if (status)   filter.status      = status;
    if (group_id) filter.category_id = group_id;
    if (search)   filter.$or = [
      { product_code: { $regex: search, $options: 'i' } },
      { product_name: { $regex: search, $options: 'i' } },
      { sku:          { $regex: search, $options: 'i' } },
    ];

    const total = await Material.countDocuments(filter);
    const items = await Material.find(filter)
      .populate('category_id', 'name code')
      .sort({ product_code: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const { stockMap, expiryMap, expiredMap } = await getStockMap(items.map(m => m._id));

    const result = items.map(m => ({
      ...m,
      material_name:   m.product_name,
      material_code:   m.product_code,
      group_name:      m.category_id?.name || '',
      totalStock:      stockMap[m._id.toString()] || 0,
      // HSD gần nhất trong các lô còn hàng
      nearest_expiry:  expiryMap[m._id.toString()]  || null,
      has_expired_batch: expiredMap[m._id.toString()] || false,
    }));

    res.json({
      data:       result,
      pagination: { total, pages: Math.ceil(total / limit), page: Number(page) },
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// ─── GET /api/materials/:id ───────────────────────────────────────────────────
exports.getById = async (req, res) => {
  try {
    const item = await Material.findById(req.params.id)
      .populate('category_id', 'name code')
      .lean();
    if (!item) return res.status(404).json({ message: 'Không tìm thấy vật tư' });

    const [stocks, batches] = await Promise.all([
      MaterialStock.find({ product_id: item._id })
        .populate('warehouse_id', 'code name')
        .lean(),
      MaterialBatch.find({ material_id: item._id, quantity: { $gt: 0 } })
        .populate('warehouse_id', 'code name')
        .sort({ expiry_date: 1 })
        .lean(),
    ]);

    const totalStock = stocks.reduce((s, x) => s + (x.quantity_on_hand || 0), 0);
    const now = new Date();
    const nearest_expiry = batches[0]?.expiry_date || null;
    const has_expired_batch = batches.some(b => new Date(b.expiry_date) < now);

    res.json({
      data: {
        ...item,
        material_name: item.product_name,
        material_code: item.product_code,
        stocks,
        batches,
        totalStock,
        nearest_expiry,
        has_expired_batch,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// ─── POST /api/materials ──────────────────────────────────────────────────────
// ─── POST /api/materials ──────────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { product_code, product_name } = req.body;
    if (!product_code || !product_name)
      return res.status(400).json({ message: 'Thiếu product_code hoặc product_name' });

    const exists = await Material.findOne({ product_code: product_code.trim() });
    if (exists)
      return res.status(409).json({ message: `Mã "${product_code}" đã tồn tại` });

    // Sanitize: empty string → undefined để tránh CastError ObjectId
    const body = { ...req.body };
    if (!body.category_id) delete body.category_id;

    const item = await Material.create({
      ...body,
      product_code: product_code.trim(),
      product_name: product_name.trim(),
    });

    await logAction(item._id, 'create', req.user?.username, `Tạo mới: ${item.product_name}`);
    res.status(201).json({ data: item, message: 'Tạo vật tư thành công' });
  } catch (err) {
    console.error('[Material.create]', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// ─── PUT /api/materials/:id ───────────────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const body = { ...req.body };
    if (!body.category_id) delete body.category_id;

    const item = await Material.findByIdAndUpdate(
      req.params.id, body,
      { new: true, runValidators: true }
    ).populate('category_id', 'name code');
    if (!item) return res.status(404).json({ message: 'Không tìm thấy vật tư' });

    const { stockMap } = await getStockMap([item._id]);
    const total = stockMap[item._id.toString()] || 0;
    await logAction(item._id, 'update', req.user?.username, `Cập nhật: ${item.product_name}`, total);

    res.json({ data: item, message: 'Cập nhật thành công' });
  } catch (err) {
    console.error('[Material.update]', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// ─── DELETE /api/materials/:id ────────────────────────────────────────────────
exports.delete = async (req, res) => {
  try {
    const item = await Material.findByIdAndUpdate(
      req.params.id,
      { deleted_at: new Date() },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: 'Không tìm thấy vật tư' });

    const { stockMap } = await getStockMap([item._id]);
    const total = stockMap[item._id.toString()] || 0;
    await logAction(item._id, 'delete', req.user?.username, `Xóa: ${item.product_name}`, total);

    res.json({ message: 'Xóa vật tư thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};