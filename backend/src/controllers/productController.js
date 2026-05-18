const mongoose = require('mongoose');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const ProductUnit = require('../models/ProductUnit');
const ProductPrice = require('../models/ProductPrice');
const InventoryStock = require('../models/InventoryStock');
const InventoryBatch = require('../models/InventoryBatch');
const BundleComponent = require('../models/BundleComponent');
const ProductSupplier = require('../models/ProductSupplier');
const InventoryAudit = require('../models/InventoryAudit');
const StockTransaction = require('../models/StockTransaction');

const findProduct = (id, extra = {}, session = null) => {
  const query = mongoose.Types.ObjectId.isValid(id)
    ? { _id: id, ...extra }
    : { product_id: id, ...extra };
  const q = Product.findOne(query);
  if (session) q.session(session);
  return q;
};

// @desc    Get all products with filters
// @route   GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const { search, category, status, sort = '-created_at', page = 1, limit = 50 } = req.query;

    const query = { $or: [{ deleted_at: null }, { deleted_at: { $exists: false } }] };

    if (search) {
      query.$and = [{
        $or: [
          { product_name: { $regex: search, $options: 'i' } },
          { product_code: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } },
          { barcode: { $regex: search, $options: 'i' } },
        ],
      }];
    }

    if (status && status !== 'all') query.status = status;
    if (category && category !== 'all') query.category_id = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate({
          path: 'category_id',
          select: 'name category_code parent_id',
          populate: { path: 'parent_id', select: 'name category_code' },
        })
        .populate('brand_id', 'name')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(query),
    ]);

    const productIds = products.map(p => p._id);
    const [allPrices, allStocks] = await Promise.all([
      ProductPrice.find({ product_id: { $in: productIds } }).lean(),
      InventoryStock.find({ product_id: { $in: productIds } })
        .populate('warehouse_id', 'name code')
        .lean(),
    ]);

    const priceMap = {};
    allPrices.forEach(p => {
      if (!priceMap[p.product_id]) priceMap[p.product_id] = [];
      priceMap[p.product_id].push(p);
    });

    const stockMap = {};
    allStocks.forEach(s => {
      if (!stockMap[s.product_id]) stockMap[s.product_id] = [];
      stockMap[s.product_id].push(s);
    });

    const data = products.map(p => ({
      ...p,
      prices: priceMap[p._id] || [],
      stocks: (stockMap[p._id] || []).map(s => ({
        ...s,
        warehouse_name: s.warehouse_id?.name || 'Kho mặc định',
      })),
    }));

    res.json({ success: true, data, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single product with all details
// @route   GET /api/products/:id
exports.getProduct = async (req, res) => {
  try {
    const product = await findProduct(req.params.id)
      .populate({ path: 'category_id', select: 'name category_code parent_id', populate: { path: 'parent_id', select: 'name' } })
      .populate('subcategory_id', 'name')
      .populate('brand_id', 'name logo_url')
      .lean();

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const [variants, units, prices, stocks, batches, suppliers, bundleItems, auditHistory] = await Promise.all([
      ProductVariant.find({ product_id: product._id }).lean(),
      ProductUnit.find({ product_id: product._id }).sort({ ratio: 1 }).lean(),
      ProductPrice.find({ product_id: product._id }).lean(),
      InventoryStock.find({ product_id: product._id })
        .populate('warehouse_id', 'name code')
        .populate('location_id', 'code aisle rack bin')
        .lean(),
      InventoryBatch.find({ product_id: product._id })
        .populate('warehouse_id', 'name code')
        .populate('location_id', 'code')
        .populate('supplier_id', 'name')
        .sort({ expiry_date: 1 })
        .lean(),
      ProductSupplier.find({ product_id: product._id })
        .populate('supplier_id', 'name code')
        .lean(),
      BundleComponent.find({ bundle_id: product._id })
        .populate('component_id', 'product_name sku')
        .populate('unit_id', 'name')
        .lean(),
      InventoryAudit.find({ product_id: product._id })
        .populate('warehouse_id', 'name code')
        .sort({ created_at: -1 })
        .limit(50)
        .lean()
    ]);

    const stocksWithWarehouse = stocks.map(s => ({
      ...s,
      warehouse_name: s.warehouse_id?.name || 'Kho mặc định',
      warehouse_code: s.warehouse_id?.code,
      location: s.location_id?.code,
    }));

    const auditHistoryWithWH = auditHistory.map(a => ({
      ...a,
      warehouse_name: a.warehouse_id?.name || 'Kho mặc định',
      warehouse_code: a.warehouse_id?.code,
    }));

    res.json({
      success: true,
      data: { ...product, variants, units, prices, stocks: stocksWithWarehouse, batches, suppliers, bundleItems, audit_history: auditHistoryWithWH }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create new product
// @route   POST /api/products
exports.createProduct = async (req, res) => {
  try {
    if (!req.body.product_id) {
      const lastProduct = await Product.findOne({}, 'product_id').sort({ created_at: -1 });
      let nextNum = 1;
      if (lastProduct && lastProduct.product_id && lastProduct.product_id.startsWith('PROD-')) {
        const lastNum = parseInt(lastProduct.product_id.split('-')[1], 10);
        if (!isNaN(lastNum)) nextNum = lastNum + 1;
      }
      req.body.product_id = `PROD-${String(nextNum).padStart(6, '0')}`;
    }
    const existing = await Product.findOne({ product_name: req.body.product_name });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Tên sản phẩm đã tồn tại!' });
    }
    const product = new Product(req.body);
    await product.save();

    const Warehouse = require('../models/Warehouse');
    const defaultWarehouse = await Warehouse.findOne({ is_default: true }) || await Warehouse.findOne();

    if (defaultWarehouse) {
      await new InventoryStock({
        stock_id: `STK-${new mongoose.Types.ObjectId().toString().slice(-8).toUpperCase()}`,
        product_id: product._id,
        warehouse_id: defaultWarehouse._id,
        quantity_on_hand: 0,
        quantity_reserved: 0,
        quantity_available: 0,
        quantity_in_transit: 0,
        quantity_on_order: 0,
        unit_cost: 0,
        total_cost: 0,
        reorder_point: 10,
        min_stock: 5,
        max_stock: 100
      }).save();
    }

    if (req.body.prices && req.body.prices.length > 0) {
      const priceData = req.body.prices[0];
      await new ProductPrice({
        product_id: product._id,
        cost_price: priceData.cost_price || 0,
        selling_price: priceData.selling_price || 0,
        wholesale_price: priceData.wholesale_price || 0,
      }).save();
    }

    if (req.body.stocks && req.body.stocks.length > 0 && defaultWarehouse) {
      const initQty = req.body.stocks[0].quantity_on_hand || 0;
      if (initQty > 0) {
        await InventoryStock.findOneAndUpdate(
          { product_id: product._id, warehouse_id: defaultWarehouse._id },
          { $set: { quantity_on_hand: initQty, quantity_available: initQty } },
          { new: true }
        );
      }
    }

    res.status(201).json({ success: true, data: product, message: 'Product created successfully' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Trùng mã sản phẩm, SKU hoặc barcode.' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  try {
    console.log('UPDATE ID:', req.params.id);
    console.log('IS VALID OBJECTID:', mongoose.Types.ObjectId.isValid(req.params.id));
    const query = mongoose.Types.ObjectId.isValid(req.params.id)
      ? { _id: req.params.id, $or: [{ deleted_at: null }, { deleted_at: { $exists: false } }] }
      : { product_id: req.params.id, $or: [{ deleted_at: null }, { deleted_at: { $exists: false } }] };

    const product = await Product.findOneAndUpdate(query, req.body, { new: true, runValidators: true })
      .populate('category_id', 'name category_code');

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    if (req.body.prices && req.body.prices.length > 0) {
      const priceData = req.body.prices[0];
      await ProductPrice.findOneAndUpdate(
        { product_id: product._id },
        {
          $set: { cost_price: priceData.cost_price || 0, selling_price: priceData.selling_price || 0, wholesale_price: priceData.wholesale_price || 0 },
          $setOnInsert: { price_id: `PRC-${new mongoose.Types.ObjectId().toString().slice(-8).toUpperCase()}` }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    res.json({ success: true, data: product, message: 'Product updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const query = mongoose.Types.ObjectId.isValid(req.params.id)
      ? { _id: req.params.id }
      : { product_id: req.params.id };

    const product = await Product.findOneAndDelete(query);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

    await Promise.all([
      InventoryStock.deleteMany({ product_id: product._id }),
      InventoryBatch.deleteMany({ product_id: product._id }),
      ProductVariant.deleteMany({ product_id: product._id }),
      ProductUnit.deleteMany({ product_id: product._id }),
      ProductPrice.deleteMany({ product_id: product._id }),
      ProductSupplier.deleteMany({ product_id: product._id }),
      BundleComponent.deleteMany({ bundle_id: product._id }),
      BundleComponent.deleteMany({ component_id: product._id }),
    ]);

    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ========== VARIANT CONTROLLERS ==========
exports.getVariants = async (req, res) => {
  try {
    const product = await findProduct(req.params.productId).lean();
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    const variants = await ProductVariant.find({ product_id: product._id }).lean();
    res.json({ success: true, data: variants });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.createVariant = async (req, res) => {
  try {
    const product = await findProduct(req.params.productId).lean();
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    req.body.product_id = product._id;
    const variant = new ProductVariant(req.body);
    await variant.save();
    res.status(201).json({ success: true, data: variant });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

// ========== UNIT CONTROLLERS ==========
exports.getUnits = async (req, res) => {
  try {
    const product = await findProduct(req.params.productId).lean();
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    const units = await ProductUnit.find({ product_id: product._id }).sort({ ratio: 1 }).lean();
    res.json({ success: true, data: units });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.createUnit = async (req, res) => {
  try {
    const product = await findProduct(req.params.productId).lean();
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    req.body.product_id = product._id;
    const unit = new ProductUnit(req.body);
    await unit.save();
    res.status(201).json({ success: true, data: unit });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

// ========== PRICE CONTROLLERS ==========
exports.getPrices = async (req, res) => {
  try {
    const product = await findProduct(req.params.productId).lean();
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    const prices = await ProductPrice.find({ product_id: product._id }).lean();
    res.json({ success: true, data: prices });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.createPrice = async (req, res) => {
  try {
    const product = await findProduct(req.params.productId).lean();
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    req.body.product_id = product._id;
    const price = new ProductPrice(req.body);
    await price.save();
    res.status(201).json({ success: true, data: price });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

// ========== STOCK CONTROLLERS ==========
exports.getStock = async (req, res) => {
  try {
    const product = await findProduct(req.params.productId).lean();
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

    const stock = await InventoryStock.find({ product_id: product._id })
      .populate('warehouse_id', 'name code')
      .populate('location_id', 'code aisle rack bin')
      .lean();

    const totals = { on_hand: 0, reserved: 0, available: 0, in_transit: 0, on_order: 0 };
    stock.forEach(s => {
      totals.on_hand    += s.quantity_on_hand    || 0;
      totals.reserved   += s.quantity_reserved   || 0;
      totals.available  += s.quantity_available  || 0;
      totals.in_transit += s.quantity_in_transit || 0;
      totals.on_order   += s.quantity_on_order   || 0;
    });

    res.json({ success: true, data: { stock, totals } });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

// @desc    Update product stock (inbound / outbound)
// @route   POST /api/products/:productId/stock
exports.updateStock = async (req, res) => {
  console.log('=== UPDATESTOCK CALLED ===');
  try {
    const { transaction_type, quantity, note } = req.body;

    const product = await findProduct(req.params.productId || req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

    const Warehouse = require('../models/Warehouse');
    const warehouse = await Warehouse.findOne({ is_default: true }) || await Warehouse.findOne();
    if (!warehouse) return res.status(400).json({ success: false, error: 'Chưa có kho nào.' });

    let stock = await InventoryStock.findOne({ product_id: product._id, warehouse_id: warehouse._id });
    if (!stock) {
      stock = new InventoryStock({
        stock_id: `STK-${Date.now().toString().slice(-6)}`,
        product_id: product._id,
        warehouse_id: warehouse._id,
        quantity_on_hand: 0,
        quantity_reserved: 0,
        quantity_available: 0,
        quantity_in_transit: 0,
        quantity_on_order: 0,
        unit_cost: 0,
        total_cost: 0,
      });
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) return res.status(400).json({ success: false, error: 'Số lượng phải là số dương' });

    if (transaction_type === 'inbound' || transaction_type === 'initial') {
      stock.quantity_on_hand += qty;
    } else if (transaction_type === 'outbound') {
      if (stock.quantity_on_hand < qty) {
        return res.status(400).json({ success: false, error: `Không đủ tồn kho. Hiện có: ${stock.quantity_on_hand}` });
      }
      stock.quantity_on_hand -= qty;
    } else {
      return res.status(400).json({ success: false, error: 'transaction_type không hợp lệ' });
    }

    const qtyBefore = stock.quantity_on_hand - (transaction_type === 'outbound' ? -qty : qty);
    stock.quantity_available = stock.quantity_on_hand - (stock.quantity_reserved || 0);
    await stock.save();

    await new StockTransaction({
      product_id: product._id,
      warehouse_id: warehouse._id,
      transaction_type,
      quantity: qty,
      quantity_before: qtyBefore,
      quantity_after: stock.quantity_on_hand,
      note: note || '',
      performed_by: req.user?.name || req.user?.username || 'admin',
    }).save();

    if (stock.quantity_on_hand === 0 && product.status === 'active') {
      product.status = 'out_of_stock';
      await product.save();
    } else if (stock.quantity_on_hand > 0 && product.status === 'out_of_stock') {
      product.status = 'active';
      await product.save();
    }

    const updatedStocks = await InventoryStock.find({ product_id: product._id })
      .populate('warehouse_id', 'name code').lean();
    const updatedPrices = await ProductPrice.find({ product_id: product._id }).lean();

    res.json({
      success: true,
      data: {
        ...product.toObject(),
        stocks: updatedStocks.map(s => ({
          ...s,
          warehouse_name: s.warehouse_id?.name || 'Kho mặc định',
          transaction_type,
          note: note || '',
          created_at: new Date(),
        })),
        prices: updatedPrices,
      },
      message: 'Cập nhật tồn kho thành công'
    });
  } catch (error) {
    console.error('UpdateStock error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ========== BATCH CONTROLLERS ==========
exports.getBatches = async (req, res) => {
  try {
    const product = await findProduct(req.params.productId).lean();
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    const batches = await InventoryBatch.find({ product_id: product._id })
      .populate('warehouse_id', 'name code')
      .populate('location_id', 'code')
      .populate('supplier_id', 'name')
      .sort({ expiry_date: 1 }).lean();
    res.json({ success: true, data: batches });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

// ========== SUPPLIER CONTROLLERS ==========
exports.getSuppliers = async (req, res) => {
  try {
    const product = await findProduct(req.params.productId).lean();
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    const suppliers = await ProductSupplier.find({ product_id: product._id })
      .populate('supplier_id', 'name code')
      .sort({ is_primary: -1, priority: 1 }).lean();
    res.json({ success: true, data: suppliers });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.addSupplier = async (req, res) => {
  try {
    const product = await findProduct(req.params.productId).lean();
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    req.body.product_id = product._id;
    const productSupplier = new ProductSupplier(req.body);
    await productSupplier.save();
    res.status(201).json({ success: true, data: productSupplier });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.removeSupplier = async (req, res) => {
  try {
    const { productId, supplierId } = req.params;
    const product = await findProduct(productId).lean();
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    const result = await ProductSupplier.findOneAndDelete({ product_id: product._id, supplier_id: supplierId });
    if (!result) return res.status(404).json({ success: false, error: 'Supplier link not found' });
    res.json({ success: true, message: 'Supplier removed' });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

exports.getAvailableSuppliers = async (req, res) => {
  try {
    const product = await findProduct(req.params.productId).lean();
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    const linked = await ProductSupplier.find({ product_id: product._id }).select('supplier_id');
    const linkedIds = linked.map(s => s.supplier_id);
    const available = await require('../models/Supplier')
      .find({ _id: { $nin: linkedIds }, is_active: true })
      .select('supplier_id name code contact business')
      .sort({ name: 1 }).lean();
    res.json({ success: true, data: available });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

// ========== TRANSACTION LOG ==========
// @desc    Get all stock transactions
// @route   GET /api/transactions
exports.getTransactions = async (req, res) => {
  try {
    const { start, end, type, page = 1, limit = 100 } = req.query;
    const query = {};
    if (type && type !== 'all') query.transaction_type = type;
    if (start || end) {
      query.created_at = {};
      if (start) query.created_at.$gte = new Date(start);
      if (end) query.created_at.$lte = new Date(end + 'T23:59:59');
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [txns, total] = await Promise.all([
      StockTransaction.find(query)
        .populate('product_id', 'product_name product_code')
        .populate('warehouse_id', 'name code')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      StockTransaction.countDocuments(query),
    ]);

    const data = txns.map(t => ({
      _id: t._id,
      product_name: t.product_id?.product_name || '—',
      product_code: t.product_id?.product_code || '—',
      warehouse: t.warehouse_id?.name || 'Kho mặc định',
      transaction_type: t.transaction_type,
      quantity: t.quantity,
      quantity_before: t.quantity_before,
      quantity_after: t.quantity_after,
      note: t.note,
      performed_by: t.performed_by,
      created_at: t.created_at,
    }));

    res.json({ success: true, data, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};