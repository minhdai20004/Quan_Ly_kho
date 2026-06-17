const MaterialBatch = require('../models/MaterialBatch');
const Material      = require('../models/Material');
const mongoose      = require('mongoose');

// ── Helper: auto-generate batch_no ───────────────────────────────────────────
const genBatchNo = () => {
  const now = new Date();
  const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LOT-${ymd}-${rand}`;
};

// ── GET /api/material-batches/expiry-alerts ───────────────────────────────────
// Query params: days (default 30) — cảnh báo sắp hết hạn trong X ngày
exports.getExpiryAlerts = async (req, res) => {
  try {
    const daysThreshold = Math.max(1, Number(req.query.days) || 30);
    const now  = new Date();
    const soon = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);

    const [expired, expiringSoon] = await Promise.all([
      // Đã hết hạn, vẫn còn hàng
      MaterialBatch.find({
        expiry_date: { $lt: now },
        quantity:    { $gt: 0 },
      })
        .populate('material_id',  'product_name product_code has_expiry_date category_id')
        .populate('warehouse_id', 'name code')
        .sort({ expiry_date: 1 })
        .lean(),

      // Sắp hết hạn trong X ngày
      MaterialBatch.find({
        expiry_date: { $gte: now, $lte: soon },
        quantity:    { $gt: 0 },
      })
        .populate('material_id',  'product_name product_code has_expiry_date category_id')
        .populate('warehouse_id', 'name code')
        .sort({ expiry_date: 1 })
        .lean(),
    ]);

    // Tính days_until_expiry cho mỗi record
    const addDays = list => list.map(b => ({
      ...b,
      days_until_expiry: Math.ceil((new Date(b.expiry_date) - now) / (1000 * 60 * 60 * 24)),
    }));

    res.json({
      data: {
        expired:       addDays(expired),
        expiring_soon: addDays(expiringSoon),
        days_threshold: daysThreshold,
        summary: {
          total_expired:       expired.length,
          total_expiring_soon: expiringSoon.length,
          qty_expired:         expired.reduce((s, b) => s + b.quantity, 0),
          qty_expiring_soon:   expiringSoon.reduce((s, b) => s + b.quantity, 0),
        },
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// ── GET /api/material-batches/material/:materialId ────────────────────────────
exports.getByMaterial = async (req, res) => {
  try {
    const batches = await MaterialBatch.find({
      material_id: req.params.materialId,
    })
      .populate('warehouse_id', 'name code')
      .sort({ expiry_date: 1 })
      .lean();

    const now = new Date();
    const result = batches.map(b => ({
      ...b,
      days_until_expiry: Math.ceil((new Date(b.expiry_date) - now) / (1000 * 60 * 60 * 24)),
    }));

    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// ── POST /api/material-batches ────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const {
      material_id, warehouse_id,
      batch_no, manufacture_date, expiry_date,
      quantity, unit_cost, notes,
    } = req.body;

    if (!material_id)  return res.status(400).json({ message: 'Thiếu material_id' });
    if (!warehouse_id) return res.status(400).json({ message: 'Thiếu warehouse_id' });
    if (!expiry_date)  return res.status(400).json({ message: 'Thiếu hạn sử dụng (expiry_date)' });
    if (!quantity || Number(quantity) <= 0)
      return res.status(400).json({ message: 'Số lượng phải > 0' });

    // Kiểm tra vật tư tồn tại
    const material = await Material.findById(material_id).lean();
    if (!material) return res.status(404).json({ message: 'Không tìm thấy vật tư' });

    // Auto shelf life từ material nếu không có expiry_date nhưng có manufacture_date
    let resolvedExpiry = expiry_date;
    if (!resolvedExpiry && manufacture_date && material.default_shelf_life_days) {
      const mfg = new Date(manufacture_date);
      mfg.setDate(mfg.getDate() + material.default_shelf_life_days);
      resolvedExpiry = mfg;
    }

    const finalBatchNo = batch_no?.trim() || genBatchNo();

    const batch = await MaterialBatch.create({
      material_id,
      warehouse_id,
      batch_no:         finalBatchNo,
      manufacture_date: manufacture_date || null,
      expiry_date:      resolvedExpiry,
      quantity:         Number(quantity),
      unit_cost:        Number(unit_cost) || 0,
      notes:            notes || '',
    });

    const populated = await MaterialBatch.findById(batch._id)
      .populate('material_id',  'product_name product_code')
      .populate('warehouse_id', 'name code')
      .lean();

    res.status(201).json({ data: populated, message: 'Tạo lô hàng thành công' });
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ message: `Số lô "${req.body.batch_no}" đã tồn tại cho vật tư này trong kho` });
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// ── PUT /api/material-batches/:id ─────────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const allowed = ['manufacture_date', 'expiry_date', 'quantity', 'unit_cost', 'notes', 'batch_no'];
    const update  = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });

    const batch = await MaterialBatch.findByIdAndUpdate(
      req.params.id, update, { new: true, runValidators: true }
    )
      .populate('material_id',  'product_name product_code')
      .populate('warehouse_id', 'name code');

    if (!batch) return res.status(404).json({ message: 'Không tìm thấy lô hàng' });
    res.json({ data: batch, message: 'Cập nhật lô hàng thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// ── DELETE /api/material-batches/:id ──────────────────────────────────────────
exports.delete = async (req, res) => {
  try {
    const batch = await MaterialBatch.findByIdAndDelete(req.params.id);
    if (!batch) return res.status(404).json({ message: 'Không tìm thấy lô hàng' });
    res.json({ message: 'Xóa lô hàng thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};