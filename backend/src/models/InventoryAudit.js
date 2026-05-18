const mongoose = require('mongoose');

const inventoryAuditSchema = new mongoose.Schema({
  audit_id: { type: String, unique: true, required: true },

  product_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouse_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },

  adjustment_type: {
    type: String,
    enum: ['in', 'out', 'set', 'reserve', 'release'],
    required: true
  },
  quantity_before: { type: Number, required: true },
  quantity_after:  { type: Number, required: true },
  quantity_change: { type: Number, required: true }, // positive or negative delta

  notes: { type: String },
  // created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional if auth

  created_at: { type: Date, default: Date.now }
});

inventoryAuditSchema.index({ product_id: 1, created_at: -1 });
inventoryAuditSchema.index({ warehouse_id: 1, created_at: -1 });

module.exports = mongoose.model('InventoryAudit', inventoryAuditSchema);
