const Supplier = require('../models/Supplier');
const ProductSupplier = require('../models/ProductSupplier');

exports.getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find({ is_active: true })
      .sort({ name: 1 })
      .lean();
    res.json({ success: true, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findOne({ supplier_id: req.params.id })
      .populate('created_by', 'username')
      .lean();

    if (!supplier) return res.status(404).json({ success: false, error: 'Supplier not found' });

    const products = await ProductSupplier.find({ supplier_id: supplier._id })
      .populate('product_id', 'product_name sku product_code')
      .lean();

    res.json({ success: true, data: { ...supplier, products } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createSupplier = async (req, res) => {
  try {
    const supplier = new Supplier(req.body);
    await supplier.save();
    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findOneAndUpdate(
      { supplier_id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!supplier) return res.status(404).json({ success: false, error: 'Supplier not found' });
    res.json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findOneAndUpdate(
      { supplier_id: req.params.id },
      { is_active: false },
      { new: true }
    );
    if (!supplier) return res.status(404).json({ success: false, error: 'Supplier not found' });
    res.json({ success: true, message: 'Supplier deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.addProductToSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findOne({ supplier_id: req.params.supplierId });
    if (!supplier) return res.status(404).json({ success: false, error: 'Supplier not found' });

    const productSupplier = new ProductSupplier({
      ...req.body,
      supplier_id: supplier._id
    });
    await productSupplier.save();

    res.status(201).json({ success: true, data: productSupplier });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getSupplierProducts = async (req, res) => {
  try {
    const supplier = await Supplier.findOne({ supplier_id: req.params.supplierId });
    if (!supplier) return res.status(404).json({ success: false, error: 'Supplier not found' });

    const products = await ProductSupplier.find({ supplier_id: supplier._id })
      .populate('product_id', 'product_name sku product_code')
      .sort({ priority: 1 })
      .lean();

    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
