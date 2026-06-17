const mongoose = require('mongoose');

const materialStockSchema = new mongoose.Schema({
  material_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  warehouse_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  quantity_on_hand:   { type: Number, default: 0 },
  quantity_reserved:  { type: Number, default: 0 },
  quantity_available: { type: Number, default: 0 },
  min_stock:          { type: Number, default: 0 },
  max_stock:          { type: Number, default: 0 },
  reorder_point:      { type: Number, default: 0 },
  low_stock_alert:    { type: Boolean, default: false },
  unit_cost:          { type: Number, default: 0 },
  total_cost:         { type: Number, default: 0 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('MaterialStock', materialStockSchema);