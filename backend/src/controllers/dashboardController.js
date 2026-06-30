const mongoose = require('mongoose');
require('../models/Material');
require('../models/MaterialGroup');
require('../models/Partner');
require('../models/MaterialStock');
require('../models/InboundReceipt');
require('../models/OutboundIssue');

const Material       = mongoose.model('Material');
const MaterialGroup  = mongoose.model('MaterialGroup');
const Partner        = mongoose.model('Partner');
const MaterialStock  = mongoose.model('MaterialStock');
const InboundReceipt = mongoose.model('InboundReceipt');
const OutboundIssue  = mongoose.model('OutboundIssue');

const getDateRange = (days) => {
  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    dates.push(d);
  }
  return dates;
};

const formatDateLabel = (date) => {
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// GET /api/dashboard/stats
exports.getStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalMaterials,
      totalGroups,
      totalPartners,
      newMaterialsToday,
      allStocks,
      lowStockCount,
    ] = await Promise.all([
      Material.countDocuments({ deleted_at: null }),
      MaterialGroup.countDocuments(),
      Partner.countDocuments(),
      Material.countDocuments({ created_at: { $gte: today }, deleted_at: null }),
      MaterialStock.find({}, 'quantity_on_hand').lean(),
      MaterialStock.countDocuments({ low_stock_alert: true }),
    ]);

    const totalStock = allStocks.reduce((sum, s) => sum + (s.quantity_on_hand || 0), 0);

    res.json({
      data: {
        totalMaterials,
        totalGroups,
        totalPartners,
        totalStock,
        lowStockCount,
        newMaterialsToday,
      },
    });
  } catch (err) {
    console.error('getStats error:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// GET /api/dashboard/low-stock
// ✅ FIXED: Material thực dùng product_name/product_code (material_name chỉ là virtual)
exports.getLowStock = async (req, res) => {
  try {
    const stocks = await MaterialStock.find()
      .populate('material_id', 'product_name product_code')
      .lean();

    const map = {};
    stocks.forEach((s) => {
      const mid = s.material_id?._id?.toString() || s.material_id?.toString();
      if (!mid) return;
      if (!map[mid]) {
        map[mid] = {
          _id: mid,
          name: s.material_id?.product_name || '—',
          material_code: s.material_id?.product_code || '',
          quantity: 0,
          threshold: s.min_stock || 10,
        };
      }
      map[mid].quantity += s.quantity_on_hand || 0;
    });

    const items = Object.values(map)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 10);

    res.json({ data: items });
  } catch (err) {
    console.error('getLowStock error:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// GET /api/dashboard/recent-transactions
// ✅ FIXED: Partner field thực là 'name' (không phải partner_name)
// ✅ FIXED: Warehouse field thực là 'name' (không phải warehouse_name)
exports.getRecentTransactions = async (req, res) => {
  try {
    const [inbounds, outbounds] = await Promise.all([
      InboundReceipt.find()
        .sort({ created_at: -1 })
        .limit(5)
        .populate('partner_id', 'name')
        .populate('warehouse_id', 'name')
        .lean(),
      OutboundIssue.find()
        .sort({ created_at: -1 })
        .limit(5)
        .populate('partner_id', 'name')
        .populate('warehouse_id', 'name')
        .lean(),
    ]);

    const transactions = [
      ...inbounds.map(r => ({ ...r, transaction_type: 'inbound' })),
      ...outbounds.map(r => ({ ...r, transaction_type: 'outbound' })),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);

    res.json({ data: transactions });
  } catch (err) {
    console.error('getRecentTransactions error:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// GET /api/dashboard/chart?days=7
exports.getChartData = async (req, res) => {
  try {
    const days      = parseInt(req.query.days) || 7;
    const dateRange = getDateRange(days);
    const startDate = dateRange[0];

    const [inbounds, outbounds] = await Promise.all([
      InboundReceipt.find({ created_at: { $gte: startDate } })
        .select('total_quantity created_at').lean(),
      OutboundIssue.find({ created_at: { $gte: startDate } })
        .select('total_quantity created_at').lean(),
    ]);

    const txMap = {};
    inbounds.forEach(r => {
      const key = new Date(r.created_at).toISOString().split('T')[0];
      if (!txMap[key]) txMap[key] = { nhap: 0, xuat: 0 };
      txMap[key].nhap += r.total_quantity || 0;
    });
    outbounds.forEach(r => {
      const key = new Date(r.created_at).toISOString().split('T')[0];
      if (!txMap[key]) txMap[key] = { nhap: 0, xuat: 0 };
      txMap[key].xuat += r.total_quantity || 0;
    });

    const chartData = dateRange.map(date => {
      const key = date.toISOString().split('T')[0];
      return {
        date: formatDateLabel(date),
        nhap: txMap[key]?.nhap ?? 0,
        xuat: txMap[key]?.xuat ?? 0,
      };
    });

    res.json({ data: chartData });
  } catch (err) {
    console.error('getChartData error:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// GET /api/dashboard/top-products
// ✅ FIXED: Material thực dùng product_name/product_code
exports.getTopProducts = async (req, res) => {
  try {
    const stocks = await MaterialStock.find()
      .populate('material_id', 'product_name product_code')
      .lean();

    const map = {};
    stocks.forEach((s) => {
      const mid = s.material_id?._id?.toString() || s.material_id?.toString();
      if (!mid) return;
      if (!map[mid]) {
        map[mid] = {
          _id: mid,
          name: s.material_id?.product_name || '—',
          material_code: s.material_id?.product_code || '',
          totalQuantity: 0,
        };
      }
      map[mid].totalQuantity += s.quantity_on_hand || 0;
    });

    const items = Object.values(map)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5);

    res.json({ data: items });
  } catch (err) {
    console.error('getTopProducts error:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};