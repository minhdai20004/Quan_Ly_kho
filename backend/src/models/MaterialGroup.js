const mongoose = require('mongoose');

const materialGroupSchema = new mongoose.Schema({
  // Legacy field từ schema cũ — giữ lại để không break dữ liệu cũ
  // sparse: true để tránh duplicate-null unique index error
  category_id: { type: String, sparse: true },

  name:        { type: String, required: [true, 'Tên nhóm không được trống'] },
  code:        { type: String, required: [true, 'Mã nhóm không được trống'] },
  description: { type: String, default: '' },
  parent_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'MaterialGroup', default: null },
  status:      { type: String, default: 'active' },
}, {
  timestamps:  { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection:  'categories',
  toJSON:      { virtuals: true },
  toObject:    { virtuals: true },
});

// Index để query nhanh + tránh duplicate code
materialGroupSchema.index({ code: 1 }, { unique: true, sparse: true });
materialGroupSchema.index({ parent_id: 1 });

// Virtual aliases để frontend dùng cả 2 kiểu
materialGroupSchema.virtual('group_name').get(function () { return this.name; });
materialGroupSchema.virtual('group_code').get(function () { return this.code; });

module.exports = mongoose.model('MaterialGroup', materialGroupSchema);