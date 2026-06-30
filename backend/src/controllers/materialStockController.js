const MaterialStock = require('../models/MaterialStock');
const Material      = require('../models/Material');

// Lấy tồn kho tất cả vật tư (có filter)
exports.getAll = async (req, res) => {
  try {
    const { warehouse_id, low_stock_only } = req.query;
    const filter = {};
    if (warehouse_id)           filter.warehouse_id  = warehouse_id;
    if (low_stock_only === 'true') filter.low_stock_alert = true;

    const stocks = await MaterialStock.find(filter)
      // ✅ Thêm selling_price để tính "Giá trị tồn kho" = qty × selling_price
      .populate('material_id',  'product_code product_name unit selling_price purchase_price')
      .populate('warehouse_id', 'warehouse_code warehouse_name name code')
      .lean();

    res.json({ data: stocks });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// Lấy tồn kho của 1 vật tư (tất cả kho)
exports.getByMaterial = async (req, res) => {
  try {
    const stocks = await MaterialStock.find({ material_id: req.params.materialId })
      .populate('warehouse_id', 'warehouse_code warehouse_name name code')
      .lean();
    res.json({ data: stocks });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// Điều chỉnh tồn kho thủ công (adjust)
// ✅ FIXED: min_stock được lưu trực tiếp trên MaterialStock (theo từng kho),
//    không lấy từ Material.min_stock (field đó không tồn tại trên Material model).
exports.adjust = async (req, res) => {
  try {
    const { material_id, warehouse_id, quantity_on_hand, min_stock, reason } = req.body;
    if (!material_id || !warehouse_id || quantity_on_hand === undefined)
      return res.status(400).json({ message: 'Thiếu material_id, warehouse_id hoặc quantity_on_hand' });

    // Lấy min_stock hiện tại nếu request không gửi lên (giữ nguyên giá trị cũ)
    const existing = await MaterialStock.findOne({ material_id, warehouse_id }).lean();
    const resolvedMinStock = min_stock !== undefined ? Number(min_stock) : (existing?.min_stock || 0);

    const stock = await MaterialStock.findOneAndUpdate(
      { material_id, warehouse_id },
      {
        $set: {
          quantity_on_hand,
          quantity_available: Math.max(0, quantity_on_hand),
          min_stock:          resolvedMinStock,
          low_stock_alert:    resolvedMinStock > 0 && quantity_on_hand > 0 && quantity_on_hand < resolvedMinStock,
          out_of_stock:       quantity_on_hand <= 0,
          last_movement_at:   new Date(),
          last_adjust_reason: reason || '',
        }
      },
      { upsert: true, new: true }
    ).populate('material_id',  'product_code product_name unit selling_price purchase_price')
     .populate('warehouse_id', 'warehouse_code warehouse_name name code');

    res.json({ data: stock, message: 'Điều chỉnh tồn kho thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};