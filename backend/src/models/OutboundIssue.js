const mongoose = require('mongoose');

const outboundItemSchema = new mongoose.Schema({
  material_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  quantity:     { type: Number, required: true, min: 1 },
  unit_cost:    { type: Number, default: 0 },
  total_cost:   { type: Number, default: 0 },
  note:         { type: String, default: '' },
}, { _id: false });

const outboundIssueSchema = new mongoose.Schema({
  issue_code:     { type: String, required: true, unique: true, trim: true },
  partner_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Partner' },
  warehouse_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  items:          [outboundItemSchema],
  total_quantity: { type: Number, default: 0 },
  total_cost:     { type: Number, default: 0 },
  status:         { type: String, enum: ['draft', 'confirmed', 'cancelled'], default: 'draft' },
  note:           { type: String, default: '' },
  performed_by:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('OutboundIssue', outboundIssueSchema);