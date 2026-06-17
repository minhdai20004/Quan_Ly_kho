const mongoose = require('mongoose');

// Đơn vị quy đổi: VD gói (base), thùng (x40), lốc (x6)
const unitSchema = new mongoose.Schema({
  name:     { type: String, required: true },  // "gói", "thùng", "lốc"
  ratio:    { type: Number, required: true, default: 1 }, // 1 thùng = 40 gói → ratio: 40
  is_base:  { type: Boolean, default: false }, // đơn vị nhỏ nhất (gói = true)
}, { _id: false });

const materialSchema = new mongoose.Schema({
  product_id:          { type: String },
  product_code:        { type: String },
  sku:                 { type: String },
  product_name:        { type: String },
  product_type:        { type: String, default: 'goods' },
  status:              { type: String, enum: ['active', 'inactive'], default: 'active' },
  is_bundle:           { type: Boolean, default: false },
  bundle_type:         { type: String, default: 'fixed' },
  images:              [{ type: String }],
  tags:                [{ type: String }],
  meta_keywords:       [{ type: String }],
  has_batch_tracking:  { type: Boolean, default: false },
  has_expiry_date:     { type: Boolean, default: false },
  has_serial_number:   { type: Boolean, default: false },
  version:             { type: Number, default: 1 },
  category_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'MaterialGroup' },
  deleted_at:          { type: Date, default: null },

  // ── Đơn vị tính đa cấp ──────────────────────────────────────────────────
  // VD mì tôm: units = [
  //   { name: 'gói',   ratio: 1,  is_base: true  },
  //   { name: 'lốc',   ratio: 5,  is_base: false },
  //   { name: 'thùng', ratio: 30, is_base: false },
  // ]
  units: { type: [unitSchema], default: [] },

  // Tồn kho (đơn vị base) — sync từ Inventory module sau
  // Hiện tại dùng tạm để hiển thị
  stock: { type: Number, default: 0 },

}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'products',
  toJSON:    { virtuals: true },
  toObject:  { virtuals: true },
});

// Virtuals
materialSchema.virtual('material_name').get(function () { return this.product_name; });
materialSchema.virtual('material_code').get(function () { return this.product_code; });

// Virtual: hiển thị tồn kho dạng "150 gói (5 thùng)"
materialSchema.virtual('stock_display').get(function () {
  if (!this.units?.length) return `${this.stock || 0}`;
  const base = this.units.find(u => u.is_base);
  const baseName = base?.name || '';
  const stock = this.stock || 0;

  // Tìm đơn vị lớn nhất có thể quy đổi
  const sorted = [...this.units]
    .filter(u => !u.is_base && u.ratio > 1)
    .sort((a, b) => b.ratio - a.ratio);

  if (!sorted.length) return `${stock}${baseName ? ' ' + baseName : ''}`;

  const biggest = sorted[0];
  const bigQty  = Math.floor(stock / biggest.ratio);
  const remain  = stock % biggest.ratio;

  if (bigQty === 0) return `${stock}${baseName ? ' ' + baseName : ''}`;
  if (remain === 0) return `${bigQty} ${biggest.name} (${stock} ${baseName})`;
  return `${bigQty} ${biggest.name} ${remain} ${baseName} (${stock} ${baseName})`;
});

module.exports = mongoose.model('Material', materialSchema);