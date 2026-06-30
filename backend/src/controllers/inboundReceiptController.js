const InboundReceipt = require('../models/InboundReceipt');
const MaterialStock  = require('../models/MaterialStock');
const MaterialBatch  = require('../models/MaterialBatch');
const Material       = require('../models/Material');

// ── Tự sinh mã phiếu: PN-YYYYMMDD-001 ────────────────────────────────────────
const genReceiptCode = async () => {
  const today  = new Date();
  const prefix = `PN-${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}`;
  const count  = await InboundReceipt.countDocuments({ receipt_code: { $regex: `^${prefix}` } });
  return `${prefix}-${String(count + 1).padStart(3, '0')}`;
};

// ── Auto-gen batch_no ─────────────────────────────────────────────────────────
const genBatchNo = () => {
  const ymd  = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LOT-${ymd}-${rand}`;
};

// ── Tính lại totals cho items ─────────────────────────────────────────────────
const processItems = (items) => {
  let total_quantity = 0;
  let total_cost     = 0;
  const processed = items.map(it => {
    const qty        = Number(it.quantity)          || 0;
    const qty_rcv    = Number(it.quantity_received) || qty;
    const unit_cost  = Number(it.unit_cost)         || 0;
    const total      = qty_rcv * unit_cost;
    total_quantity  += qty_rcv;
    total_cost      += total;
    return { ...it, quantity: qty, quantity_received: qty_rcv, unit_cost, total_cost: total };
  });
  return { processed, total_quantity, total_cost };
};

// ── GET /api/inbound-receipts ─────────────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const { status, warehouse_id, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status)       filter.status       = status;
    if (warehouse_id) filter.warehouse_id = warehouse_id;
    if (search)       filter.receipt_code = { $regex: search, $options: 'i' };

    const total = await InboundReceipt.countDocuments(filter);
    const items = await InboundReceipt.find(filter)
      .populate('warehouse_id', 'name code warehouse_name warehouse_code')
      .populate('partner_id',   'name object_name object_code phone')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    res.json({ data: items, pagination: { total, pages: Math.ceil(total / limit), page: Number(page) } });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// ── GET /api/inbound-receipts/:id ─────────────────────────────────────────────
exports.getById = async (req, res) => {
  try {
    const item = await InboundReceipt.findById(req.params.id)
      .populate('warehouse_id', 'name code warehouse_name warehouse_code')
      .populate('partner_id',   'name object_name object_code phone')
      .populate('items.material_id', 'product_code product_name units unit has_expiry_date default_shelf_life_days purchase_price selling_price')
      .lean();
    if (!item) return res.status(404).json({ message: 'Không tìm thấy phiếu nhập' });
    res.json({ data: item });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// ── POST /api/inbound-receipts ────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { warehouse_id, items, receipt_date, partner_id, note } = req.body;
    if (!warehouse_id)  return res.status(400).json({ message: 'Thiếu kho nhập' });
    if (!items?.length) return res.status(400).json({ message: 'Phiếu nhập phải có ít nhất 1 dòng hàng' });

    const { processed, total_quantity, total_cost } = processItems(items);
    const receipt_code = await genReceiptCode();

    const receipt = await InboundReceipt.create({
      receipt_code,
      warehouse_id,
      partner_id:     partner_id || null,
      items:          processed,
      total_quantity,
      total_cost,
      receipt_date:   receipt_date || new Date(),
      note:           note || '',
      created_by:     req.user?.username || 'system',
      status:         'draft',
    });

    res.status(201).json({ data: receipt, message: `Tạo phiếu nhập ${receipt_code} thành công` });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// ── PUT /api/inbound-receipts/:id ─────────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const receipt = await InboundReceipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ message: 'Không tìm thấy phiếu' });
    if (receipt.status !== 'draft')
      return res.status(400).json({ message: 'Chỉ sửa được phiếu đang ở trạng thái nháp' });

    const items = req.body.items || receipt.items;
    const { processed, total_quantity, total_cost } = processItems(items);

    const updated = await InboundReceipt.findByIdAndUpdate(
      req.params.id,
      { ...req.body, items: processed, total_quantity, total_cost },
      { new: true }
    )
      .populate('warehouse_id', 'name code')
      .populate('partner_id',   'name object_name');

    res.json({ data: updated, message: 'Cập nhật phiếu thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// ── PATCH /api/inbound-receipts/:id/confirm ───────────────────────────────────
// Xác nhận phiếu → cộng MaterialStock (weighted average cho GIÁ VỐN TỒN KHO)
// ⚠️ KHÔNG đụng đến Material.purchase_price/selling_price — giá đó CỐ ĐỊNH,
//    chỉ sửa tay ở trang Vật Tư, không bị phiếu nhập ghi đè.
exports.confirm = async (req, res) => {
  try {
    const receipt = await InboundReceipt.findById(req.params.id)
      .populate('items.material_id', 'product_code product_name has_expiry_date default_shelf_life_days')
      .lean();
    if (!receipt)                       return res.status(404).json({ message: 'Không tìm thấy phiếu' });
    if (receipt.status === 'confirmed') return res.status(400).json({ message: 'Phiếu đã xác nhận rồi' });
    if (receipt.status === 'cancelled') return res.status(400).json({ message: 'Phiếu đã bị huỷ' });

    for (const it of receipt.items) {
      const inboundQty = it.quantity_received || it.quantity || 0;
      if (inboundQty <= 0) continue;

      const materialId  = it.material_id?._id || it.material_id;
      const warehouseId = receipt.warehouse_id;
      const inboundCost = Number(it.unit_cost) || 0;

      // ── Weighted Average Cost — chỉ áp dụng cho GIÁ VỐN TỒN KHO (MaterialStock.unit_cost)
      //    Đây KHÁC với Material.purchase_price (giá tham khảo cố định do admin set)
      const currentStock = await MaterialStock.findOne(
        { material_id: materialId, warehouse_id: warehouseId }
      ).lean();

      const oldQty  = currentStock?.quantity_on_hand || 0;
      const oldCost = currentStock?.unit_cost         || 0;
      const newQty  = oldQty + inboundQty;

      const newUnitCost = inboundCost > 0
        ? Math.round(((oldQty * oldCost) + (inboundQty * inboundCost)) / newQty)
        : oldCost;

      const newTotalValue = newQty * newUnitCost;

      await MaterialStock.findOneAndUpdate(
        { material_id: materialId, warehouse_id: warehouseId },
        {
          $inc: { quantity_on_hand: inboundQty, quantity_available: inboundQty },
          $set: {
            unit_cost:        newUnitCost,
            total_value:      newTotalValue,
            out_of_stock:     false,
            low_stock_alert:  false,
            last_movement_at: new Date(),
            updated_at:       new Date(),
          },
        },
        { upsert: true, new: true }
      );

      // ❌ ĐÃ BỎ: không còn ghi đè Material.purchase_price ở đây nữa.
      //    Giá vật tư giờ chỉ thay đổi khi admin sửa tay trong trang Vật Tư.

      // ── Tạo MaterialBatch nếu vật tư có track HSD ─────────────────────────
      const material  = it.material_id;
      const hasExpiry = material?.has_expiry_date;

      let resolvedExpiry = it.expiry_date || null;
      if (!resolvedExpiry && it.manufacture_date && material?.default_shelf_life_days) {
        const d = new Date(it.manufacture_date);
        d.setDate(d.getDate() + material.default_shelf_life_days);
        resolvedExpiry = d;
      }

      if (hasExpiry && resolvedExpiry) {
        const batchNo = it.batch_no?.trim() || genBatchNo();
        try {
          await MaterialBatch.findOneAndUpdate(
            { material_id: materialId, warehouse_id: warehouseId, batch_no: batchNo },
            {
              $inc: { quantity: inboundQty },
              $set: {
                manufacture_date: it.manufacture_date || null,
                expiry_date:      resolvedExpiry,
                unit_cost:        inboundCost,
              },
              $setOnInsert: { status: 'active' },
            },
            { upsert: true, new: true }
          );
        } catch (_) {
          await MaterialBatch.create({
            material_id:      materialId,
            warehouse_id:     warehouseId,
            batch_no:         `${batchNo}-${Date.now()}`,
            manufacture_date: it.manufacture_date || null,
            expiry_date:      resolvedExpiry,
            quantity:         inboundQty,
            unit_cost:        inboundCost,
          });
        }
      }
    }

    await InboundReceipt.findByIdAndUpdate(req.params.id, {
      status:       'confirmed',
      confirmed_by: req.user?.username || 'system',
      confirmed_at: new Date(),
    });

    res.json({ message: `Xác nhận phiếu ${receipt.receipt_code} thành công — đã cập nhật tồn kho` });
  } catch (err) {
    console.error('[confirm]', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// ── PATCH /api/inbound-receipts/:id/cancel ────────────────────────────────────
exports.cancel = async (req, res) => {
  try {
    const receipt = await InboundReceipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ message: 'Không tìm thấy phiếu' });
    if (receipt.status === 'confirmed')
      return res.status(400).json({ message: 'Phiếu đã hoàn thành, không thể huỷ' });

    receipt.status       = 'cancelled';
    receipt.cancelled_by = req.user?.username || 'system';
    await receipt.save();
    res.json({ message: 'Huỷ phiếu thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// ── DELETE /api/inbound-receipts/:id (chỉ draft) ─────────────────────────────
exports.delete = async (req, res) => {
  try {
    const receipt = await InboundReceipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ message: 'Không tìm thấy phiếu' });
    if (receipt.status !== 'draft')
      return res.status(400).json({ message: 'Chỉ xóa được phiếu nháp' });
    await receipt.deleteOne();
    res.json({ message: 'Xóa phiếu thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};