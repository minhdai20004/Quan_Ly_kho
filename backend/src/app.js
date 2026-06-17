const express = require('express');
const cors    = require('cors');
const app     = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Preload tất cả models để tránh MissingSchemaError ────────────────────────
require('./models/MaterialGroup');
require('./models/Material');
require('./models/Partner');
require('./models/Warehouse');
require('./models/WarehouseLocation');
require('./models/InboundReceipt');
require('./models/OutboundIssue');
require('./models/MaterialStock');
require('./models/User');         // giữ nguyên model User cũ

// ── Routes ────────────────────────────────────────────────────────────────────

// Auth (giữ nguyên)
app.use('/api/auth', require('./routes/authRoutes'));

// Danh mục nhóm vật tư
app.use('/api/material-groups', require('./routes/materialGroupRoutes'));

// Danh mục vật tư
app.use('/api/materials', require('./routes/materialRoutes'));

// Danh mục đối tượng (NCC / KH / NV)
app.use('/api/partners', require('./routes/partnerRoutes'));

// Danh mục kho + vị trí
app.use('/api/warehouses', require('./routes/warehouseRoutes'));

// Phiếu nhập kho
app.use('/api/inbound-receipts', require('./routes/inboundReceiptRoutes'));

// Phiếu xuất kho
app.use('/api/outbound-issues', require('./routes/outboundIssueRoutes'));

// Tồn kho vật tư
app.use('/api/material-stock', require('./routes/materialStockRoutes'));

// Dashboard (giữ nguyên)
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: `Route không tồn tại: ${req.method} ${req.path}` }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ message: 'Lỗi server', error: err.message });
});

module.exports = app;