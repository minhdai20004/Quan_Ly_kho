const MaterialStock = require('../models/MaterialStock');
const Material      = require('../models/Material');

// Lấy tồn kho tất cả vật tư (có filter)
exports.getAll = async (req, res) => {
  try {
    const { warehouse_id, low_stock_only } = req.query;
    const filter = {};
    if (warehouse_id)  filter.warehouse_id = warehouse_id;
    if (low_stock_only === 'true') filter.low_stock_alert = true;

    const stocks = await MaterialStock.find(filter)
      .populate('material_id',  'material_code material_name unit min_stock group_id')
      .populate('warehouse_id', 'warehouse_code warehouse_name')
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
      .populate('warehouse_id', 'warehouse_code warehouse_name')
      .lean();
    res.json({ data: stocks });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// Điều chỉnh tồn kho thủ công (adjust)
exports.adjust = async (req, res) => {
  try {
    const { material_id, warehouse_id, quantity_on_hand, reason } = req.body;
    if (!material_id || !warehouse_id || quantity_on_hand === undefined)
      return res.status(400).json({ message: 'Thiếu material_id, warehouse_id hoặc quantity_on_hand' });

    const material = await Material.findById(material_id).lean();
    const stock = await MaterialStock.findOneAndUpdate(
      { material_id, warehouse_id },
      {
        $set: {
          quantity_on_hand,
          quantity_available: quantity_on_hand,
          low_stock_alert: material ? quantity_on_hand < (material.min_stock || 0) : false,
        }
      },
      { upsert: true, new: true }
    );

    res.json({ data: stock, message: 'Điều chỉnh tồn kho thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};