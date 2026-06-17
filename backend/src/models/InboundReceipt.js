const mongoose = require('mongoose');

const { Schema } = mongoose;

// ─── Sub-schema: dòng hàng trong phiếu nhập ──────────────────────────────────
const receiptItemSchema = new Schema({
  material_id:       { type: Schema.Types.ObjectId, ref: 'Material', required: true },
  quantity:          { type: Number, required: true, min: 0 },
  quantity_received: { type: Number, default: 0, min: 0 },
  unit_cost:         { type: Number, default: 0,  min: 0 },
  batch_no:          { type: String, default: '' },
  manufacture_date:  { type: Date,   default: null },
  expiry_date:       { type: Date,   default: null },
  note:              { type: String, default: '' },
}, { _id: false });

// ─── Main schema ─────────────────────────────────────────────────────────────
const inboundReceiptSchema = new Schema({
  receipt_code: {
    type:   String,
    unique: true,
  },
  receipt_date: { type: Date, default: Date.now },
  partner_id:   { type: Schema.Types.ObjectId, ref: 'Partner', default: null },
  warehouse_id: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  items:        [receiptItemSchema],

  total_quantity: { type: Number, default: 0 },
  total_cost:     { type: Number, default: 0 },

  status: {
    type:    String,
    enum:    ['draft', 'confirmed', 'cancelled'],
    default: 'draft',
  },

  note:          { type: String, default: '' },
  created_by:    { type: String, default: '' },
  confirmed_by:  { type: String, default: null },
  cancelled_by:  { type: String, default: null },
  confirmed_at:  { type: Date,   default: null },
  cancelled_at:  { type: Date,   default: null },
}, {
  timestamps: true,
  collection: 'inbound_receipts',
});

module.exports = mongoose.model('InboundReceipt', inboundReceiptSchema);