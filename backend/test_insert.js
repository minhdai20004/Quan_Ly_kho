const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const InventoryStock = require('./src/models/InventoryStock');
const Warehouse = require('./src/models/Warehouse');
const ProductPrice = require('./src/models/ProductPrice');
require('dotenv').config();

async function testInsert() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wms_warehouse');
    console.log('Connected to DB');
    
    const count = await Product.countDocuments();
    const productId = `PROD-${String(count + 1).padStart(6, '0')}`;
    
    console.log('Trying to insert product with ID:', productId);
    
    const product = new Product({
      product_id: productId,
      product_code: 'TEST-' + Date.now(),
      sku: 'TESTSKU-' + Date.now(),
      product_name: 'Test Product',
      status: 'active',
      product_type: 'goods'
    });
    
    await product.save();
    console.log('Product saved successfully');
    
    const defaultWarehouse = await Warehouse.findOne({ is_default: true }) || await Warehouse.findOne();
    if (defaultWarehouse) {
      console.log('Creating stock in default warehouse:', defaultWarehouse._id);
      const stock = new InventoryStock({
        stock_id: `STK-${productId.split('-')[1] || Date.now().toString().slice(-6)}`,
        product_id: product._id,
        warehouse_id: defaultWarehouse._id,
      });
      await stock.save();
      console.log('Stock saved successfully');
    }
    
    console.log('Creating price...');
    const price = new ProductPrice({
      product_id: product._id,
      cost_price: 10,
      selling_price: 20
    });
    await price.save();
    console.log('Price saved successfully');
    
  } catch (err) {
    console.error('ERROR ENCOUNTERED:', err.message);
    if (err.code === 11000) {
      console.error('Duplicate key details:', err.keyValue);
    }
  } finally {
    await mongoose.disconnect();
    console.log('Done');
  }
}

testInsert();
