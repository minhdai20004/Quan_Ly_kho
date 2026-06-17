const express = require('express');
const cors    = require('cors');
const app     = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Preload tất cả models ─────────────────────────────────────────────────────
require('./models/MaterialGroup');
require('./models/Material');
require('./models/MaterialBatch');      // ← NEW
require('./models/Partner');
require('./models/Warehouse');
require('./models/WarehouseLocation');
require('./models/InboundReceipt');
require('./models/OutboundIssue');
require('./models/MaterialStock');
require('./models/User');

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',             require('./routes/authRoutes'));
app.use('/api/material-groups',  require('./routes/materialGroupRoutes'));
app.use('/api/materials',        require('./routes/materialRoutes'));
app.use('/api/material-batches', require('./routes/materialBatchRoutes'));  // ← NEW
app.use('/api/partners',         require('./routes/partnerRoutes'));
app.use('/api/warehouses',       require('./routes/warehouseRoutes'));
app.use('/api/inbound-receipts', require('./routes/inboundReceiptRoutes'));
app.use('/api/outbound-issues',  require('./routes/outboundIssueRoutes'));
app.use('/api/material-stock',   require('./routes/materialStockRoutes'));
app.use('/api/dashboard',        require('./routes/dashboardRoutes'));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: `Route không tồn tại: ${req.method} ${req.path}` }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ message: 'Lỗi server', error: err.message });
});
const PORT = process.env.PORT || 3001;
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wms_warehouse')
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => console.error('❌ MongoDB error:', err));
module.exports = app;