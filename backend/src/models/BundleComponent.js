const mongoose = require('mongoose');

const bundleComponentSchema = new mongoose.Schema({
  bundle_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Material', 
    required: true 
  },
  component_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Material', 
    required: true 
  },
  // Số lượng component trong bundle
  quantity: { 
    type: Number, 
    required: true, 
    min: 1, 
    default: 1 
  },
  // Giá (có thể khác với giá bán lẻ bình thường khi nằm trong combo)
  bundle_price: { 
    type: Number, 
    min: 0 
  },
  // Bắt buộc phải có?
  is_required: { 
    type: Boolean, 
    default: true 
  },
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