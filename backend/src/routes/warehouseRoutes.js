const express = require('express');
const router = express.Router();
const {
  getWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} = require('../controllers/warehouseController');

router.route('/')
  .get(getWarehouses)
  .post(createWarehouse);

router.route('/:id')
  .get(getWarehouse)
  .put(updateWarehouse)
  .delete(deleteWarehouse);

router.route('/:warehouseId/locations')
  .get(getLocations)
  .post(createLocation);

router.route('/:warehouseId/locations/:locationId')
  .put(updateLocation)
  .delete(deleteLocation);

module.exports = router;