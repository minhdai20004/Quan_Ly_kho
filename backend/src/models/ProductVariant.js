const mongoose = require('mongoose');

const productVariantSchema = new mongoose.Schema({
  variant_id: { type: String, unique: true, required: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  sku: { type: String, required: true, unique: true },
  barcode: { type: String, unique: true, sparse: true },
  attributes: {
    // Biến thể theo màu, size, dung tích, v.v.
    color: { type: String },
    size: { type: String },
    capacity: { type: String },
    style: { type: String },
    custom_attrs: { type: Map, of: String }, // Thuộc tính tùy chỉnh
  },
  price: { type: Number, min: 0 },
  cost_price: { type: Number, min: 0 },
  compare_at_price: { type: Number, min: 0 }, // Giá niêm yết cũ
  weight: { type: Number },
  dimensions: {
    length: { type: Number },
    width: { type: Number },
    height: { type: Number },
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active'
  },
  images: [{ type: String }], // URLs ảnh riêng của variant
  inventory: {
    quantity_on_hand: { type: Number, default: 0 },
    quantity_reserved: { type: Number, default: 0 },
    quantity_available: { type: Number, default: 0 }, // on_hand - reserved
  },
  track_inventory: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

productVariantSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  // Tính quantity_available
  if (this.inventory) {
    this.inventory.quantity_available = this.inventory.quantity_on_hand - (this.inventory.quantity_reserved || 0);
  }
  next();
});

module.exports = mongoose.model('ProductVariant', productVariantSchema);
