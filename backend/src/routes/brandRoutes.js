const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');

router.route('/')
  .get(brandController.getBrands)
  .post(brandController.createBrand);

router.route('/:id')
  .get(brandController.getBrand)
  .put(brandController.updateBrand)
  .delete(brandController.deleteBrand);

module.exports = router;
