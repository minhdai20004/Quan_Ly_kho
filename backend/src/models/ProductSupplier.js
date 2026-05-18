const mongoose = require('mongoose');

const productSupplierSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  supplier_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  
  // Mã sản phẩm theo NCC
  supplier_sku: { type: String, required: true }, // SKU bên NCC (required)
  supplier_product_name: { type: String }, // Tên hàng theo NCC (có thể khác tên hệ thống)
  supplier_product_code: { type: String }, // Mã hàng bên NCC
  
  // Giá mua & đơn vị
  purchase_price: { type: Number, required: true, min: 0 },
  cost_per_unit: { type: Number }, // Giá vốn trên đơn vị tính (nếu khác purchase_price)
  currency: { type: String, default: 'VND', uppercase: true },
  
  // Đơn vị & số lượng
  unit_type: { 
    type: String,
    enum: ['each', 'box', 'case', 'pallet', 'kg', 'litre'],
    default: 'each'
  },
  units_per_pack: { type: Number, default: 1 }, // Số lượng trên 1 đơn vị mua
  min_order_qty: { type: Number, min: 0, default: 1 }, // MOQ
  max_order_qty: { type: Number, min: 0 }, // Max order
  order_multiple: { type: Number, default: 1 }, // Đặt hàng theo bội số
  
  // Thời gian
  lead_time_days: { 
    type: Number, 
    min: 0, 
    default: 1 
  }, // Ngày giao hàng từ NCC
  lead_time_buffer: { type: Number, default: 0 }, // Ngày dự phòng
  shipping_days: [{ 
    type: String, 
    enum: ['mon','tue','wed','thu','fri','sat','sun'] 
  }], // Các ngày giao hàng
  
  // Ưu tiên
  is_primary: { 
    type: Boolean, 
    default: false 
  }, // NCC chính của sản phẩm?
  priority: { 
    type: Number, 
    min: 1, 
    max: 10, 
    default: 5 
  }, // Độ ưu tiên (1=cao nhất)
  auto_create_po: { 
    type: Boolean, 
    default: false 
  }, // Tự động tạo PO khi cần
  
  // Giá & hiệu lực
  price_valid_from: { type: Date },
  price_valid_to: { type: Date },
  price_agreement: { type: String }, // Thỏa thuận giá (Annual, Quarterly, Monthly)
  
  // Hợp đồng
  contract_number: { type: String },
  contract_start_date: { type: Date },
  contract_end_date: { type: Date },
  
  // Lịch sử & metrics
  last_purchase_date: { type: Date },
  last_purchase_price: { type: Number },
  last_purchase_qty: { type: Number },
  last_po_number: { type: String },
  
  avg_purchase_price: { type: Number }, // Giá mua trung bình
  avg_lead_time: { type: Number }, // Lead time trung bình thực tế
  total_purchases: { type: Number, default: 0 }, // Tổng số lần mua
  total_quantity_purchased: { type: Number, default: 0 }, // Tổng số lượng mua
  
  // Chất lượng & dịch vụ
  quality_score: { type: Number, min: 0, max: 100 },
  defect_rate: { type: Number, min: 0, max: 100 }, // Tỷ lệ hàng lỗi %
  on_time_delivery_rate: { type: Number, min: 0, max: 100 }, // % giao đúng hạn
  
  // Ghi chú
  notes: { type: String },
  terms_conditions: { type: String },
  
  // Tài liệu đính kèm
  attachments: [{
    filename: { type: String },
    url: { type: String },
    type: { type: String }, // 'contract', 'price_list', 'certificate'
    uploaded_at: { type: Date, default: Date.now }
  }],
  
  // Metadata
  is_active: { type: Boolean, default: true },
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approved_at: { type: Date },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Compound index: mỗi sản phẩm-NCC là unique (không cho phép trùng)
productSupplierSchema.index({ product_id: 1, supplier_id: 1 }, { unique: true });

// Indexes tìm kiếm
productSupplierSchema.index({ supplier_sku: 1 });
productSupplierSchema.index({ purchase_price: 1 });
productSupplierSchema.index({ is_primary: -1 });
productSupplierSchema.index({ supplier_id: 1, priority: 1 });

productSupplierSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  
  // Tạo full_address nếu cần
  next();
});

module.exports = mongoose.model('ProductSupplier', productSupplierSchema);
