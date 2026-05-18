const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  brand_id: { type: String, unique: true, required: true },
  name: { type: String, required: true, trim: true },
  name_en: { type: String, trim: true },
  logo_url: { type: String },
  website: { type: String },
  description: { type: String },
  country: { type: String }, // Xuất xứ thương hiệu
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

brandSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Brand', brandSchema);
