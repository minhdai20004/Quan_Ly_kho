const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  material_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: true
  },
  warehouse_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: false
  },
  transaction_type: {
    type: String,
    enum: ['inbound', 'outbound', 'initial', 'adjust', 'transfer', 'create', 'update', 'delete'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  quantity_before: {
    type: Number,
    required: true
  },
  quantity_after: {
    type: Number,
    required: true
  },
  performed_by: {
    type: String, // Lưu username hoặc ID người thực hiện
    required: true
  },
  partner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner'
  },
  partner_name: {
    type: String // Cache lại tên đối tác tại thời điểm giao dịch
  },
  note: {
    type: String
  },
  reference_id: {
    type: String // Mã tham chiếu (ví dụ: số hóa đơn, mã phiếu nhập cũ)
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

TransactionSchema.index({ material_id: 1, created_at: -1 });

module.exports = mongoose.model('Transaction', TransactionSchema);