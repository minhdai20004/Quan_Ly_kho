const mongoose = require('mongoose');
const Category = require('../models/Category');

// ✅ Helper: hỗ trợ cả _id (ObjectId) lẫn category_id (string)
const findCategory = (id, extra = {}) => {
  const query = mongoose.Types.ObjectId.isValid(id)
    ? { _id: id, ...extra }
    : { category_id: id, ...extra };
  return Category.findOne(query);
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({}) // ✅ bỏ { is_active: true }
      .populate('parent_id', 'name')
      .sort({ sort_order: 1, name: 1 })
      .lean();
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getCategory = async (req, res) => {
  try {
    const category = await findCategory(req.params.id, { is_active: true }).lean();
    if (!category) return res.status(404).json({ success: false, error: 'Category not found' });
    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    if (!req.body.category_id) {
      const count = await Category.countDocuments();
      req.body.category_id = `CAT-${String(count + 1).padStart(3, '0')}-${Date.now().toString().slice(-2)}`;
    }
    const category = new Category(req.body);
    await category.save();
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const query = mongoose.Types.ObjectId.isValid(req.params.id)
      ? { _id: req.params.id }
      : { category_id: req.params.id };

    const category = await Category.findOneAndUpdate(query, req.body, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ success: false, error: 'Category not found' });
    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const query = mongoose.Types.ObjectId.isValid(req.params.id)
      ? { _id: req.params.id }
      : { category_id: req.params.id };

    const category = await Category.findOneAndUpdate(query, { is_active: false }, { new: true });
    if (!category) return res.status(404).json({ success: false, error: 'Category not found' });
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getCategoryTree = async (req, res) => {
  try {
    const categories = await Category.find({ is_active: true }).lean();
    const buildTree = (parentId = null) =>
      categories
        .filter(cat => String(cat.parent_id || '') === String(parentId || ''))
        .map(cat => ({ ...cat, children: buildTree(cat._id) }));
    res.json({ success: true, data: buildTree(null) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};