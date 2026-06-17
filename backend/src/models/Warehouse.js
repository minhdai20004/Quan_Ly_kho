const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
  warehouse_id:  { type: String },
  name:          { type: String },
  code:          { type: String },
  address:       { type: mongoose.Schema.Types.Mixed },
  type:          { type: String, default: 'main' },
  status:        { type: String, enum: ['active', 'inactive'], default: 'active' },
  capacity:      { type: mongoose.Schema.Types.Mixed },
  is_default:    { type: Boolean, default: false },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'warehouses',
});

warehouseSchema.virtual('warehouse_name').get(function () { return this.name; });
warehouseSchema.virtual('warehouse_code').get(function () { return this.code; });
warehouseSchema.virtual('is_active').get(function () { return this.status === 'active'; });

module.exports = mongoose.model('Warehouse', warehouseSchema);