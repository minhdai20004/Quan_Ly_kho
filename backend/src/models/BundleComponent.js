const mongoose = require('mongoose');

const bundleComponentSchema = new mongoose.Schema({
  bundle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  component_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  
  // Số lượng component trong bundle
  quantity: { type: Number, required: true, min: 1, default: 1 },
  
  // Đơn vị tính của component
  unit_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductUnit' },
  
  // Giá (có thể khác với giá bán lẻ normal)
  bundle_price: { type: Number, min: 0 },
  
  // Thứ tự hiển thị
  sort_order: { type: Number, default: 0 },
  
  // Bắt buộc phải có?
  is_required: { type: Boolean, default: true },
  
  // Ghi chú cho component này trong bundle
  notes: { type: String },
  
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

bundleComponentSchema.index({ bundle_id: 1, component_id: 1 }, { unique: true });

bundleComponentSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('BundleComponent', bundleComponentSchema);
