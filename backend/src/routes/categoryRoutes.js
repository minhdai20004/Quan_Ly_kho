const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

router.route('/')
  .get(categoryController.getCategories)
  .post(categoryController.createCategory);

router.get('/tree', categoryController.getCategoryTree);

router.route('/:id')
  .get(categoryController.getCategory)
  .put(categoryController.updateCategory)
  .delete(categoryController.deleteCategory);

module.exports = router;
