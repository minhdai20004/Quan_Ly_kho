const mongoose = require('mongoose');
const InventoryStock = require('../models/InventoryStock');
const InventoryBatch = require('../models/InventoryBatch');
const Product = require('../models/Product');
const InventoryAudit = require('../models/InventoryAudit'); // Audit log

// Helper: tìm product bằng _id hoặc product_id
const findProduct = async (id, session = null) => {
  const query = mongoose.Types.ObjectId.isValid(id)
    ? { _id: id }
    : { product_id: id };
  const q = Product.findOne(query);
  if (session) q.session(session);
  return q;
};

// @desc    Adjust stock quantity
// @route   POST /api/inventory/adjust
exports.adjustStock = async (req, res) => {
  try {
    const {
      product_id,
      variant_id,
      unit_id,
      warehouse_id,
      location_id,
      adjustment_type,
      quantity,
      notes
    } = req.body;

    // ✅ Resolve product ObjectId
    let productObjectId;
    if (mongoose.Types.ObjectId.isValid(product_id)) {
      productObjectId = new mongoose.Types.ObjectId(product_id);
    } else {
      const found = await Product.findOne({ product_id }).lean();
      if (!found) {
        return res.status(404).json({ success: false, error: `Không tìm thấy sản phẩm: ${product_id}` });
      }
      productObjectId = found._id;
    }

    // Find or create stock record
    let stock = await InventoryStock.findOne({
      product_id:  productObjectId,
      variant_id:  variant_id  || null,
      unit_id:     unit_id     || null,
      warehouse_id,
      location_id: location_id || null,
    });

    if (!stock) {
      stock = new InventoryStock({
        product_id:          productObjectId,
        variant_id:          variant_id  || null,
        unit_id:             unit_id     || null,
        warehouse_id,
        location_id:         location_id || null,
        quantity_on_hand:    0,
        quantity_reserved:   0,
        quantity_available:  0,
        quantity_in_transit: 0,
        quantity_on_order:   0,
      });
    }

     const qty = Number(quantity);
     if (isNaN(qty) || qty <= 0) return res.status(400).json({ success: false, error: 'Số lượng phải là số dương' });

   // Capture before quantity for audit
    const beforeQty = stock.quantity_on_hand;

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

     stock.quantity_available = stock.quantity_on_hand - (stock.quantity_reserved || 0);
     await stock.save();
    // Create audit record
    const afterQty = stock.quantity_on_hand;
    const change = afterQty - beforeQty
    const audit = new InventoryAudit({
      audit_id: `AUD-${new mongoose.Types.ObjectId().toString().slice(-8).toUpperCase()}`,
      product_id:   productObjectId,
      warehouse_id: stock.warehouse_id,
      adjustment_type: transaction_type,
      quantity_before: beforeQty,
     quantity_after:  afterQty,
      quantity_change: change,
      notes: req.body.notes || '',
    });
    await audit.save();

     // Sync product status
    const allStocks = await InventoryStock.find({ product_id: productObjectId });
    const totalQty  = allStocks.reduce((sum, s) => sum + s.quantity_on_hand, 0);

    const product = await Product.findById(productObjectId);
    if (product) {
      if (totalQty === 0 && product.status === 'active') {
        product.status = 'out_of_stock';
        await product.save();
      } else if (totalQty > 0 && product.status === 'out_of_stock') {
        product.status = 'active';
        await product.save();
      }
    }

    res.json({ success: true, data: stock });
  } catch (error) {
    console.error('AdjustStock error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all inventory
// @route   GET /api/inventory
exports.getAllInventory = async (req, res) => {
  try {
    const { warehouse_id, product_id, low_stock_only } = req.query;

    const query = {};
    if (warehouse_id) query.warehouse_id = warehouse_id;
    if (product_id)   query.product_id   = product_id;
    if (low_stock_only === 'true') {
      query.$expr = { $lt: ['$quantity_on_hand', '$reorder_point'] };
    }

    const inventory = await InventoryStock.find(query)
      .populate('product_id',  'product_code product_name sku category_id')
      .populate('variant_id',  'sku attributes')
      .populate('warehouse_id','name code')
      .populate('location_id', 'code aisle rack bin')
      .sort({ warehouse_id: 1, product_id: 1 })
      .lean();

    const transformed = inventory.map(item => ({
      _id:                item._id,
      stock_id:           item.stock_id,
      product_id:         item.product_id?._id,
      product_code:       item.product_id?.product_code,
      product_name:       item.product_id?.product_name,
      product_sku:        item.product_id?.sku,
      category_id:        item.product_id?.category_id,
      variant_id:         item.variant_id?._id,
      variant_sku:        item.variant_id?.sku,
      variant_attributes: item.variant_id?.attributes,
      warehouse_id:       item.warehouse_id?._id,
      warehouse_name:     item.warehouse_id?.name,
      warehouse_code:     item.warehouse_id?.code,
      location_id:        item.location_id?._id,
      location_code:      item.location_id?.code,
      aisle:              item.location_id?.aisle,
      rack:               item.location_id?.rack,
      bin:                item.location_id?.bin,
      quantity_on_hand:   item.quantity_on_hand,
      quantity_reserved:  item.quantity_reserved,
      quantity_available: item.quantity_available,
      quantity_in_transit:item.quantity_in_transit,
      quantity_on_order:  item.quantity_on_order,
      unit_cost:          item.unit_cost,
      total_cost:         item.total_cost,
      reorder_point:      item.reorder_point,
      min_stock:          item.min_stock,
      max_stock:          item.max_stock,
      created_at:         item.created_at,
      updated_at:         item.updated_at,
    }));

    res.json({ success: true, data: transformed });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all batches
// @route   GET /api/inventory/batches
exports.getBatches = async (req, res) => {
  try {
    const { product_id, warehouse_id, expired_only } = req.query;
    const query = {};
    if (product_id)   query.product_id   = product_id;
    if (warehouse_id) query.warehouse_id = warehouse_id;
    if (expired_only === 'true') query.expiry_date = { $lt: new Date() };

    const batches = await InventoryBatch.find(query)
      .populate('product_id',  'product_name sku')
      .populate('warehouse_id','name code')
      .populate('location_id', 'code')
      .populate('supplier_id', 'name')
      .sort({ expiry_date: 1 })
      .lean();

    res.json({ success: true, data: batches });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create batch
// @route   POST /api/inventory/batches
exports.createBatch = async (req, res) => {
  try {
    const batch = new InventoryBatch(req.body);
    await batch.save();
    res.status(201).json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update batch quantity
// @route   PUT /api/inventory/batches/:id/adjust
exports.adjustBatch = async (req, res) => {
  try {
    const { adjustment_type, quantity } = req.body;
    const batch = await InventoryBatch.findOne({ batch_id: req.params.id });
    if (!batch) return res.status(404).json({ success: false, error: 'Batch not found' });

    const qty = Number(quantity);
    switch (adjustment_type) {
      case 'in':
        batch.quantity += qty;
        break;
      case 'out':
        if (batch.quantity < qty) {
          return res.status(400).json({ success: false, error: 'Insufficient batch quantity' });
        }
        batch.quantity -= qty;
        break;
      default:
        return res.status(400).json({ success: false, error: 'Invalid adjustment type' });
    }

    batch.available_quantity = batch.quantity - batch.reserved_quantity;
    await batch.save();
    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Transfer stock between locations/warehouses
// @route   POST /api/inventory/transfer
exports.transferStock = async (req, res) => {
  try {
    const { items } = req.body;

    for (const item of items) {
      const sourceStock = await InventoryStock.findOne({
        product_id:  item.product_id,
        variant_id:  item.variant_id || null,
        unit_id:     item.unit_id    || null,
        warehouse_id: item.from_warehouse,
        location_id: item.from_location || null,
      });

      if (!sourceStock || sourceStock.quantity_on_hand < item.quantity) {
        return res.status(400).json({ success: false, error: `Không đủ tồn kho cho sản phẩm ${item.product_id}` });
      }

      sourceStock.quantity_on_hand  -= item.quantity;
      sourceStock.quantity_available = sourceStock.quantity_on_hand - sourceStock.quantity_reserved;
      await sourceStock.save();

      let destStock = await InventoryStock.findOne({
        product_id:  item.product_id,
        variant_id:  item.variant_id || null,
        unit_id:     item.unit_id    || null,
        warehouse_id: item.to_warehouse,
        location_id: item.to_location || null,
      });

      if (!destStock) {
        destStock = new InventoryStock({
          product_id:       item.product_id,
          variant_id:       item.variant_id || null,
          unit_id:          item.unit_id    || null,
          warehouse_id:     item.to_warehouse,
          location_id:      item.to_location || null,
          quantity_on_hand: 0,
        });
      }

      destStock.quantity_on_hand  += item.quantity;
      destStock.quantity_available = destStock.quantity_on_hand - destStock.quantity_reserved;
      await destStock.save();
    }

    res.json({ success: true, message: 'Chuyển kho thành công' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};