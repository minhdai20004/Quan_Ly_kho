const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'wms_secret_key';

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: 'Thiếu username hoặc password' });

    const user = await User.findOne({ username, is_active: true });
    if (!user)
      return res.status(401).json({ message: 'Tài khoản không tồn tại hoặc đã bị khóa' });

    const match = await user.comparePassword(password);
    if (!match)
      return res.status(401).json({ message: 'Sai mật khẩu' });

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { username, password, full_name, email, role } = req.body;
    const exists = await User.findOne({ username });
    if (exists)
      return res.status(409).json({ message: 'Username đã tồn tại' });

    const user = await User.create({ username, password, full_name, email, role });
    res.status(201).json({
      message: 'Tạo tài khoản thành công',
      user: { id: user._id, username: user.username, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};// ─── Thêm vào cuối authController.js ────────────────────────────────────────

// GET /api/auth/users — danh sách user (admin only)
exports.getAll = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ created_at: -1 }).lean();
    res.json({ data: users });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// PUT /api/auth/users/:id — cập nhật user
exports.updateUser = async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const update = { ...rest };
    if (password) update.password = password; // model sẽ hash lại qua pre-save nếu có hook

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'Không tìm thấy user' });
    res.json({ data: user, message: 'Cập nhật thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// PATCH /api/auth/users/:id/toggle — bật/tắt tài khoản
exports.toggleActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy user' });
    if (user._id.toString() === req.user.id)
      return res.status(400).json({ message: 'Không thể khoá tài khoản của chính mình' });

    user.is_active = !user.is_active;
    await user.save();
    res.json({ message: `${user.is_active ? 'Đã mở' : 'Đã khoá'} tài khoản ${user.username}`, data: { is_active: user.is_active } });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// DELETE /api/auth/users/:id
exports.deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id)
      return res.status(400).json({ message: 'Không thể xoá tài khoản của chính mình' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Xoá tài khoản thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};