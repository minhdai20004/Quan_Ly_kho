const mongoose = require('mongoose');

const productUnitSchema = new mongoose.Schema({
  unit_id: { type: String, required: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true }, // Vd: "Cái", "Hộp", "Thùng"
  abbreviation: { type: String }, // Vd: "cái", "h", "th"
  ratio: { type: Number, required: true, min: 1 }, // Tỷ lệ so với đơn vị cơ bản (base unit = 1)
  barcode: { type: String },
  is_base: { type: Boolean, default: false }, // Đơn vị cơ bản?
  is_active: { type: Boolean, default: true },
  notes: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Compound unique index: mỗi product không có 2 unit cùng tên
productUnitSchema.index({ product_id: 1, name: 1 }, { unique: true });

productUnitSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('ProductUnit', productUnitSchema);
