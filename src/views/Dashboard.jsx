import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LineChart, Line, Area, AreaChart
} from 'recharts';
import './Dashboard.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n ?? 0);
const fmtCurrency = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n ?? 0);
const fmtDate = (d) => {
  const date = new Date(d);
  return date.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

// ─── Custom Tooltip for Chart ───────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="db-tooltip">
      <p className="db-tooltip__label">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <strong>{fmt(p.value)}</strong>
        </p>
      ))}
    </div>
  );
};

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ title, value, sub, icon, accent, loading }) => (
  <div className="db-stat-card" style={{ '--accent': accent }}>
    <div className="db-stat-card__icon">{icon}</div>
    <div className="db-stat-card__body">
      <span className="db-stat-card__title">{title}</span>
      {loading ? (
        <div className="db-skeleton db-skeleton--lg" />
      ) : (
        <h2 className="db-stat-card__value">{fmt(value)}</h2>
      )}
      {sub && <span className="db-stat-card__sub">{sub}</span>}
    </div>
    <div className="db-stat-card__bg-icon">{icon}</div>
  </div>
);

// ─── Low Stock Row ────────────────────────────────────────────────────────────
const LowStockRow = ({ item }) => {
  const pct = Math.min(100, Math.round((item.quantity / (item.threshold || 10)) * 100));
  const urgent = pct <= 20;
  return (
    <div className="db-low-row">
      <div className="db-low-row__info">
        <span className="db-low-row__name">{item.name}</span>
        <span className="db-low-row__code">{item.product_code}</span>
      </div>
      <div className="db-low-row__right">
        <div className="db-low-row__bar-wrap">
          <div
            className="db-low-row__bar"
            style={{ width: `${pct}%`, background: urgent ? '#ef4444' : '#f97316' }}
          />
        </div>
        <span className={`db-low-row__qty ${urgent ? 'db-low-row__qty--urgent' : ''}`}>
          {fmt(item.quantity)}
          <span className="db-low-row__unit"> {item.unit || 'cái'}</span>
        </span>
      </div>
    </div>
  );
};

// ─── Transaction Badge ───────────────────────────────────────────────────────
const TxBadge = ({ type }) => {
  const isIn = type === 'inbound' || type === 'initial';
  return (
    <span className={`db-badge ${isIn ? 'db-badge--in' : 'db-badge--out'}`}>
      {isIn ? '↑ Nhập' : '↓ Xuất'}
    </span>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartRange, setChartRange] = useState(7); // 7 or 30 days

  const token = localStorage.getItem('token');
  const chartRangeFromStorage = localStorage.getItem('chartRange');
  if (chartRangeFromStorage) {
    setChartRange(parseInt(chartRangeFromStorage));
  }

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [statsRes, lowRes, txRes, chartRes, topRes] = await Promise.all([
        fetch(`${API}/api/dashboard/stats`, { headers }),
        fetch(`${API}/api/dashboard/low-stock`, { headers }),
        fetch(`${API}/api/dashboard/recent-transactions`, { headers }),
        fetch(`${API}/api/dashboard/chart?days=${chartRange}`, { headers }),
        fetch(`${API}/api/dashboard/top-products`, { headers }),
      ]);

      const [s, l, t, c, tp] = await Promise.all([
        statsRes.json(), lowRes.json(), txRes.json(), chartRes.json(), topRes.json(),
      ]);

     setStats(s.data ?? s);
setLowStock(Array.isArray(l.data) ? l.data : Array.isArray(l) ? l : []);
setTransactions(Array.isArray(t.data) ? t.data : Array.isArray(t) ? t : []);
setChartData(Array.isArray(c.data) ? c.data : Array.isArray(c) ? c : []);
setTopProducts(Array.isArray(tp.data) ? tp.data : Array.isArray(tp) ? tp : []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Không thể tải dữ liệu dashboard. Kiểm tra server đang chạy chưa bro.');
    } finally {
      setLoading(false);
    }
  }, [token, chartRange]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const statCards = [
    {
      title: 'Tổng sản phẩm',
      value: stats?.totalProducts,
      sub: stats?.newProductsToday ? `+${stats.newProductsToday} hôm nay` : null,
      icon: '📦',
      accent: '#7c3aed',
    },
    {
      title: 'Tổng tồn kho',
      value: stats?.totalStock,
      sub: stats?.lowStockCount ? `⚠️ ${stats.lowStockCount} sp sắp hết` : 'Ổn định',
      icon: '🏭',
      accent: '#0ea5e9',
    },
    {
      title: 'Danh mục',
      value: stats?.totalCategories,
      sub: null,
      icon: '🗂️',
      accent: '#10b981',
    },
    {
      title: 'Nhà cung cấp',
      value: stats?.totalSuppliers,
      sub: null,
      icon: '🤝',
      accent: '#f59e0b',
    },
  ];

  return (
    <div className="db-root">
      {/* ── Header ── */}
      <div className="db-header">
        <div>
          <h1 className="db-header__title">Dashboard</h1>
          <p className="db-header__sub">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button className="db-refresh-btn" onClick={fetchAll} title="Làm mới">
          🔄 Làm mới
        </button>
      </div>

      {error && (
        <div className="db-error">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="db-stats-grid">
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} loading={loading} />
        ))}
      </div>

      {/* ── Row 2: Chart + Low Stock ── */}
      <div className="db-row2">
        {/* Chart */}
        <div className="db-card db-chart-card">
          <div className="db-card__header">
            <h3 className="db-card__title">📊 Nhập / Xuất kho</h3>
            <div className="db-range-tabs">
              {[7, 30].map((d) => (
                <button
                  key={d}
                  className={`db-range-tab ${chartRange === d ? 'db-range-tab--active' : ''}`}
                  onClick={() => setChartRange(d)}
                >
                  {d} ngày
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="db-skeleton db-skeleton--chart" />
          ) : chartData.length === 0 ? (
            <div className="db-empty">Chưa có giao dịch nào</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#888' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#888' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 13 }} />
                <Bar dataKey="nhap" name="Nhập kho" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="xuat" name="Xuất kho" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Low Stock */}
        <div className="db-card db-lowstock-card">
          <div className="db-card__header">
            <h3 className="db-card__title">
              ⚠️ Sắp hết hàng
              {lowStock.length > 0 && (
                <span className="db-badge-count">{lowStock.length}</span>
              )}
            </h3>
          </div>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="db-skeleton db-skeleton--row" style={{ marginBottom: 12 }} />
            ))
          ) : lowStock.length === 0 ? (
            <div className="db-empty db-empty--green">✅ Tất cả đang ổn định</div>
          ) : (
            <div className="db-low-list">
              {lowStock.map((item) => (
                <LowStockRow key={item._id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 3: Recent Transactions + Top Products ── */}
      <div className="db-row3">
        {/* Recent Transactions */}
        <div className="db-card db-tx-card">
          <div className="db-card__header">
            <h3 className="db-card__title">🕐 Giao dịch gần đây</h3>
            <span className="db-card__sub-label">10 giao dịch cuối</span>
          </div>
          {loading ? (
            <div className="db-skeleton db-skeleton--table" />
          ) : transactions.length === 0 ? (
            <div className="db-empty">Chưa có giao dịch</div>
          ) : (
            <div className="db-tx-table-wrap">
              <table className="db-tx-table">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Loại</th>
                    <th>Sản phẩm</th>
                    <th>SL</th>
                    <th>Người tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx._id}>
                      <td className="db-tx-time">{fmtDate(tx.created_at)}</td>
                      <td><TxBadge type={tx.transaction_type} /></td>
                      <td className="db-tx-product">
                        {tx.product_id?.name || tx.productName || '—'}
                        {tx.product_id?.product_code && (
                          <span className="db-tx-code"> #{tx.product_id.product_code}</span>
                        )}
                      </td>
                      <td className="db-tx-qty">
                        <strong>{fmt(tx.quantity)}</strong>
                        {tx.unit && <span className="db-tx-unit"> {tx.unit}</span>}
                      </td>
                      <td className="db-tx-user">{tx.performed_by || 'system'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="db-card db-top-card">
          <div className="db-card__header">
            <h3 className="db-card__title">🏆 Top sản phẩm</h3>
            <span className="db-card__sub-label">Theo tồn kho</span>
          </div>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="db-skeleton db-skeleton--row" style={{ marginBottom: 10 }} />
            ))
          ) : topProducts.length === 0 ? (
            <div className="db-empty">Chưa có dữ liệu</div>
          ) : (
            <div className="db-top-list">
              {topProducts.map((p, idx) => {
                const maxQty = topProducts[0]?.totalQuantity || 1;
                const pct = Math.round((p.totalQuantity / maxQty) * 100);
                return (
                  <div key={p._id} className="db-top-row">
                    <span className={`db-top-rank db-top-rank--${idx + 1}`}>{idx + 1}</span>
                    <div className="db-top-info">
                      <span className="db-top-name">{p.name}</span>
                      <div className="db-top-bar-wrap">
                        <div
                          className="db-top-bar"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="db-top-qty">{fmt(p.totalQuantity)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}