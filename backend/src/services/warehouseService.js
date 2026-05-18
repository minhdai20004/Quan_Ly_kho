const Warehouse = require('../models/Warehouse');
const Location = require('../models/Location');

exports.getWarehouses = async () => {
  return Warehouse.find().sort({ is_default: -1, name: 1 }).lean();
};

exports.getWarehouseById = async (id) => {
  const warehouse = await Warehouse.findOne({ warehouse_id: id });
  if (!warehouse) return null;

  const locations = await Location.find({ warehouse_id: warehouse._id })
    .sort({ aisle: 1, rack: 1, bin: 1 })
    .lean();

  return { ...warehouse.toObject(), locations };
};

exports.createWarehouse = async (data) => {
  if (data.is_default) {
    await Warehouse.updateMany({ is_default: true }, { is_default: false });
  }
  const warehouse = new Warehouse(data);
  return warehouse.save();
};

exports.updateWarehouse = async (id, data) => {
  if (data.is_default) {
    await Warehouse.updateMany({ is_default: true }, { is_default: false });
  }
  return Warehouse.findOneAndUpdate({ warehouse_id: id }, data, { new: true, runValidators: true });
};

exports.deleteWarehouse = async (id) => {
  return Warehouse.findOneAndDelete({ warehouse_id: id });
};

exports.getLocations = async (warehouseId) => {
  const warehouse = await Warehouse.findOne({ warehouse_id: warehouseId });
  if (!warehouse) return null;

  return Location.find({ warehouse_id: warehouse._id })
    .sort({ aisle: 1, rack: 1, bin: 1 })
    .lean();
};

exports.createLocation = async (warehouseId, data) => {
  const warehouse = await Warehouse.findOne({ warehouse_id: warehouseId });
  if (!warehouse) throw new Error('Warehouse not found');

  data.warehouse_id = warehouse._id;
  const location = new Location(data);
  return location.save();
};

exports.updateLocation = async (warehouseId, locationId, data) => {
  const warehouse = await Warehouse.findOne({ warehouse_id: warehouseId });
  if (!warehouse) throw new Error('Warehouse not found');

  return Location.findOneAndUpdate(
    { _id: locationId, warehouse_id: warehouse._id },
    data,
    { new: true, runValidators: true }
  );
};

exports.deleteLocation = async (warehouseId, locationId) => {
  const warehouse = await Warehouse.findOne({ warehouse_id: warehouseId });
  if (!warehouse) throw new Error('Warehouse not found');

  return Location.findOneAndDelete({ _id: locationId, warehouse_id: warehouse._id });
};