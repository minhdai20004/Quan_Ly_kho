const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
  warehouse_id: { type: String, unique: true, required: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String, default: 'Vietnam' },
    postal_code: { type: String },
  },
  contact: {
    phone: { type: String },
    email: { type: String },
    manager: { type: String },
  },
  type: {
    type: String,
    enum: ['main', 'branch', 'transit', 'return'],
    default: 'branch'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  capacity: {
    total: { type: Number }, // Tổng sức chứa (m³ hoặc pallet)
    used: { type: Number, default: 0 },
    unit: { type: String, default: 'pallet' }
  },
  operating_hours: {
    open: { type: String },
    close: { type: String }
  },
  is_default: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

warehouseSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Warehouse', warehouseSchema);
