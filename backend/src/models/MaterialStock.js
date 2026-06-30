const mongoose = require('mongoose');

const materialStockSchema = new mongoose.Schema({
  material_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: true,
  },
  warehouse_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true,
  },

  quantity_on_hand:    { type: Number, default: 0, min: 0 },
  quantity_reserved:   { type: Number, default: 0, min: 0 },
  quantity_available:  { type: Number, default: 0 },
  quantity_in_transit: { type: Number, default: 0, min: 0 },

  reorder_point: { type: Number, default: 0, min: 0 },
  min_stock:     { type: Number, default: 0, min: 0 },
  max_stock:     { type: Number, default: null },

  unit_cost:  { type: Number, default: 0 },
  total_value: { type: Number, default: 0 },

  low_stock_alert:  { type: Boolean, default: false },
  out_of_stock:     { type: Boolean, default: false },

  last_movement_at: { type: Date, default: null },
  last_counted_at:  { type: Date, default: null },
  last_counted_qty: { type: Number, default: null },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
}, {
  collection: 'materialstocks',
});

// Unique: 1 vật tư chỉ có 1 dòng tồn kho per kho
materialStockSchema.index({ material_id: 1, warehouse_id: 1 }, { unique: true });

materialStockSchema.pre('save', function (next) {
  this.quantity_available = Math.max(0, this.quantity_on_hand - this.quantity_reserved);
  this.total_value        = this.quantity_on_hand * (this.unit_cost || 0);
  this.low_stock_alert    = this.reorder_point > 0 && this.quantity_available <= this.reorder_point;
  this.out_of_stock       = this.quantity_on_hand <= 0;
  this.updated_at         = Date.now();
  next();
});

// Recalc khi findOneAndUpdate
materialStockSchema.pre('findOneAndUpdate', function (next) {
  const upd = this.getUpdate();
  if (upd?.$inc) this.set({ updated_at: Date.now() });
  next();
});
delete mongoose.models['MaterialStock'];
module.exports = mongoose.model('MaterialStock', materialStockSchema);
