const Partner = require('../models/Partner');

// Lấy danh sách đối tượng (filter theo type: supplier/customer/employee)
exports.getAll = async (req, res) => {
  try {
    const { object_type, search, status } = req.query;
    const filter = {};
    if (object_type) filter.object_type = object_type;
    if (status)      filter.status = status;
    if (search) filter.$or = [
      { object_code: { $regex: search, $options: 'i' } },
      { object_name: { $regex: search, $options: 'i' } },
      { phone:       { $regex: search, $options: 'i' } },
      { tax_code:    { $regex: search, $options: 'i' } },
    ];

    const items = await Partner.find(filter).sort({ object_code: 1 }).lean();
    res.json({ data: items });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// Lấy 1 đối tượng
exports.getById = async (req, res) => {
  try {
    const item = await Partner.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ message: 'Không tìm thấy đối tượng' });
    res.json({ data: item });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// Tạo đối tượng mới
exports.create = async (req, res) => {
  try {
    const { object_code, object_name, object_type } = req.body;
    if (!object_code || !object_name || !object_type)
      return res.status(400).json({ message: 'Thiếu object_code, object_name hoặc object_type' });

    const exists = await Partner.findOne({ object_code: object_code.trim() });
    if (exists) return res.status(400).json({ message: `Mã đối tượng "${object_code}" đã tồn tại` });

    const item = await Partner.create({ ...req.body, object_code: object_code.trim(), object_name: object_name.trim() });
    res.status(201).json({ data: item, message: 'Tạo đối tượng thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// Cập nhật
exports.update = async (req, res) => {
  try {
    const item = await Partner.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: 'Không tìm thấy đối tượng' });
    res.json({ data: item, message: 'Cập nhật thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// Xóa
exports.delete = async (req, res) => {
  try {
    await Partner.findByIdAndDelete(req.params.id);
    res.json({ message: 'Xóa thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};