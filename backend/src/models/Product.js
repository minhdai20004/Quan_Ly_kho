const mongoose = require('mongoose');

const storageInfoSchema = new mongoose.Schema({
  weight: { type: Number, min: 0 }, // kg
  length: { type: Number, min: 0 }, // cm
  width: { type: Number, min: 0 }, // cm
  height: { type: Number, min: 0 }, // cm
  volume: { type: Number, min: 0 }, // m³
  storage_condition: {
    type: String,
    enum: ['normal', 'cold', 'frozen', 'dry', 'humid'],
    default: 'normal'
  },
  min_temperature: { type: Number }, // °C
  max_temperature: { type: Number }, // °C
  is_fragile: { type: Boolean, default: false },
  is_hazardous: { type: Boolean, default: false },
  stack_limit: { type: Number, min: 1 }, // Số lớp chồng tối đa
  storage_unit: { 
    type: String, 
    enum: ['pallet', 'carton', 'box', 'bag', 'drum', 'bottle'],
    default: 'carton'
  },
});

const accountingInfoSchema = new mongoose.Schema({
  account_code: { type: String }, // Mã tài khoản kế toán
  valuation_method: {
    type: String,
    enum: ['FIFO', 'LIFO', 'WeightedAverage', 'StandardCost'],
    default: 'FIFO'
  },
  abc_category: {
    type: String,
    enum: ['A', 'B', 'C'],
    default: 'C'
  },
  is_inventoried: { type: Boolean, default: true },
  last_counted_at: { type: Date },
  last_counted_qty: { type: Number },
});

const alertConfigSchema = new mongoose.Schema({
  alert_low_stock: { type: Boolean, default: true },
  alert_expiry_days: { type: Number, min: 0 }, // Cảnh báo trước X ngày hết hạn
  auto_reorder: { type: Boolean, default: false },
  reorder_qty: { type: Number, min: 0 },
});

// MAIN PRODUCT SCHEMA
const productSchema = new mongoose.Schema({
  // 1. THÔNG TIN CƠ BẢN
  product_id: { type: String, unique: true, required: true },
  product_code: { type: String, required: true, unique: true, uppercase: true }, // SP-001
  sku: { type: String, required: true, unique: true }, // Stock Keeping Unit
  barcode: { type: String, unique: true, sparse: true }, // EAN-13, UPC, QR
  
  product_name: { type: String, required: true, trim: true },
  product_name_en: { type: String, trim: true },
  short_description: { type: String, maxlength: 200 },
  description: { type: String },
  
  product_type: {
    type: String,
    enum: ['goods', 'service', 'combo', 'raw_material', 'finished_goods'],
    default: 'goods'
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'out_of_stock', 'draft', 'discontinued'],
    default: 'active'
  },
  
  images: [{ type: String }], // URLs
  thumbnail: { type: String },

  // 2. PHÂN LOẠI (References)
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  subcategory_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  brand_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
  product_line: { type: String },
  tags: [{ type: String }], // Tags / search labels
  origin_country: { type: String },

  // 3. EMBEDDED SUB-DOCUMENTS (một số lưu trực tiếp)
  storage_info: storageInfoSchema,
  accounting_info: accountingInfoSchema,
  alert_config: alertConfigSchema,

  // 4. BIẾN THỂ & ĐƠN VỊ TÍNH (References to separate collections)
  // Lưu ý: variants, units, prices được quản lý riêng
  
  // 5. COMBO / BUNDLE
  is_bundle: { type: Boolean, default: false },
  bundle_type: { type: String, enum: ['fixed', 'dynamic', 'optional'], default: 'fixed' },

  // 6. SEO & METADATA
  meta_title: { type: String },
  meta_description: { type: String },
  meta_keywords: [{ type: String }],

  // 7. TRACKING
  has_batch_tracking: { type: Boolean, default: false },
  has_expiry_date: { type: Boolean, default: false },
  has_serial_number: { type: Boolean, default: false },

  // 8. CUSTOM FIELDS (flexible)
  custom_fields: { type: Map, of: mongoose.Schema.Types.Mixed },

  // Timestamps
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  deleted_at: { type: Date }, // Soft delete
  version: { type: Number, default: 1 }, // Optimistic locking
});

// Indexes
productSchema.index({ product_code: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ product_name: 'text', product_name_en: 'text', tags: 'text' }); // Full-text search
productSchema.index({ category_id: 1 });
productSchema.index({ brand_id: 1 });
productSchema.index({ status: 1, created_at: -1 });

// Pre-save hook
productSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Product', productSchema);
