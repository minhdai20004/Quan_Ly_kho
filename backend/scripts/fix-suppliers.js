require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function fixSuppliers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const res = await mongoose.connection.collection('suppliers').updateMany(
      { is_active: { $ne: true } },
      { $set: { is_active: true } }
    );

    console.log(`Updated ${res.modifiedCount} supplier documents`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

fixSuppliers();
