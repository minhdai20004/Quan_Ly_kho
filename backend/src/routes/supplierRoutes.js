const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');

router.route('/')
  .get(supplierController.getSuppliers)
  .post(supplierController.createSupplier);

router.route('/:supplierId/products')
  .get(supplierController.getSupplierProducts)
  .post(supplierController.addProductToSupplier);

router.route('/:id')
  .get(supplierController.getSupplier)
  .put(supplierController.updateSupplier)
  .delete(supplierController.deleteSupplier);

module.exports = router;
