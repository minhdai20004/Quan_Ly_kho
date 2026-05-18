const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const ProductPrice = require('./src/models/ProductPrice');
require('dotenv').config();

async function checkIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wms_warehouse');
    console.log('Connected to DB');
    
    // Test creating a price specifically
    const price = new ProductPrice({
      product_id: new mongoose.Types.ObjectId(),
      cost_price: 15000,
      selling_price: 20000
    });
    
    try {
      await price.save();
      console.log('Price saved. price_id:', price.price_id);
    } catch (e) {
      console.log('Error saving price:', e.message, e.code, e.keyValue);
    }

  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

checkIndex();
