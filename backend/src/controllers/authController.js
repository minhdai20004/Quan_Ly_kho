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
};