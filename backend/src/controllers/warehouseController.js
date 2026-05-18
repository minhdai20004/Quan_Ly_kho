const warehouseService = require('../services/warehouseService');

exports.getWarehouses = async (req, res) => {
  try {
    const warehouses = await warehouseService.getWarehouses();
    res.json({ success: true, data: warehouses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getWarehouse = async (req, res) => {
  try {
    const warehouse = await warehouseService.getWarehouseById(req.params.id);
    if (!warehouse) return res.status(404).json({ success: false, error: 'Warehouse not found' });
    res.json({ success: true, data: warehouse });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createWarehouse = async (req, res) => {
  try {
    const warehouse = await warehouseService.createWarehouse(req.body);
    res.status(201).json({ success: true, data: warehouse });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateWarehouse = async (req, res) => {
  try {
    const warehouse = await warehouseService.updateWarehouse(req.params.id, req.body);
    if (!warehouse) return res.status(404).json({ success: false, error: 'Warehouse not found' });
    res.json({ success: true, data: warehouse });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteWarehouse = async (req, res) => {
  try {
    const warehouse = await warehouseService.deleteWarehouse(req.params.id);
    if (!warehouse) return res.status(404).json({ success: false, error: 'Warehouse not found' });
    res.json({ success: true, message: 'Warehouse deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getLocations = async (req, res) => {
  try {
    const locations = await warehouseService.getLocations(req.params.warehouseId);
    res.json({ success: true, data: locations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createLocation = async (req, res) => {
  try {
    const location = await warehouseService.createLocation(req.params.warehouseId, req.body);
    res.status(201).json({ success: true, data: location });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const location = await warehouseService.updateLocation(req.params.warehouseId, req.params.locationId, req.body);
    if (!location) return res.status(404).json({ success: false, error: 'Location not found' });
    res.json({ success: true, data: location });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteLocation = async (req, res) => {
  try {
    const location = await warehouseService.deleteLocation(req.params.warehouseId, req.params.locationId);
    if (!location) return res.status(404).json({ success: false, error: 'Location not found' });
    res.json({ success: true, message: 'Location deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};