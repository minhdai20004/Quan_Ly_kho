const mongoose = require('mongoose');

const inventoryBatchSchema = new mongoose.Schema({
  batch_id: { type: String, unique: true, required: true },
  batch_number: { type: String, required: true }, // VD: LOT-2024-001
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },
  unit_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductUnit' },

  // Nhà cung cấp của lô này
  supplier_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },

  // Ngày quan trọng
  manufacture_date: { type: Date },
  expiry_date: { type: Date },
  received_date: { type: Date, default: Date.now },

  // Số lượng trong lô
  initial_quantity: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 0 }, // Số lượng còn lại
  reserved_quantity: { type: Number, default: 0 },
  available_quantity: { type: Number, default: 0 },

  // Serial numbers (nếu có)
  has_serial_tracking: { type: Boolean, default: false },
  serial_numbers: [{ type: String }],

  // Vị trí lưu trữ
  warehouse_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  location_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },

  // Trạng thái lô
  status: {
    type: String,
    enum: ['active', 'expired', 'quarantined', 'released'],
    default: 'active'
  },

  // Ghi chú
  quality_check_passed: { type: Boolean, default: true },
  notes: { type: String },

  // Metadata
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

inventoryBatchSchema.pre('save', function(next) {
  this.available_quantity = this.quantity - this.reserved_quantity;
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('InventoryBatch', inventoryBatchSchema);
