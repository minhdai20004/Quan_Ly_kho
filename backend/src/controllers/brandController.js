const Brand = require('../models/Brand');

exports.getBrands = async (req, res) => {
  try {
    const brands = await Brand.find({ is_active: true })
      .sort({ name: 1 })
      .lean();
    res.json({ success: true, data: brands });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getBrand = async (req, res) => {
  try {
    const brand = await Brand.findOne({ brand_id: req.params.id, is_active: true }).lean();
    if (!brand) return res.status(404).json({ success: false, error: 'Brand not found' });
    res.json({ success: true, data: brand });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createBrand = async (req, res) => {
  try {
    const brand = new Brand(req.body);
    await brand.save();
    res.status(201).json({ success: true, data: brand });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateBrand = async (req, res) => {
  try {
    const brand = await Brand.findOneAndUpdate(
      { brand_id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!brand) return res.status(404).json({ success: false, error: 'Brand not found' });
    res.json({ success: true, data: brand });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findOneAndUpdate(
      { brand_id: req.params.id },
      { is_active: false },
      { new: true }
    );
    if (!brand) return res.status(404).json({ success: false, error: 'Brand not found' });
    res.json({ success: true, message: 'Brand deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
