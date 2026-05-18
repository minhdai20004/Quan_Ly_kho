const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getStock,
  updateStock,
  getBatches,
  getVariants,
  createVariant,
  getUnits,
  createUnit,
  getPrices,
  createPrice,
  getSuppliers,
  addSupplier,
  removeSupplier,
  getAvailableSuppliers,
} = require('../controllers/productController');

router.route('/')
  .get(getProducts)
  .post(createProduct);

router.route('/:id')
  .get(getProduct)
  .put(updateProduct)
  .delete(deleteProduct);

router.route('/:id/stock')
  .get(getStock)
  .post(updateStock);

router.route('/:id/batches')
  .get(getBatches);

router.route('/:id/variants')
  .get(getVariants)
  .post(createVariant);

router.route('/:id/units')
  .get(getUnits)
  .post(createUnit);

router.route('/:id/prices')
  .get(getPrices)
  .post(createPrice);

router.route('/:id/suppliers')
  .get(getSuppliers)
  .post(addSupplier);

router.route('/:id/suppliers/:supplierId')
  .delete(removeSupplier);

router.route('/:id/suppliers/available')
  .get(getAvailableSuppliers);

module.exports = router;