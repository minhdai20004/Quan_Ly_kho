const MaterialGroup = require('../models/MaterialGroup');

// ─── Helper: format Mongoose/Mongo errors thành message đọc được ──────────────
function formatError(err) {
  // Duplicate key (unique index violation)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    const value = err.keyValue?.[field];
    if (field === 'code') return `Mã nhóm "${value}" đã tồn tại`;
    return `Dữ liệu bị trùng (field: ${field})`;
  }
  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return messages.join(', ');
  }
  return err.message || 'Lỗi server';
}

// ─── GET ALL ──────────────────────────────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const groups = await MaterialGroup.find()
      .populate('parent_id', 'code name')
      .sort({ code: 1 })
      .lean();

    const data = groups.map(g => ({
      ...g,
      group_code: g.code,
      group_name: g.name,
    }));
    res.json({ data });
  } catch (err) {
    console.error('[MaterialGroup.getAll]', err);
    res.status(500).json({ message: formatError(err) });
  }
};

// ─── GET BY ID ────────────────────────────────────────────────────────────────
exports.getById = async (req, res) => {
  try {
    const group = await MaterialGroup.findById(req.params.id)
      .populate('parent_id', 'code name')
      .lean();
    if (!group) return res.status(404).json({ message: 'Không tìm thấy nhóm' });
    res.json({ data: { ...group, group_code: group.code, group_name: group.name } });
  } catch (err) {
    console.error('[MaterialGroup.getById]', err);
    res.status(500).json({ message: formatError(err) });
  }                                                                                                                  
};

// ─── CREATE ───────────────────────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    // Normalize field names — accept cả code/group_code/category_code
    const code = (req.body.code || req.body.group_code || req.body.category_code || '').trim();
    const name = (req.body.name || req.body.group_name || req.body.category_name || '').trim();
    const { parent_id, description, status } = req.body;

    if (!code) return res.status(400).json({ message: 'Mã nhóm không được trống' });
    if (!name) return res.status(400).json({ message: 'Tên nhóm không được trống' });

    // Check duplicate ở app-level trước khi Mongo unique index chặn
    const exists = await MaterialGroup.findOne({ code });
    if (exists) return res.status(400).json({ message: `Mã nhóm "${code}" đã tồn tại` });

    const group = await MaterialGroup.create({
      code,
      name,
      parent_id:   parent_id || null,
      description: description || '',
      status:      status || 'active',
      // Không set category_id — để null/undefined, sparse index sẽ handle
    });

    res.status(201).json({
      data:    { ...group.toObject(), group_code: group.code, group_name: group.name },
      message: 'Tạo nhóm thành công',
    });
  } catch (err) {
    console.error('[MaterialGroup.create]', err);
    res.status(err.code === 11000 ? 400 : 500).json({ message: formatError(err) });
  }
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Normalize field names
    if (updateData.group_code)    { updateData.code = updateData.group_code;    delete updateData.group_code; }
    if (updateData.group_name)    { updateData.name = updateData.group_name;    delete updateData.group_name; }
    if (updateData.category_code) { updateData.code = updateData.category_code; delete updateData.category_code; }
    if (updateData.category_name) { updateData.name = updateData.category_name; delete updateData.category_name; }

    // Nếu đổi code, check duplicate với các group khác
    if (updateData.code) {
      const conflict = await MaterialGroup.findOne({ code: updateData.code, _id: { $ne: req.params.id } });
      if (conflict) return res.status(400).json({ message: `Mã nhóm "${updateData.code}" đã tồn tại` });
    }

    const group = await MaterialGroup.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!group) return res.status(404).json({ message: 'Không tìm thấy nhóm' });

    res.json({
      data:    { ...group.toObject(), group_code: group.code, group_name: group.name },
      message: 'Cập nhật thành công',
    });
  } catch (err) {
    console.error('[MaterialGroup.update]', err);
    res.status(err.code === 11000 ? 400 : 500).json({ message: formatError(err) });
  }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────
exports.delete = async (req, res) => {
  try {
    const Material = require('../models/Material');
    const hasChild = await Material.exists({ group_id: req.params.id, deleted_at: null });
    if (hasChild)
      return res.status(400).json({ message: 'Nhóm đang có vật tư, không thể xóa' });

    const deleted = await MaterialGroup.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Không tìm thấy nhóm' });

    res.json({ message: 'Xóa nhóm thành công' });
  } catch (err) {
    console.error('[MaterialGroup.delete]', err);
    res.status(500).json({ message: formatError(err) });
  }
};