const mongoose = require('mongoose');
const ProductPrice = require('./src/models/ProductPrice');
require('dotenv').config();

async function fixPrices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wms_warehouse');
    console.log('Connected to DB');
    
    const pricesToFix = await ProductPrice.find({ $or: [{ price_id: null }, { price_id: { $exists: false } }] });
    console.log(`Found ${pricesToFix.length} prices to fix.`);
    
    for (const p of pricesToFix) {
      p.price_id = `PRC-${new mongoose.Types.ObjectId().toString().slice(-8).toUpperCase()}`;
      await p.save();
      console.log(`Fixed price for product ${p.product_id} with new price_id ${p.price_id}`);
    }
    
    console.log('Done!');
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

fixPrices();
