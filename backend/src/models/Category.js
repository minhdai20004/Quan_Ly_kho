const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  category_id: { type: String, unique: true, required: true },
  name: { type: String, required: true, trim: true },
  category_code: { type: String, trim: true, uppercase: true },
  name_en: { type: String, trim: true },
  description: { type: String },
  parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  level: { type: Number, default: 1 },
  is_active: { type: Boolean, default: true },
  sort_order: { type: Number, default: 0 },
  image_url: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

categorySchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Category', categorySchema);
