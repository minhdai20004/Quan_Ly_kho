const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String, required: true, unique: true, trim: true,
    },
    password: {
      type: String, required: true,
    },
    full_name: {
      type: String, trim: true, default: '',
    },
    email: {
      type: String, trim: true, lowercase: true, default: '',
    },
    role: {
      type: String, enum: ['admin', 'staff'], default: 'staff',
    },
    is_active: {
      type: Boolean, default: true,
    },
  },
  { timestamps: true }
);

// Hash password trước khi save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// So sánh password
userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', userSchema);