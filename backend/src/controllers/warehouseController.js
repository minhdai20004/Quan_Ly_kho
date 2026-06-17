const Warehouse         = require('../models/Warehouse');
const WarehouseLocation = require('../models/WarehouseLocation');

exports.getAll = async (req, res) => {
  try {
    const items = await Warehouse.find().sort({ code: 1 }).lean();
    const result = items.map(w => ({
      ...w,
      warehouse_name: w.name,
      warehouse_code: w.code,
      is_active: w.status === 'active',
    }));
    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const item = await Warehouse.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ message: 'Không tìm thấy kho' });
    const locations = await WarehouseLocation.find({ warehouse_id: req.params.id }).lean();
    res.json({ data: { ...item, warehouse_name: item.name, warehouse_code: item.code, is_active: item.status === 'active', locations } });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, code, warehouse_name, warehouse_code } = req.body;
    const finalName = name || warehouse_name;
    const finalCode = code || warehouse_code;
    if (!finalCode || !finalName)
      return res.status(400).json({ message: 'Thiếu tên kho hoặc mã kho' });

    const exists = await Warehouse.findOne({ code: finalCode.trim() });
    if (exists) return res.status(409).json({ message: `Mã kho "${finalCode}" đã tồn tại` });

    const item = await Warehouse.create({ ...req.body, name: finalName.trim(), code: finalCode.trim() });
    res.status(201).json({ data: { ...item.toObject(), warehouse_name: item.name, warehouse_code: item.code }, message: 'Tạo kho thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.warehouse_name) body.name = body.warehouse_name;
    if (body.warehouse_code) body.code = body.warehouse_code;
    if (body.is_active !== undefined) body.status = body.is_active ? 'active' : 'inactive';

    const item = await Warehouse.findByIdAndUpdate(req.params.id, body, { new: true });
    if (!item) return res.status(404).json({ message: 'Không tìm thấy kho' });
    res.json({ data: { ...item.toObject(), warehouse_name: item.name, warehouse_code: item.code }, message: 'Cập nhật thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await Warehouse.findByIdAndDelete(req.params.id);
    res.json({ message: 'Xóa kho thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

exports.getLocations = async (req, res) => {
  try {
    const items = await WarehouseLocation.find({ warehouse_id: req.params.id }).sort({ location_code: 1 }).lean();
    res.json({ data: items });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

exports.createLocation = async (req, res) => {
  try {
    const { location_code } = req.body;
    if (!location_code) return res.status(400).json({ message: 'Thiếu location_code' });
    const exists = await WarehouseLocation.findOne({ warehouse_id: req.params.id, location_code });
    if (exists) return res.status(409).json({ message: `Vị trí "${location_code}" đã tồn tại` });
    const item = await WarehouseLocation.create({ ...req.body, warehouse_id: req.params.id });
    res.status(201).json({ data: item, message: 'Thêm vị trí thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const item = await WarehouseLocation.findByIdAndUpdate(req.params.locationId, req.body, { new: true });
    if (!item) return res.status(404).json({ message: 'Không tìm thấy vị trí' });
    res.json({ data: item, message: 'Cập nhật thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

exports.deleteLocation = async (req, res) => {
  try {
    await WarehouseLocation.findByIdAndDelete(req.params.locationId);
    res.json({ message: 'Xóa vị trí thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};