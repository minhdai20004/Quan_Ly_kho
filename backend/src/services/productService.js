const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const ProductUnit = require('../models/ProductUnit');
const ProductPrice = require('../models/ProductPrice');
const ProductSupplier = require('../models/ProductSupplier');
const InventoryStock = require('../models/InventoryStock');
const InventoryBatch = require('../models/InventoryBatch');
const BundleComponent = require('../models/BundleComponent');
const Supplier = require('../models/Supplier');
const Warehouse = require('../models/Warehouse');
require('../models/Category');
require('../models/Brand');

exports.getProducts = async ({ status, category_id, brand_id, search, page, limit, sort, order }) => {
  const query = { deleted_at: null };
  if (status) query.status = status;
  if (category_id) query.category_id = category_id;
  if (brand_id) query.brand_id = brand_id;
  if (search) {
    query.$or = [
      { product_name: new RegExp(search, 'i') },
      { product_code: new RegExp(search, 'i') },
      { sku: new RegExp(search, 'i') },
    ];
  }

  const sortOption = {};
  sortOption[sort] = order === 'desc' ? -1 : 1;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('category_id', 'name')
      .populate('brand_id', 'name')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Product.countDocuments(query),
  ]);

  return { data: products, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } };
};

exports.getProductById = async (productId) => {
  const product = await Product.findOne({ product_id: productId, deleted_at: null })
    .populate('category_id', 'name')
    .populate('brand_id', 'name')
    .lean();

  if (!product) return null;

  const [variants, units, prices, stocks, batches, suppliers] = await Promise.all([
    ProductVariant.find({ product_id: product._id }).lean(),
    ProductUnit.find({ product_id: product._id }).sort({ ratio: 1 }).lean(),
    ProductPrice.find({ product_id: product._id }).lean(),
    InventoryStock.find({ product_id: product._id }).lean(),
    InventoryBatch.find({ product_id: product._id }).lean(),
    ProductSupplier.find({ product_id: product._id }).populate('supplier_id', 'name').lean(),
  ]);

  return { ...product, variants, units, prices, stocks, batches, suppliers };
};

exports.createProduct = async (data) => {
  if (!data.product_id) {
    const count = await Product.countDocuments();
    data.product_id = `PROD-${String(count + 1).padStart(6, '0')}`;
  }

  const product = new Product(data);
  await product.save();

  const defaultWarehouse = await Warehouse.findOne({ is_default: true }) || await Warehouse.findOne();
  if (defaultWarehouse) {
    const inventoryRecord = new InventoryStock({
      stock_id: `STK-${product.product_id.split('-')[1]}`,
      product_id: product._id,
      warehouse_id: defaultWarehouse._id,
      quantity_on_hand: 0,
      quantity_reserved: 0,
      quantity_available: 0,
    });
    await inventoryRecord.save();
  }

  return product;
};

exports.updateProduct = async (productId, data) => {
  return Product.findOneAndUpdate(
    { product_id: productId, deleted_at: null },
    data,
    { new: true, runValidators: true }
  );
};

exports.deleteProduct = async (productId) => {
  const product = await Product.findOneAndUpdate(
    { product_id: productId, deleted_at: null },
    { deleted_at: new Date() },
    { new: true }
  );

  if (!product) {
    return null;
  }

  await InventoryStock.deleteMany({ product_id: product._id });
  await InventoryBatch.deleteMany({ product_id: product._id });
  await ProductVariant.deleteMany({ product_id: product._id });
  await ProductUnit.deleteMany({ product_id: product._id });
  await ProductPrice.deleteMany({ product_id: product._id });
  await ProductSupplier.deleteMany({ product_id: product._id });
  await BundleComponent.deleteMany({ bundle_id: product._id });
  await BundleComponent.deleteMany({ component_id: product._id });

  return product;
};

exports.getProductStock = async (productId) => {
  const product = await Product.findOne({ product_id: productId, deleted_at: null });
  if (!product) return null;

  const stock = await InventoryStock.find({ product_id: product._id })
    .populate('warehouse_id', 'name code')
    .populate('location_id', 'code')
    .lean();

  const totals = { on_hand: 0, reserved: 0, available: 0, in_transit: 0, on_order: 0 };
  stock.forEach(s => {
    totals.on_hand += s.quantity_on_hand;
    totals.reserved += s.quantity_reserved;
    totals.available += s.quantity_available;
    totals.in_transit += s.quantity_in_transit;
    totals.on_order += s.quantity_on_order;
  });

  return { stock, totals };
};

exports.updateProductStock = async (productId, data) => {
  const { transaction_type, quantity, note, warehouse_id } = data;
  const product = await Product.findById(productId);
  if (!product) throw new Error('Product not found');

  const adjustmentMap = { inbound: 'in', outbound: 'out', initial: 'in', adjust: 'set' };
  const adjustment_type = adjustmentMap[transaction_type] || 'in';

  let warehouseId = warehouse_id;
  if (!warehouseId) {
    const defaultWH = await Warehouse.findOne().lean();
    warehouseId = defaultWH?._id;
  }

  if (!warehouseId) {
    product.stocks = product.stocks || [];
    product.stocks.push({ transaction_type, quantity_on_hand: adjustment_type === 'out' ? -quantity : quantity, note: note || '', created_at: new Date() });
    await product.save();
    return product;
  }

  let stock = await InventoryStock.findOne({ product_id: productId, warehouse_id: warehouseId });

  if (!stock) {
    stock = new InventoryStock({ product_id: productId, warehouse_id: warehouseId, quantity_on_hand: 0, quantity_reserved: 0, quantity_available: 0 });
  }

  switch (adjustment_type) {
    case 'in': stock.quantity_on_hand += Number(quantity); break;
    case 'out': stock.quantity_on_hand = Math.max(0, stock.quantity_on_hand - Number(quantity)); break;
    case 'set': stock.quantity_on_hand = Number(quantity); break;
  }
  stock.quantity_available = stock.quantity_on_hand - (stock.quantity_reserved || 0);
  await stock.save();

  product.stocks = product.stocks || [];
  product.stocks.push({ transaction_type, quantity_on_hand: Number(quantity), warehouse_id: warehouseId, note: note || '', created_at: new Date() });
  await product.save();

  return product;
};

exports.getProductBatches = async (productId) => {
  const product = await Product.findOne({ product_id: productId, deleted_at: null });
  if (!product) return null;
  return InventoryBatch.find({ product_id: product._id }).populate('warehouse_id', 'name').populate('location_id', 'code').sort({ expiry_date: 1 }).lean();
};

exports.getProductVariants = async (productId) => {
  const product = await Product.findOne({ product_id: productId, deleted_at: null });
  if (!product) return null;
  return ProductVariant.find({ product_id: product._id }).lean();
};

exports.createProductVariant = async (productId, data) => {
  const product = await Product.findOne({ product_id: productId, deleted_at: null });
  if (!product) return null;
  data.product_id = product._id;
  const variant = new ProductVariant(data);
  return variant.save();
};

exports.getProductUnits = async (productId) => {
  const product = await Product.findOne({ product_id: productId, deleted_at: null });
  if (!product) return null;
  return ProductUnit.find({ product_id: product._id }).sort({ ratio: 1 }).lean();
};

exports.createProductUnit = async (productId, data) => {
  const product = await Product.findOne({ product_id: productId, deleted_at: null });
  if (!product) return null;
  data.product_id = product._id;
  const unit = new ProductUnit(data);
  return unit.save();
};

exports.getProductPrices = async (productId) => {
  const product = await Product.findOne({ product_id: productId, deleted_at: null });
  if (!product) return null;
  return ProductPrice.find({ product_id: product._id }).lean();
};

exports.createProductPrice = async (productId, data) => {
  const product = await Product.findOne({ product_id: productId, deleted_at: null });
  if (!product) return null;
  data.product_id = product._id;
  const price = new ProductPrice(data);
  return price.save();
};

exports.getProductSuppliers = async (productId) => {
  const product = await Product.findOne({ product_id: productId, deleted_at: null });
  if (!product) return null;
  return ProductSupplier.find({ product_id: product._id }).populate('supplier_id', 'name code').sort({ is_primary: -1, priority: 1 }).lean();
};

exports.addSupplierToProduct = async (productId, data) => {
  const product = await Product.findOne({ product_id: productId, deleted_at: null });
  if (!product) return null;
  data.product_id = product._id;
  const productSupplier = new ProductSupplier(data);
  return productSupplier.save();
};

exports.removeSupplierFromProduct = async (productId, supplierId) => {
  const product = await Product.findOne({ product_id: productId, deleted_at: null });
  if (!product) return null;
  return ProductSupplier.findOneAndDelete({ product_id: product._id, supplier_id: supplierId });
};

exports.getAvailableSuppliers = async (productId) => {
  const product = await Product.findOne({ product_id: productId, deleted_at: null });
  if (!product) return null;
  const linkedSuppliers = await ProductSupplier.find({ product_id: product._id }).select('supplier_id');
  const linkedSupplierIds = linkedSuppliers.map(s => s.supplier_id);
  return Supplier.find({ _id: { $nin: linkedSupplierIds }, is_active: true }).select('supplier_id name code contact business').sort({ name: 1 }).lean();
};
