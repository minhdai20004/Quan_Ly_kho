const mongoose = require('mongoose');

const inventoryStockSchema = new mongoose.Schema({
  stock_id: { type: String, unique: true, required: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },
  unit_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductUnit' },

  warehouse_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  location_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },

  quantity_on_hand: { type: Number, required: true, min: 0, default: 0 },
  quantity_reserved: { type: Number, required: true, min: 0, default: 0 },
  quantity_available: { type: Number, min: 0, default: 0 },
  quantity_in_transit: { type: Number, min: 0, default: 0 },
  quantity_on_order: { type: Number, min: 0, default: 0 },

  reorder_point: { type: Number, min: 0 },
  min_stock: { type: Number, min: 0 },
  max_stock: { type: Number, min: 0 },

  unit_cost: { type: Number },
  total_cost: { type: Number },

  last_counted_at: { type: Date },
  last_counted_qty: { type: Number },
  last_movement_at: { type: Date },
  batch_id: { type: String },

  low_stock_alert: { type: Boolean, default: false },
  overstock_alert: { type: Boolean, default: false },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

inventoryStockSchema.index({
  product_id: 1,
  variant_id: 1,
  unit_id: 1,
  warehouse_id: 1,
  location_id: 1
}, { unique: true });

inventoryStockSchema.pre('save', function(next) {
  this.quantity_available = this.quantity_on_hand - this.quantity_reserved;
  this.total_cost = this.quantity_on_hand * (this.unit_cost || 0);
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('InventoryStock', inventoryStockSchema);