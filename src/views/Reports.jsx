import { useState, useEffect, useMemo, useCallback } from 'react';
import { productApi } from '../services/productService';
import api from '../services/api';

const fmtCurrency = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);
const fmtDate = (d) => new Date(d).toLocaleString('vi-VN');

const TYPE_MAP = {
  inbound:  { label: 'Nhập',       color: '#16a34a', bg: '#f0fdf4', sign: '+' },
  outbound: { label: 'Xuất',       color: '#dc2626', bg: '#fef2f2', sign: '-' },
  initial:  { label: 'Khởi tạo',  color: '#2563eb', bg: '#eff6ff', sign: '+' },
  adjust:   { label: 'Điều chỉnh', color: '#d97706', bg: '#fffbeb', sign: '±' },
};

// ── Mini bar chart ──────────────────────────────────────────────
const MonthlyChart = ({ transactions }) => {
  const data = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      const d = new Date(t.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) map[key] = { in: 0, out: 0 };
      if (['inbound', 'initial'].includes(t.transaction_type)) map[key].in += t.quantity;
      if (t.transaction_type === 'outbound') map[key].out += t.quantity;
    });
    return Object.entries(map).sort().slice(-6).map(([k, v]) => ({
      label: k.slice(5) + '/' + k.slice(0, 4),
      in: v.in, out: v.out,
    }));
  }, [transactions]);

  if (data.length === 0) return null;

  const max = Math.max(...data.flatMap(d => [d.in, d.out]), 1);

  return (
    <div style={{ background: 'white', borderRadius: '14px', padding: '1.25rem 1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: '1.5rem' }}>
      <div style={{ fontWeight: '700', color: '#1a202c', marginBottom: '1rem', fontSize: '0.95rem' }}>
        📊 Biểu đồ nhập / xuất theo tháng
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.2rem', height: '130px', paddingBottom: '0.5rem' }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '3px', height: '100px' }}>
              <div title={`Nhập: ${d.in}`} style={{
                flex: 1, background: 'linear-gradient(180deg, #4ade80, #16a34a)',
                borderRadius: '4px 4px 0 0', height: `${(d.in / max) * 100}%`, minHeight: d.in > 0 ? '4px' : '0',
                transition: 'height 0.4s ease', cursor: 'default',
              }} />
              <div title={`Xuất: ${d.out}`} style={{
                flex: 1, background: 'linear-gradient(180deg, #f87171, #dc2626)',
                borderRadius: '4px 4px 0 0', height: `${(d.out / max) * 100}%`, minHeight: d.out > 0 ? '4px' : '0',
                transition: 'height 0.4s ease', cursor: 'default',
              }} />
            </div>
            <div style={{ fontSize: '0.72rem', color: '#718096', whiteSpace: 'nowrap' }}>{d.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#4a5568' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#16a34a' }} /> Nhập kho
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#4a5568' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#dc2626' }} /> Xuất kho
        </div>
      </div>
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────
const Reports = () => {
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState('all');       // all | inbound | outbound
  const [dateFilter, setDateFilter]     = useState({ start: '', end: '' });
  const [search, setSearch]             = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, txnRes] = await Promise.all([
        productApi.getAll({ limit: 200 }),
        api.get('/transactions?limit=1000'),
      ]);
      setProducts(prodRes.data || []);
      setTransactions(txnRes.data || []);
    } catch (err) {
      console.error('Reports fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filter theo tab + ngày + search
  const filtered = useMemo(() => {
    return transactions.filter(t => {
      // Tab
      if (tab === 'inbound'  && !['inbound', 'initial'].includes(t.transaction_type)) return false;
      if (tab === 'outbound' && t.transaction_type !== 'outbound') return false;

      // Ngày
      const tDate = new Date(t.created_at);
      if (dateFilter.start && tDate < new Date(dateFilter.start)) return false;
      if (dateFilter.end   && tDate > new Date(dateFilter.end + 'T23:59:59')) return false;

      // Search: tên SP, mã SP, người TH, NCC/KH, ghi chú
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = [t.product_name, t.product_code, t.performed_by, t.supplier_name, t.customer_name, t.note]
          .filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [transactions, tab, dateFilter, search]);

  const stats = useMemo(() => {
    const inn = transactions.filter(t => ['inbound', 'initial'].includes(t.transaction_type));
    const out = transactions.filter(t => t.transaction_type === 'outbound');
    const totalStock = products.reduce((s, p) => {
      const qty = p.stocks?.reduce((a, b) => a + (b.quantity_on_hand || 0), 0) || 0;
      return s + qty;
    }, 0);
    const totalValue = products.reduce((s, p) => {
      const qty = p.stocks?.reduce((a, b) => a + (b.quantity_on_hand || 0), 0) || 0;
      const cost = p.prices?.[0]?.cost_price || 0;
      return s + qty * cost;
    }, 0);
    return {
      totalIn:  inn.reduce((s, t) => s + t.quantity, 0),
      totalOut: out.reduce((s, t) => s + t.quantity, 0),
      inCount: inn.length, outCount: out.length,
      totalStock, totalValue,
      productCount: products.length,
    };
  }, [transactions, products]);

  const resetFilters = () => { setDateFilter({ start: '', end: '' }); setSearch(''); };

  const exportTxt = (type) => {
    const lines = [];
    const now = new Date().toLocaleString('vi-VN');
    if (type === 'summary') {
      lines.push('BÁO CÁO TỔNG QUAN KHO', `Ngày xuất: ${now}`, '');
      lines.push(`Tổng nhập kho  : ${stats.totalIn} đơn vị (${stats.inCount} giao dịch)`);
      lines.push(`Tổng xuất kho  : ${stats.totalOut} đơn vị (${stats.outCount} giao dịch)`);
      lines.push(`Tổng tồn kho   : ${stats.totalStock} đơn vị`);
      lines.push(`Giá trị tồn kho: ${fmtCurrency(stats.totalValue)}`);
    } else if (type === 'detail') {
      lines.push('BÁO CÁO CHI TIẾT GIAO DỊCH', `Ngày xuất: ${now}`, '');
      filtered.forEach((t, i) => {
        const info = TYPE_MAP[t.transaction_type] || TYPE_MAP.adjust;
        lines.push(`${i+1}. [${info.label}] ${t.product_name} (${t.product_code})`);
        lines.push(`   SL: ${info.sign}${t.quantity} | Trước: ${t.quantity_before} → Sau: ${t.quantity_after}`);
        lines.push(`   Kho: ${t.warehouse} | Người TH: ${t.performed_by} | ${fmtDate(t.created_at)}`);
        if (t.note) lines.push(`   Ghi chú: ${t.note}`);
        lines.push('');
      });
    } else {
      lines.push('BÁO CÁO TỒN KHO', `Ngày xuất: ${now}`, '');
      products.forEach((p, i) => {
        const qty = p.stocks?.reduce((a, b) => a + (b.quantity_on_hand || 0), 0) || 0;
        const cost = p.prices?.[0]?.cost_price || 0;
        lines.push(`${i+1}. ${p.product_name} (${p.product_code})`);
        lines.push(`   Tồn: ${qty} | Giá vốn: ${fmtCurrency(cost)}`);
        lines.push(`   Giá trị tồn: ${fmtCurrency(qty * cost)}`);
        lines.push('');
      });
      lines.push(`TỔNG GIÁ TRỊ TỒN KHO: ${fmtCurrency(stats.totalValue)}`);
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `bao-cao-${type}-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Styles ──
  const cardStyle = (color) => ({
    flex: '1', minWidth: '180px', background: 'white', borderRadius: '14px',
    padding: '1.25rem 1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', borderLeft: `4px solid ${color}`,
  });
  const btnStyle = (bg) => ({
    padding: '0.55rem 1rem', fontSize: '0.85rem', fontWeight: '600',
    background: bg, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer',
  });
  const tabStyle = (active) => ({
    padding: '0.55rem 1.25rem', fontWeight: '600', fontSize: '0.88rem', cursor: 'pointer', border: 'none',
    borderRadius: '8px', transition: 'all 0.15s',
    background: active ? '#6366f1' : 'transparent',
    color: active ? 'white' : '#718096',
  });

  return (
    <div style={{ padding: '1.5rem', background: '#f7f9fc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '700', color: '#1a202c' }}>Báo Cáo Kho Hàng</h1>
        <p style={{ margin: '0.25rem 0 0', color: '#718096', fontSize: '0.9rem' }}>Lịch sử nhập / xuất kho và tồn kho hiện tại</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#718096' }}>⏳ Đang tải dữ liệu...</div>
      ) : (
        <>
          {/* Stats cards */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <div style={cardStyle('#48bb78')}>
              <div style={{ fontSize: '0.82rem', color: '#718096', marginBottom: '0.4rem' }}>Tổng nhập kho</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#16a34a' }}>{stats.totalIn.toLocaleString()}</div>
              <div style={{ fontSize: '0.8rem', color: '#718096' }}>đơn vị • {stats.inCount} giao dịch</div>
            </div>
            <div style={cardStyle('#f56565')}>
              <div style={{ fontSize: '0.82rem', color: '#718096', marginBottom: '0.4rem' }}>Tổng xuất kho</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#dc2626' }}>{stats.totalOut.toLocaleString()}</div>
              <div style={{ fontSize: '0.8rem', color: '#718096' }}>đơn vị • {stats.outCount} giao dịch</div>
            </div>
            <div style={cardStyle('#4299e1')}>
              <div style={{ fontSize: '0.82rem', color: '#718096', marginBottom: '0.4rem' }}>Tồn kho hiện tại</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#2563eb' }}>{stats.totalStock.toLocaleString()}</div>
              <div style={{ fontSize: '0.8rem', color: '#718096' }}>{stats.productCount} sản phẩm</div>
            </div>
            <div style={cardStyle('#805ad5')}>
              <div style={{ fontSize: '0.82rem', color: '#718096', marginBottom: '0.4rem' }}>Giá trị tồn kho</div>
              <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#553c9a' }}>{fmtCurrency(stats.totalValue)}</div>
              <div style={{ fontSize: '0.8rem', color: '#718096' }}>theo giá vốn</div>
            </div>
          </div>

          {/* Biểu đồ */}
          <MonthlyChart transactions={transactions} />

          {/* Inventory table */}
          <div style={{ background: 'white', borderRadius: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: '1.5rem', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '700', color: '#1a202c' }}>📦 Tồn kho sản phẩm ({products.length})</span>
              <button onClick={() => exportTxt('stock')} style={btnStyle('#ed8936')}>📦 Xuất tồn kho</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f7fafc' }}>
                    {['Mã SP', 'Tên sản phẩm', 'Danh mục', 'Tồn kho', 'Giá vốn', 'Giá bán', 'Giá trị tồn'].map(h => (
                      <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.78rem', fontWeight: '700', color: '#718096', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => {
                    const qty  = p.stocks?.reduce((a, b) => a + (b.quantity_on_hand || 0), 0) || 0;
                    const cost = p.prices?.[0]?.cost_price || 0;
                    const sell = p.prices?.[0]?.selling_price || 0;
                    const cat  = p.category_id;
                    const catLabel = cat ? (cat.parent_id?.name ? `${cat.parent_id.name} (${cat.name})` : cat.name) : '—';
                    return (
                      <tr key={p._id} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#6366f1', fontWeight: '600' }}>{p.product_code}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: '#1a202c' }}>{p.product_name}</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#718096' }}>{catLabel}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: qty > 0 ? '#16a34a' : '#e53e3e' }}>{qty}</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#4a5568' }}>{fmtCurrency(cost)}</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#4a5568' }}>{fmtCurrency(sell)}</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: '600', color: '#553c9a' }}>{fmtCurrency(qty * cost)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {products.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>Không có sản phẩm nào</div>}
            </div>
          </div>

          {/* Transaction section */}
          <div style={{ background: 'white', borderRadius: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            {/* Tabs */}
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.25rem', background: '#f7fafc', borderRadius: '10px', padding: '0.25rem' }}>
                <button style={tabStyle(tab === 'all')}      onClick={() => setTab('all')}>Tất cả ({transactions.length})</button>
                <button style={tabStyle(tab === 'inbound')}  onClick={() => setTab('inbound')}>📥 Nhập ({transactions.filter(t => ['inbound','initial'].includes(t.transaction_type)).length})</button>
                <button style={tabStyle(tab === 'outbound')} onClick={() => setTab('outbound')}>📤 Xuất ({transactions.filter(t => t.transaction_type === 'outbound').length})</button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => exportTxt('summary')} style={btnStyle('#6366f1')}>📄 Tổng quan</button>
                <button onClick={() => exportTxt('detail')}  style={btnStyle('#48bb78')}>📋 Chi tiết</button>
              </div>
            </div>

            {/* Filters */}
            <div style={{ padding: '0.875rem 1.5rem', borderBottom: '1px solid #f0f0f0', background: '#fafbfc', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              {/* Search */}
              <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
                <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#a0aec0', fontSize: '0.9rem' }}>🔍</span>
                <input
                  type="text"
                  placeholder={tab === 'inbound' ? 'Tìm sản phẩm, nhà cung cấp, người nhập...' : tab === 'outbound' ? 'Tìm sản phẩm, khách hàng, người xuất...' : 'Tìm sản phẩm, NCC, khách hàng, người TH...'}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.1rem', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', background: 'white', color: '#1a202c', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
              {/* Date range */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.82rem', color: '#718096', fontWeight: '600', whiteSpace: 'nowrap' }}>Từ ngày:</label>
                <input type="date" value={dateFilter.start} onChange={e => setDateFilter(f => ({ ...f, start: e.target.value }))}
                  style={{ padding: '0.45rem', border: '2px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem', background: 'white', color: '#1a202c', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.82rem', color: '#718096', fontWeight: '600', whiteSpace: 'nowrap' }}>Đến ngày:</label>
                <input type="date" value={dateFilter.end} onChange={e => setDateFilter(f => ({ ...f, end: e.target.value }))}
                  style={{ padding: '0.45rem', border: '2px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem', background: 'white', color: '#1a202c', outline: 'none' }} />
              </div>
              {(search || dateFilter.start || dateFilter.end) && (
                <button onClick={resetFilters}
                  style={{ padding: '0.45rem 0.875rem', border: '2px solid #e2e8f0', borderRadius: '6px', background: 'white', cursor: 'pointer', fontSize: '0.82rem', color: '#718096', fontWeight: '600' }}>
                  ✕ Đặt lại
                </button>
              )}
              <span style={{ fontSize: '0.82rem', color: '#718096', marginLeft: 'auto' }}>
                {filtered.length} giao dịch
              </span>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f7fafc' }}>
                    {['#', 'Sản phẩm', 'Loại', 'Số lượng', 'Trước → Sau', 'Kho', tab === 'inbound' ? 'Nhà cung cấp' : tab === 'outbound' ? 'Khách hàng' : 'NCC / Khách', 'Ghi chú', 'Người TH', 'Thời gian'].map(h => (
                      <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: '#718096', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t, i) => {
                    const info = TYPE_MAP[t.transaction_type] || TYPE_MAP.adjust;
                    let party = t.supplier_name || t.customer_name || '';
                    if (!party && t.note) {
                      const khMatch = t.note.match(/KH:\s*([^-\n]+)/);
                      const nccMatch = t.note.match(/NCC:\s*([^-\n]+)/);
                      party = (khMatch?.[1] || nccMatch?.[1] || '').trim();
                    }
                    party = party || '—';
                    return (
                      <tr key={t._id} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#a0aec0' }}>{i + 1}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: '600', color: '#1a202c', fontSize: '0.88rem' }}>{t.product_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#a0aec0' }}>{t.product_code}</div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', background: info.bg, color: info.color }}>
                            {info.label}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: info.color, fontSize: '0.95rem' }}>{info.sign}{t.quantity}</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#4a5568' }}>{t.quantity_before} → {t.quantity_after}</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#718096' }}>{t.warehouse || '—'}</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#4a5568' }}>{party}</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#718096', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.note || '—'}</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#4a5568' }}>{t.performed_by}</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: '#718096', whiteSpace: 'nowrap' }}>{fmtDate(t.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: '#718096' }}>
                  {transactions.length === 0
                    ? 'Chưa có giao dịch nào. Hãy nhập hoặc xuất hàng để tạo lịch sử.'
                    : 'Không tìm thấy giao dịch phù hợp'}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;