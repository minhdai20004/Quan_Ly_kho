const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  location_id: { type: String, unique: true, required: true },
  warehouse_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  code: { type: String, required: true }, // VD: A-01-03
  name: { type: String },
  type: {
    type: String,
    enum: ['shelf', 'rack', 'bin', 'dock', 'cold_room', 'hazardous'],
    default: 'shelf'
  },
  aisle: { type: String }, // Dãy (A, B, C...)
  rack: { type: String }, // Kệ (1, 2, 3...)
  bin: { type: String }, // Ô (A, B, C...)
  level: { type: Number }, // Tầng
  max_weight: { type: Number }, // Giới hạn trọng lượng (kg)
  max_height: { type: Number }, // Giới hạn chồng lớp
  temperature_range: {
    min: { type: Number },
    max: { type: Number }
  },
  is_fragile_zone: { type: Boolean, default: false },
  is_hazardous_zone: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'maintenance'],
    default: 'available'
  },
  notes: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Compound index: mỗi warehouse không có 2 location cùng code
locationSchema.index({ warehouse_id: 1, code: 1 }, { unique: true });

locationSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Location', locationSchema);
