const OutboundIssue   = require('../models/OutboundIssue');
const MaterialStock   = require('../models/MaterialStock');
const Material        = require('../models/Material');
const BundleComponent = require('../models/BundleComponent');
const Transaction     = require('../models/Transaction');

// ── Tự sinh mã phiếu: PX-YYYYMMDD-001 ───────────────────────────────────────
const genIssueCode = async () => {
  const today  = new Date();
  const prefix = `PX-${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}`;
  const count  = await OutboundIssue.countDocuments({ issue_code: { $regex: `^${prefix}` } });
  return `${prefix}-${String(count + 1).padStart(3, '0')}`;
};

// ── Log giao dịch ─────────────────────────────────────────────────────────────
const logStockTransaction = async (materialId, warehouseId, type, quantity, quantityBefore, quantityAfter, user, note, partnerId = null, referenceId = null) => {
  try {
    await Transaction.create({
      material_id:      materialId,
      warehouse_id:     warehouseId,
      transaction_type: type,
      quantity,
      quantity_before:  quantityBefore,
      quantity_after:   quantityAfter,
      performed_by:     user || 'system',
      note,
      partner_id:       partnerId,
      reference_id:     referenceId,
    });
  } catch (_) {}
};

// ── GET /api/outbound-issues ──────────────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const { status, warehouse_id, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status)       filter.status       = status;
    if (warehouse_id) filter.warehouse_id = warehouse_id;
    if (search)       filter.issue_code   = { $regex: search, $options: 'i' };

    const total = await OutboundIssue.countDocuments(filter);
    const items = await OutboundIssue.find(filter)
      .populate('warehouse_id', 'warehouse_code warehouse_name name code')
      .populate('partner_id',   'object_code object_name name phone')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    res.json({ data: items, pagination: { total, pages: Math.ceil(total / limit), page: Number(page) } });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// ── GET /api/outbound-issues/:id ──────────────────────────────────────────────
exports.getById = async (req, res) => {
  try {
    const item = await OutboundIssue.findById(req.params.id)
      .populate('warehouse_id', 'warehouse_code warehouse_name name code')
      .populate('partner_id',   'object_code object_name name phone')
      .populate('items.material_id', 'product_code product_name unit')
      .lean();
    if (!item) return res.status(404).json({ message: 'Không tìm thấy phiếu xuất' });
    res.json({ data: item });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// ── POST /api/outbound-issues ─────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { warehouse_id, items, issue_date, partner_id, note } = req.body;
    if (!warehouse_id)  return res.status(400).json({ message: 'Thiếu kho xuất' });
    if (!items?.length) return res.status(400).json({ message: 'Phiếu xuất phải có ít nhất 1 dòng hàng' });

    // Kiểm tra tồn kho
    for (const it of items) {
      const stock = await MaterialStock.findOne({ material_id: it.material_id, warehouse_id }).lean();
      const available = (stock?.quantity_on_hand ?? 0) - (stock?.quantity_reserved ?? 0);
      if ((it.quantity_issued || 0) > available) {
        const mat = await Material.findById(it.material_id).lean();
        return res.status(400).json({
          message: `Không đủ tồn kho: "${mat?.product_name || mat?.product_code || it.material_id}" tại kho này (tồn: ${available}, cần: ${it.quantity_issued})`
        });
      }
    }

    let total_cost = 0;
    const processedItems = items.map(it => {
      const item_total = (it.quantity_issued || 0) * (it.unit_price || 0);
      total_cost += item_total;
      return {
        material_id: it.material_id,
        quantity:    it.quantity_issued || 1,
        unit_cost:   it.unit_price || 0,
        total_cost:  item_total,
        note:        it.note || '',
      };
    });

    const issue_code = await genIssueCode();
    const issue = await OutboundIssue.create({
      issue_code,
      warehouse_id,
      partner_id:     partner_id || null,
      items:          processedItems,
      total_cost,
      total_quantity: processedItems.reduce((s, it) => s + it.quantity, 0),
      issue_date:     issue_date || new Date(),
      note:           note || '',
      performed_by:   req.user?._id || null,
      status:         'draft',
    });

    res.status(201).json({ data: issue, message: `Tạo phiếu xuất ${issue_code} thành công` });
  } catch (err) {
    console.error('[OutboundIssue.create]', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// ── PUT /api/outbound-issues/:id ──────────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const issue = await OutboundIssue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Không tìm thấy phiếu' });
    if (issue.status !== 'draft') return res.status(400).json({ message: 'Chỉ sửa được phiếu nháp' });

    const items = req.body.items || issue.items;
    let total_cost = 0;
    const processedItems = items.map(it => {
      const item_total = (it.quantity_issued || it.quantity || 0) * (it.unit_price || it.unit_cost || 0);
      total_cost += item_total;
      return {
        material_id: it.material_id,
        quantity:    it.quantity_issued || it.quantity || 1,
        unit_cost:   it.unit_price || it.unit_cost || 0,
        total_cost:  item_total,
        note:        it.note || '',
      };
    });

    const updated = await OutboundIssue.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        items:          processedItems,
        total_cost,
        total_quantity: processedItems.reduce((s, it) => s + it.quantity, 0),
      },
      { new: true }
    ).populate('warehouse_id', 'warehouse_code warehouse_name name code')
     .populate('partner_id', 'object_code object_name name');

    res.json({ data: updated, message: 'Cập nhật phiếu thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// ── PATCH /api/outbound-issues/:id/confirm → trừ tồn kho ─────────────────────
exports.confirm = async (req, res) => {
  try {
    const issue = await OutboundIssue.findById(req.params.id).lean();
    if (!issue)                        return res.status(404).json({ message: 'Không tìm thấy phiếu' });
    if (issue.status === 'confirmed')  return res.status(400).json({ message: 'Phiếu đã xác nhận rồi' });
    if (issue.status === 'cancelled')  return res.status(400).json({ message: 'Phiếu đã bị huỷ' });

    const user = req.user?.username || 'system';

    // Thu thập các điều chỉnh cần trừ
    const adjustments = [];
    for (const it of issue.items) {
      const material = await Material.findById(it.material_id).lean();
      if (!material) return res.status(404).json({ message: `Không tìm thấy vật tư: ${it.material_id}` });

      if (material.is_bundle) {
        const components = await BundleComponent.find({ bundle_id: material._id }).lean();
        if (!components.length) return res.status(400).json({ message: `Bundle "${material.product_name}" chưa có linh kiện` });
        for (const bc of components) {
          adjustments.push({
            material_id: bc.component_id,
            quantity:    it.quantity * bc.quantity,
            note:        `Xuất linh kiện bundle "${material.product_name}" — phiếu ${issue.issue_code}`,
          });
        }
      } else {
        adjustments.push({
          material_id: it.material_id,
          quantity:    it.quantity,
          note:        `Xuất "${material.product_name}" — phiếu ${issue.issue_code}`,
        });
      }
    }

    // Gộp cùng material_id
    const deductMap = {};
    adjustments.forEach(a => {
      const k = a.material_id.toString();
      deductMap[k] = (deductMap[k] || 0) + a.quantity;
    });

    // Kiểm tra tồn kho
    for (const [matId, qty] of Object.entries(deductMap)) {
      const stock = await MaterialStock.findOne({ material_id: matId, warehouse_id: issue.warehouse_id }).lean();
      const avail = (stock?.quantity_on_hand ?? 0) - (stock?.quantity_reserved ?? 0);
      if (avail < qty) {
        const mat = await Material.findById(matId).lean();
        return res.status(400).json({
          message: `Không đủ tồn kho: "${mat?.product_name || matId}" (tồn: ${avail}, cần: ${qty})`
        });
      }
    }

    // Trừ tồn kho
    for (const adj of adjustments) {
      const stock = await MaterialStock.findOne({ material_id: adj.material_id, warehouse_id: issue.warehouse_id });
      if (!stock) continue;
      const before = stock.quantity_on_hand;
      stock.quantity_on_hand  -= adj.quantity;
      stock.quantity_available = Math.max(0, stock.quantity_on_hand - (stock.quantity_reserved || 0));
      stock.out_of_stock       = stock.quantity_on_hand <= 0;
      stock.last_movement_at   = new Date();
      await stock.save();
      await logStockTransaction(adj.material_id, issue.warehouse_id, 'outbound', adj.quantity, before, stock.quantity_on_hand, user, adj.note, issue.partner_id, issue._id);
    }

    await OutboundIssue.findByIdAndUpdate(req.params.id, {
      status:       'confirmed',
      confirmed_by: user,
    });

    res.json({ message: `Xác nhận phiếu ${issue.issue_code} thành công — đã trừ tồn kho` });
  } catch (err) {
    console.error('[OutboundIssue.confirm]', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// ── PATCH /api/outbound-issues/:id/cancel ─────────────────────────────────────
exports.cancel = async (req, res) => {
  try {
    const issue = await OutboundIssue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Không tìm thấy phiếu' });
    if (issue.status === 'confirmed') return res.status(400).json({ message: 'Phiếu đã xác nhận, không thể huỷ' });
    issue.status       = 'cancelled';
    issue.cancelled_by = req.user?.username || 'system';
    await issue.save();
    res.json({ message: 'Huỷ phiếu thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// ── DELETE /api/outbound-issues/:id (chỉ draft) ───────────────────────────────
exports.delete = async (req, res) => {
  try {
    const issue = await OutboundIssue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Không tìm thấy phiếu' });
    if (issue.status !== 'draft') return res.status(400).json({ message: 'Chỉ xoá được phiếu nháp' });
    await issue.deleteOne();
    res.json({ message: 'Xoá phiếu thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};