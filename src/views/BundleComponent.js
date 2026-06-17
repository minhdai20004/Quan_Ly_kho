const mongoose = require('mongoose');

const BundleComponentSchema = new mongoose.Schema({
  bundle_material_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: true,
    comment: 'ID của sản phẩm chính (Bundle/Combo)'
  },
  component_material_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: true,
    comment: 'ID của vật tư thành phần'
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    comment: 'Số lượng thành phần cần có trong 1 đơn vị Bundle'
  }
});

BundleComponentSchema.index({ bundle_material_id: 1 });

module.exports = mongoose.model('BundleComponent', BundleComponentSchema);