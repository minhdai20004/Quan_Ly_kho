const InventoryStock = require('../models/InventoryStock');
const InventoryBatch = require('../models/InventoryBatch');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');

exports.adjustStock = async ({
  product_id,
  variant_id,
  unit_id,
  warehouse_id,
  location_id,
  adjustment_type,
  quantity,
  reason,
  notes
}) => {
  // ✅ Tự động tìm warehouse mặc định nếu không có warehouse_id
  let finalWarehouseId = warehouse_id;
  if (!finalWarehouseId) {
    const defaultWarehouse = await Warehouse.findOne({ is_default: true }) || await Warehouse.findOne();
    if (!defaultWarehouse) {
      throw new Error('Chưa có kho nào trong hệ thống. Vui lòng tạo kho trước.');
    }
    finalWarehouseId = defaultWarehouse._id;
  }

  let stock = await InventoryStock.findOne({
    product_id,
    variant_id: variant_id || null,
    unit_id: unit_id || null,
    warehouse_id: finalWarehouseId,
    location_id: location_id || null
  });

  // ✅ Tạo stock mới nếu chưa tồn tại
  if (!stock) {
    stock = new InventoryStock({
      product_id,
      variant_id: variant_id || null,
      unit_id: unit_id || null,
      warehouse_id: finalWarehouseId,
      location_id: location_id || null,
      quantity_on_hand: 0,
      quantity_reserved: 0,
      quantity_available: 0
    });
  }

  if (!stock) {
    stock = new InventoryStock({
      product_id,
      variant_id: variant_id || null,
      unit_id: unit_id || null,
      warehouse_id,
      location_id,
      quantity_on_hand: 0,
      quantity_reserved: 0,
      quantity_available: 0
    });
  }

  switch (adjustment_type) {
    case 'in':
      stock.quantity_on_hand += quantity;
      break;
    case 'out':
      if (stock.quantity_on_hand < quantity) {
        throw new Error('Insufficient stock');
      }
      stock.quantity_on_hand -= quantity;
      break;
    case 'set':
      stock.quantity_on_hand = quantity;
      break;
    case 'reserve':
      stock.quantity_reserved += quantity;
      break;
    case 'release':
      stock.quantity_reserved = Math.max(0, stock.quantity_reserved - quantity);
      break;
    default:
      throw new Error('Invalid adjustment type');
  }

  stock.quantity_available = stock.quantity_on_hand - stock.quantity_reserved;
  await stock.save();

  const allProductStocks = await InventoryStock.find({ product_id });
  const totalProductQty = allProductStocks.reduce((sum, s) => sum + s.quantity_on_hand, 0);

  const product = await Product.findById(product_id);
  if (product) {
    if (totalProductQty === 0 && product.status === 'active') {
      product.status = 'out_of_stock';
      await product.save();
    } else if (totalProductQty > 0 && product.status === 'out_of_stock') {
      product.status = 'active';
      await product.save();
    }
  }

  return { ...stock.toObject(), warehouse_id: finalWarehouseId };
};

exports.getAllInventory = async ({ warehouse_id, product_id, low_stock_only }) => {
  const query = {};
  if (warehouse_id) query.warehouse_id = warehouse_id;
  if (product_id) query.product_id = product_id;
  if (low_stock_only === 'true') {
    query.$expr = { $lt: ['$quantity_on_hand', '$reorder_point'] };
  }

  return InventoryStock.find(query)
    .populate('product_id', 'product_code product_name sku')
    .populate('warehouse_id', 'name code')
    .populate('location_id', 'code aisle rack bin')
    .sort({ warehouse_id: 1, product_id: 1 })
    .lean();
};

exports.transferStock = async ({ items }) => {
  for (const item of items) {
    const sourceStock = await InventoryStock.findOne({
      product_id: item.product_id,
      variant_id: item.variant_id || null,
      unit_id: item.unit_id || null,
      warehouse_id: item.from_warehouse,
      location_id: item.from_location
    });

    if (!sourceStock || sourceStock.quantity_on_hand < item.quantity) {
      throw new Error(`Insufficient stock for product ${item.product_id}`);
    }

    sourceStock.quantity_on_hand -= item.quantity;
    sourceStock.quantity_available = sourceStock.quantity_on_hand - sourceStock.quantity_reserved;
    await sourceStock.save();

    let destStock = await InventoryStock.findOne({
      product_id: item.product_id,
      variant_id: item.variant_id || null,
      unit_id: item.unit_id || null,
      warehouse_id: item.to_warehouse,
      location_id: item.to_location
    });

    if (!destStock) {
      destStock = new InventoryStock({
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        unit_id: item.unit_id || null,
        warehouse_id: item.to_warehouse,
        location_id: item.to_location,
        quantity_on_hand: 0,
        quantity_reserved: 0,
        quantity_available: 0
      });
    }

    destStock.quantity_on_hand += item.quantity;
    destStock.quantity_available = destStock.quantity_on_hand - destStock.quantity_reserved;
    await destStock.save();
  }

  return 'Transfer completed successfully';
};

exports.getBatches = async ({ product_id, warehouse_id, expired_only }) => {
  const query = {};
  if (product_id) query.product_id = product_id;
  if (warehouse_id) query.warehouse_id = warehouse_id;
  if (expired_only === 'true') query.expiry_date = { $lt: new Date() };

  return InventoryBatch.find(query)
    .populate('product_id', 'product_name sku')
    .populate('warehouse_id', 'name code')
    .populate('location_id', 'code')
    .populate('supplier_id', 'name')
    .sort({ expiry_date: 1 })
    .lean();
};

exports.createBatch = async (data) => {
  const batch = new InventoryBatch(data);
  return batch.save();
};

exports.adjustBatch = async (batchId, { adjustment_type, quantity }) => {
  const batch = await InventoryBatch.findOne({ batch_id: batchId });
  if (!batch) throw new Error('Batch not found');

  switch (adjustment_type) {
    case 'in':
      batch.quantity += quantity;
      break;
    case 'out':
      if (batch.quantity < quantity) throw new Error('Insufficient batch quantity');
      batch.quantity -= quantity;
      break;
    default:
      throw new Error('Invalid adjustment type');
  }

  batch.available_quantity = batch.quantity - batch.reserved_quantity;
  return batch.save();
};
