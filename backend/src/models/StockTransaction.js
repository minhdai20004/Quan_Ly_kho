const mongoose = require('mongoose');

const stockTransactionSchema = new mongoose.Schema({
  product_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouse_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  transaction_type: { type: String, enum: ['inbound', 'outbound', 'initial', 'adjust'], required: true },
  quantity:         { type: Number, required: true },
  quantity_before:  { type: Number, default: 0 },
  quantity_after:   { type: Number, default: 0 },
  note:             { type: String, default: '' },
  performed_by:     { type: String, default: 'admin' },
  created_at:       { type: Date, default: Date.now },
});

stockTransactionSchema.index({ product_id: 1, created_at: -1 });
stockTransactionSchema.index({ created_at: -1 });
stockTransactionSchema.index({ transaction_type: 1 });

module.exports = mongoose.model('StockTransaction', stockTransactionSchema);
