const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  supplier_id: { type: String, unique: true, required: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, unique: true, uppercase: true },
  short_name: { type: String }, // Tên viết tắt
  
  // Thông tin liên hệ
  contact: {
    name: { type: String, required: true }, // Người liên hệ chính
    position: { type: String },
    phone: { type: String, required: true },
    mobile: { type: String },
    email: { type: String, required: true },
    alternate_email: { type: String },
    wechat: { type: String },
    zalo: { type: String },
    skype: { type: String },
  },
  
  // Địa chỉ
  address: {
    street: { type: String, required: true },
    ward: { type: String }, // Phường/Xã
    district: { type: String }, // Quận/Huyện
    city: { type: String }, // Tỉnh/Thành phố
    country: { type: String, default: 'Vietnam' },
    postal_code: { type: String },
    full_address: { type: String }, // Địa chỉ đầy đủ (được sinh từ các phần trên)
    warehouse_address: { type: String }, // Địa chỉ kho riêng (nếu khác trụ sở)
  },
  
  // Thông tin doanh nghiệp
  business: {
    tax_id: { type: String, required: true, unique: true }, // MST (required)
    business_type: { 
      type: String, 
      enum: ['tndn', 'cnhd', 'ctycp', 'dtcp', 'foreign', 'other'],
      default: 'tndn'
    },
    business_license: { type: String }, // Số giấy phép KD
    business_license_date: { type: Date }, // Ngày cấp
    business_license_expiry: { type: Date }, // Ngày hết hạn
    website: { type: String },
    facebook: { type: String },
    linkedin: { type: String },
    notes: { type: String },
  },
  
  // Phân loại nhà cung cấp
  supplier_type: {
    type: String,
    enum: ['manufacturer', 'distributor', 'agent', 'importer', 'trader', 'service'],
    default: 'distributor'
  },
  
  // Điều khoản mua hàng mặc định
  payment_terms: { 
    type: String, 
    enum: ['COD', 'Net7', 'Net15', 'Net30', 'Net45', 'Net60', 'Cash'],
    default: 'Net30'
  },
  payment_method: {
    type: String,
    enum: ['bank_transfer', 'cash', 'check', 'credit_card'],
    default: 'bank_transfer'
  },
  currency: { type: String, default: 'VND', uppercase: true },
  credit_limit: { type: Number, min: 0 },
  credit_days: { type: Number, min: 0 }, // Số ngày được nợ
  
  // Điều kiện giao hàng
  shipping_method: { type: String },
  incoterms: { type: String }, // Incoterms 2020
  
  // Đánh giá & hiệu suất
  rating: { 
    type: Number, 
    min: 1, 
    max: 5,
    default: 3 
  },
  performance_score: { 
    type: Number, 
    min: 0, 
    max: 100 
  },
  quality_rating: { type: Number, min: 1, max: 5 }, // Chất lượng hàng hóa
  delivery_rating: { type: Number, min: 1, max: 5 }, // Đúng hạn
  price_rating: { type: Number, min: 1, max: 5 }, // Cạnh tranh giá
  
  // Lịch sử
  total_orders: { type: Number, default: 0 },
  total_spend: { type: Number, default: 0 }, // Tổng chi phí
  last_order_date: { type: Date },
  avg_lead_time: { type: Number }, // Ngày giao trung bình
  on_time_delivery_rate: { type: Number, min: 0, max: 100 }, // % giao đúng hạn
  
  // Cảnh báo
  blacklist_reason: { type: String },
  is_blacklisted: { type: Boolean, default: false },
  
  // Trạng thái
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'blacklisted'],
    default: 'active'
  },
  
  // Metadata
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  deleted_at: { type: Date },
});

// Indexes
supplierSchema.index({ name: 1 });
supplierSchema.index({ code: 1 });
supplierSchema.index({ 'business.tax_id': 1 });
supplierSchema.index({ 'contact.email': 1 });
supplierSchema.index({ status: 1, rating: -1 });
supplierSchema.index({ supplier_type: 1 });

// Auto-generate full_address
supplierSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  
  // Tạo full_address từ các thành phần
  if (this.address) {
    const parts = [
      this.address.street,
      this.address.ward,
      this.address.district,
      this.address.city,
      this.address.country
    ].filter(Boolean);
    this.address.full_address = parts.join(', ');
  }
  
  // Calculate performance score nếu cần
  if (this.quality_rating && this.delivery_rating && this.price_rating) {
    this.performance_score = Math.round(
      (this.quality_rating + this.delivery_rating + this.price_rating) / 3 * 20
    );
  }
  
  next();
});

module.exports = mongoose.model('Supplier', supplierSchema);
