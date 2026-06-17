const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema({
  supplier_id:     { type: String },
  name:            { type: String },
  code:            { type: String },
  short_name:      { type: String },
  contact:         { type: mongoose.Schema.Types.Mixed },
  address:         { type: mongoose.Schema.Types.Mixed },
  business:        { type: mongoose.Schema.Types.Mixed },
  supplier_type:   { type: String, default: 'distributor' },
  payment_terms:   { type: String },
  payment_method:  { type: String },
  currency:        { type: String, default: 'VND' },
  rating:          { type: Number, default: 0 },
  total_orders:    { type: Number, default: 0 },
  total_spend:     { type: Number, default: 0 },
  is_blacklisted:  { type: Boolean, default: false },
  status:          { type: String, enum: ['active', 'inactive'], default: 'active' },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'suppliers',
});

partnerSchema.virtual('partner_name').get(function () { return this.name; });
partnerSchema.virtual('partner_code').get(function () { return this.code; });

module.exports = mongoose.model('Partner', partnerSchema);