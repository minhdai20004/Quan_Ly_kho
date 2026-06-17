const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'wms_secret_key';

const protect = (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer '))
      return res.status(401).json({ message: 'Không có token xác thực' });

    const token   = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user      = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin')
    return res.status(403).json({ message: 'Chỉ admin mới có quyền thực hiện' });
  next();
};

module.exports = { protect, adminOnly };