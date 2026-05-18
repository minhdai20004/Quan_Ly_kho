require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const Brand = require('../src/models/Brand');
const ProductUnit = require('../src/models/ProductUnit');
const ProductVariant = require('../src/models/ProductVariant');
const ProductPrice = require('../src/models/ProductPrice');
const Warehouse = require('../src/models/Warehouse');
const Location = require('../src/models/Location');
const InventoryStock = require('../src/models/InventoryStock');
const InventoryBatch = require('../src/models/InventoryBatch');
const Supplier = require('../src/models/Supplier');
const ProductSupplier = require('../src/models/ProductSupplier');
const BundleComponent = require('../src/models/BundleComponent');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('Connected to MongoDB');
    console.log('Clearing existing data...');

    await Promise.all([
      Product.deleteMany({}),
      Category.deleteMany({}),
      Brand.deleteMany({}),
      ProductUnit.deleteMany({}),
      ProductVariant.deleteMany({}),
      ProductPrice.deleteMany({}),
      Warehouse.deleteMany({}),
      Location.deleteMany({}),
      InventoryStock.deleteMany({}),
      InventoryBatch.deleteMany({}),
      Supplier.deleteMany({}),
      ProductSupplier.deleteMany({}),
      BundleComponent.deleteMany({})
    ]);

    console.log('Seeding data...');

    const categories = await Category.insertMany([
      { category_id: 'CAT-001', name: 'Dien tu & Cong nghe', name_en: 'Electronics & Technology', description: 'San pham dien tu, cong nghe', level: 1, sort_order: 1 },
      { category_id: 'CAT-002', name: 'Thuc pham & Do uong', name_en: 'Food & Beverage', description: 'Thuc pham, nuoc uong, do an nhe', parent_id: null, level: 1, sort_order: 2 },
      { category_id: 'CAT-003', name: 'Dung cu nha bep', name_en: 'Kitchenware', description: 'Dung cu che bien, nau an', parent_id: null, level: 1, sort_order: 3 }
    ]);

    const electronics = categories.find(c => c.category_id === 'CAT-001');
    await Category.insertMany([
      { category_id: 'CAT-001-01', name: 'Dien thoai', name_en: 'Mobile Phones', description: 'Dien thoai thong minh', parent_id: electronics._id, level: 2, sort_order: 1 },
      { category_id: 'CAT-001-02', name: 'Laptop', name_en: 'Laptops', description: 'May tinh xach tay', parent_id: electronics._id, level: 2, sort_order: 2 }
    ]);

    const brands = await Brand.insertMany([
      { brand_id: 'BRD-001', name: 'Samsung', name_en: 'Samsung', country: 'South Korea', is_active: true },
      { brand_id: 'BRD-002', name: 'Apple', name_en: 'Apple', country: 'USA', is_active: true },
      { brand_id: 'BRD-003', name: 'Sony', name_en: 'Sony', country: 'Japan', is_active: true }
    ]);

    const warehouses = await Warehouse.insertMany([
      { warehouse_id: 'WH-001', name: 'Kho Tong', code: 'KHO-TONG', type: 'main', status: 'active', is_default: true },
      { warehouse_id: 'WH-002', name: 'Kho Chi Nhanh', code: 'KHO-CN', type: 'branch', status: 'active', is_default: false }
    ]);

    const defaultWarehouse = warehouses[0];

    const suppliers = await Supplier.insertMany([
      {
        supplier_id: 'SUP-001',
        name: 'Cong ty Samsung Viet Nam',
        code: 'SAMSUNG',
        contact: { name: 'Nguyen Van A', phone: '0909-123-456', email: 'contact@samsung.com.vn' },
        address: { city: 'TPHCM', country: 'Vietnam' },
        business: { tax_id: '0301234567', business_type: 'Distributor' },
        payment_terms: 'Net 30',
        currency: 'VND',
        is_active: true,
        is_primary: true
      }
    ]);

    const phoneCategory = await Category.findOne({ category_id: 'CAT-001-01' });
    const samsung = brands.find(b => b.name === 'Samsung');

    const products = await Product.insertMany([
      {
        product_id: 'PROD-001',
        product_code: 'SP-001',
        sku: 'SAMSUNG-GS24-001',
        barcode: '8806095312345',
        product_name: 'Dien thoai Samsung Galaxy S24 256GB',
        product_name_en: 'Samsung Galaxy S24 256GB',
        short_description: 'Dien thoai cao cap Samsung Galaxy S24',
        description: 'Dien thoai thong minh Samsung Galaxy S24 voi bo nho 256GB',
        product_type: 'goods',
        status: 'active',
        images: ['https://example.com/images/galaxy_s24_1.jpg'],
        thumbnail: 'https://example.com/images/galaxy_s24_thumb.jpg',
        category_id: phoneCategory._id,
        brand_id: samsung._id,
        tags: ['dien thoai', 'samsung', 'galaxy', '5G'],
        origin_country: 'South Korea',
        storage_info: { weight: 0.167, length: 14.7, width: 7.1, height: 0.76, volume: 0.000079, storage_condition: 'normal', is_fragile: true, is_hazardous: false, storage_unit: 'carton' },
        accounting_info: { valuation_method: 'FIFO', abc_category: 'A', is_inventoried: true },
        alert_config: { alert_low_stock: true, auto_reorder: false, reorder_qty: 50 }
      }
    ]);

    const product = products[0];
    await ProductUnit.create({ product_id: product._id, unit_id: `UNIT-${uuidv4().slice(0, 8)}`, name: 'Cai', code: 'CAI', ratio: 1, unit_type: 'base', is_base_unit: true, allow_decimal: false });
    await ProductPrice.create({ product_id: product._id, price_id: `PRICE-${uuidv4().slice(0, 8)}`, price_type: 'retail', currency: 'VND', cost_price: 18000000, selling_price: 22000000, effective_from: new Date(), is_active: true });
    await InventoryStock.create({ stock_id: 'STK-000001', product_id: product._id, warehouse_id: defaultWarehouse._id, quantity_on_hand: 25, quantity_reserved: 2, quantity_available: 23 });
    await ProductSupplier.create({ product_id: product._id, supplier_id: suppliers[0]._id, supplier_sku: 'SMS-S24-256', supplier_name: suppliers[0].name, is_primary: true, lead_time_days: 7, minimum_order_qty: 10, currency: 'VND', unit_cost: 18000000 });

    console.log('Seed completed successfully');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

seed();
