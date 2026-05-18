const mongoose = require('mongoose');

// Schema cho bảng giá theo số lượng (Price Tiers)
const priceTierSchema = new mongoose.Schema({
  min_quantity: { type: Number, required: true, min: 1 },
  max_quantity: { type: Number, required: true },
  unit_price: { type: Number, required: true, min: 0 },
  unit_id: { type: String }, // Đơn vị tính áp dụng (có thể null = áp dụng cho base unit)
  notes: { type: String },
});

// Schema cho giá theo nhóm khách hàng (Customer Group Prices)
const customerGroupPriceSchema = new mongoose.Schema({
  group_name: { type: String, required: true }, // VD: "Khách lẻ", "Đại lý cấp 1", "VIP"
  group_id: { type: String },
  price: { type: Number, required: true, min: 0 },
  discount_percent: { type: Number, min: 0, max: 100 },
  unit_id: { type: String },
  notes: { type: String },
});

const productPriceSchema = new mongoose.Schema({
  price_id: { 
    type: String, 
    unique: true, 
    required: true, 
    default: () => `PRC-${new mongoose.Types.ObjectId().toString().slice(-8).toUpperCase()}` 
  },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' }, // Nếu áp dụng cho variant cụ thể

  // Giá cơ bản
  cost_price: { type: Number, required: true, min: 0 }, // Giá vốn nhập vào
  selling_price: { type: Number, min: 0 }, // Giá bán lẻ
  wholesale_price: { type: Number, min: 0 }, // Giá sỉ cơ bản

  // Thuế
  tax_rate: { type: Number, default: 0, min: 0, max: 100 }, // VAT %
  tax_included: { type: Boolean, default: false }, // Giá đã gồm VAT?

  // Đồng tiền & thời hạn
  currency: { type: String, default: 'VND', uppercase: true },
  valid_from: { type: Date },
  valid_to: { type: Date },

  // Bảng giá theo số lượng
  price_tiers: [priceTierSchema],

  // Giá theo nhóm khách hàng
  customer_group_prices: [customerGroupPriceSchema],

  // Ghi chú chung
  notes: { type: String },

  // Metadata
  is_active: { type: Boolean, default: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

productPriceSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('ProductPrice', productPriceSchema);
