const mongoose = require('mongoose');

/**
 * MaterialBatch — Lô hàng
 * Mỗi lần nhập kho có thể tạo 1 lô riêng với NSX/HSD/số lô.
 * Khi vật tư có has_expiry_date = true, tồn kho thực = sum(batch.quantity)
 * theo FEFO (First Expired, First Out).
 */
const materialBatchSchema = new mongoose.Schema({
  material_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Material',  required: true },
  warehouse_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },

  // Số lô / Lot number — tự sinh nếu không nhập
  batch_no:         { type: String, required: true },

  // NSX + HSD
  manufacture_date: { type: Date, default: null },
  expiry_date:      { type: Date, required: true },

  // Số lượng còn lại trong lô này (đơn vị base)
  quantity:         { type: Number, required: true, min: 0, default: 0 },

  // Giá vốn lô này (tuỳ chọn)
  unit_cost:        { type: Number, default: 0 },

  notes:            { type: String, default: '' },

  // active / expired (tự động) / consumed (hết hàng)
  status:           { type: String, enum: ['active', 'expired', 'consumed'], default: 'active' },

}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection:  'materialbatches',
  toJSON:    { virtuals: true },
  toObject:  { virtuals: true },
});

// ── Indexes ────────────────────────────────────────────────────────────────────
materialBatchSchema.index({ material_id: 1, warehouse_id: 1, batch_no: 1 }, { unique: true });
materialBatchSchema.index({ expiry_date: 1 });                         // expiry alerts query
materialBatchSchema.index({ material_id: 1, expiry_date: 1 });        // nearest expiry per material
materialBatchSchema.index({ status: 1, expiry_date: 1 });             // dashboard alerts

// ── Pre-save: tự cập nhật status ──────────────────────────────────────────────
materialBatchSchema.pre('save', function (next) {
  if (this.quantity <= 0) {
    this.status = 'consumed';
  } else if (this.expiry_date && new Date(this.expiry_date) < new Date()) {
    this.status = 'expired';
  } else {
    this.status = 'active';
  }
  next();
});

// ── Virtual: days until expiry ─────────────────────────────────────────────────
materialBatchSchema.virtual('days_until_expiry').get(function () {
  if (!this.expiry_date) return null;
  const diff = new Date(this.expiry_date) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('MaterialBatch', materialBatchSchema);