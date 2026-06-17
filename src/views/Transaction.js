const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  material_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
  transaction_type: { type: String },
  quantity:         { type: Number, default: 0 },
  quantity_before:  { type: Number, default: 0 },
  quantity_after:   { type: Number, default: 0 },
  performed_by:     { type: String },
  note:             { type: String, default: '' },
  warehouse_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'transactions',
});

module.exports = mongoose.model('Transaction', transactionSchema);