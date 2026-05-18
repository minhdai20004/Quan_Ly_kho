import { useState, useEffect } from 'react';
import { productApi, inventoryApi, warehouseApi } from '../services/productService';

const Inventory = () => {
  const [products,  setProducts]  = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [search,    setSearch]    = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('az');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustForm, setAdjustForm] = useState({
    adjustment_type: 'in',   // ✅ Đúng field name backend expect
    quantity: '',
    warehouse_id: '',         // ✅ Bắt buộc phải có
    reason: '',
  });
  const [adjusting, setAdjusting] = useState(false);

  // ── Fetch products + warehouses song song ─────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodRes, whRes] = await Promise.all([
        productApi.getAll({ limit: 200 }),
        warehouseApi.getAll().catch(() => ({ data: [] })), // không crash nếu chưa có kho
      ]);
      const prodList = prodRes?.data?.data ?? prodRes?.data ?? prodRes ?? [];
setProducts(Array.isArray(prodList) ? prodList : []);
      setWarehouses(whRes.data || whRes || []);
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getTotalStock = (p) => {
    const stocks = p.stocks || [];
    return stocks.reduce((sum, s) => sum + (Number(s.quantity_on_hand) || 0), 0);
  };

  const getCostPrice  = (p) => p.prices?.[0]?.cost_price || 0;
  const getSellPrice  = (p) => p.prices?.[0]?.selling_price || p.prices?.[0]?.wholesale_price || 0;

  const getStockStatus = (qty) => {
    const q = Number(qty);
    if (q === 0)   return { label: 'Hết hàng', bg: '#fed7d7', color: '#742a2a' };
    if (q < 10)    return { label: 'Sắp hết',  bg: '#fefcbf', color: '#744210' };
    return          { label: 'Còn đủ',   bg: '#c6f6d5', color: '#22543d' };
  };

  const formatCurrency = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

  // ── Map type label → adjustment_type backend ──────────────────────────────
  // Backend nhận: 'in' | 'out' | 'set'
  const TYPE_OPTIONS = [
    { value: 'in',  label: '+ Nhập thêm hàng' },
    { value: 'out', label: '- Xuất hàng / Giảm' },
    { value: 'set', label: '↺ Đặt lại số lượng chính xác' },
  ];

  // ── Mở modal điều chỉnh ───────────────────────────────────────────────────
  const openAdjustModal = (product) => {
    setSelectedProduct(product);
    // Lấy warehouse đầu tiên làm mặc định nếu có
    // warehouse_id có thể để trống - backend sẽ tự chọn kho mặc định
    setAdjustForm({
      adjustment_type: 'in',
      quantity: '',
      warehouse_id: warehouses[0]?._id || warehouses[0]?.warehouse_id || '',
      reason: '',
    });
    setShowAdjustModal(true);
  };

  // ── Gửi điều chỉnh ────────────────────────────────────────────────────────
  const handleAdjust = async () => {
    const qty = Number(adjustForm.quantity);
    if (!qty || qty <= 0) {
      alert('Vui lòng nhập số lượng hợp lệ (> 0)');
      return;
    }

    setAdjusting(true);
    try {
      // ✅ Gửi đúng field names mà inventoryController.adjustStock expect
      // warehouse_id có thể để trống - backend sẽ tự chọn kho mặc định
      await inventoryApi.adjustStock({
        product_id:      selectedProduct.product_id || selectedProduct._id,
        warehouse_id:    adjustForm.warehouse_id || undefined,  // Backend sẽ tự chọn nếu undefined
        adjustment_type: adjustForm.adjustment_type,   // 'in' | 'out' | 'set'
        quantity:        qty,
        notes:           adjustForm.reason || 'Điều chỉnh thủ công',
      });
      setShowAdjustModal(false);
      fetchData(); // refresh list
    } catch (err) {
      if (err.message?.includes('chưa có kho') || err.message?.includes('Chưa có kho')) {
        alert('⚠️ Chưa có kho nào trong hệ thống!\n\nVui lòng vào menu "Kho hàng" để tạo kho trước.');
      } else {
        alert('Lỗi: ' + (err.message || 'Không thể điều chỉnh'));
      }
    } finally {
      setAdjusting(false);
    }
  };

  // ── Filter + Sort ─────────────────────────────────────────────────────────
  const categories = [...new Set(products.map(p => p.category_id?.name).filter(Boolean))];

  const filtered = products
    .filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !search ||
        (p.product_name || '').toLowerCase().includes(q) ||
        (p.product_code || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q);
      const matchCat = !categoryFilter || p.category_id?.name === categoryFilter;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (sortOrder === 'az')         return (a.product_name || '').localeCompare(b.product_name || '');
      if (sortOrder === 'za')         return (b.product_name || '').localeCompare(a.product_name || '');
      if (sortOrder === 'stock_asc')  return getTotalStock(a) - getTotalStock(b);
      if (sortOrder === 'stock_desc') return getTotalStock(b) - getTotalStock(a);
      return 0;
    });

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalValue  = filtered.reduce((s, p) => s + getTotalStock(p) * getCostPrice(p), 0);
  const outOfStock  = filtered.filter(p => getTotalStock(p) === 0).length;
  const lowStock    = filtered.filter(p => { const q = getTotalStock(p); return q > 0 && q < 10; }).length;

  const inputStyle = {
    padding: '0.75rem 1rem', border: '2px solid #e2e8f0',
    borderRadius: '8px', fontSize: '0.95rem',
    background: 'white', outline: 'none', color: '#333',
    boxSizing: 'border-box',
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1a202c', margin: 0 }}>Quản Lý Tồn Kho</h1>
        <p style={{ color: '#718096', marginTop: '0.25rem' }}>WMS Warehouse Management System - Module Tồn Kho</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'TỔNG SẢN PHẨM',        value: filtered.length,            color: '#4a5568', accent: '#667eea' },
          { label: 'HẾT HÀNG',              value: outOfStock,                 color: '#e53e3e', accent: '#fc8181' },
          { label: 'SẮP HẾT',               value: lowStock,                   color: '#d69e2e', accent: '#f6ad55' },
          { label: 'TỔNG GIÁ TRỊ TỒN KHO', value: formatCurrency(totalValue), color: '#553c9a', accent: '#9f7aea', big: true },
        ].map((card, i) => (
          <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderLeft: `4px solid ${card.accent}` }}>
            <div style={{ fontSize: '0.75rem', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>{card.label}</div>
            <div style={{ fontSize: card.big ? '1.4rem' : '2rem', fontWeight: '700', color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem 1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ ...inputStyle, minWidth: '160px' }}>
          <option value="">Tất cả danh mục</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} style={{ ...inputStyle, minWidth: '190px' }}>
          <option value="az">Tên A → Z</option>
          <option value="za">Tên Z → A</option>
          <option value="stock_asc">Tồn kho: Thấp → Cao</option>
          <option value="stock_desc">Tồn kho: Cao → Thấp</option>
        </select>
        <input type="text" placeholder="Tìm kiếm sản phẩm (tên, mã)..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: '220px' }} />
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              {['Mã/Tên Sản Phẩm', 'Danh mục', 'Giá vốn', 'Giá bán', 'Số lượng', 'Giá trị', 'Trạng thái', 'Hành động'].map(h => (
                <th key={h} style={{ padding: '1rem', textAlign: 'left', color: 'white', fontWeight: '600', fontSize: '0.875rem' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ padding: '4rem', textAlign: 'center', color: '#718096' }}>⏳ Đang tải...</td></tr>
            ) : error ? (
              <tr>
                <td colSpan="8" style={{ padding: '4rem', textAlign: 'center', color: '#e53e3e' }}>
                  ⚠️ {error}
                  <div style={{ marginTop: '1rem' }}>
                    <button onClick={fetchData} style={{ padding: '0.5rem 1.5rem', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Thử lại</button>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="8" style={{ padding: '4rem', textAlign: 'center', color: '#718096' }}>📦 Không có sản phẩm nào</td></tr>
            ) : filtered.map((product, idx) => {
              const qty    = getTotalStock(product);
              const cost   = getCostPrice(product);
              const sell   = getSellPrice(product);
              const value  = qty * cost;
              const status = getStockStatus(qty);
              return (
                <tr key={product._id || idx}
                  style={{ borderBottom: '1px solid #f0f0f0', transition: 'background 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.background = '#fafbff'}
                  onMouseOut={e => e.currentTarget.style.background = 'white'}
                >
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: '600', color: '#1a202c', fontSize: '0.875rem' }}>{product.product_code || product.sku || '—'}</div>
                    <div style={{ color: '#718096', fontSize: '0.8rem', marginTop: '0.2rem' }}>{product.product_name}</div>
                  </td>
                  <td style={{ padding: '1rem', color: '#4a5568', fontSize: '0.875rem' }}>{product.category_id?.name || '—'}</td>
                  <td style={{ padding: '1rem', color: '#4a5568', fontSize: '0.875rem' }}>{formatCurrency(cost)}</td>
                  <td style={{ padding: '1rem', color: '#4a5568', fontSize: '0.875rem' }}>{formatCurrency(sell)}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ fontWeight: '700', fontSize: '1.1rem', color: qty === 0 ? '#e53e3e' : qty < 10 ? '#d69e2e' : '#38a169' }}>{qty}</span>
                  </td>
                  <td style={{ padding: '1rem', color: '#4a5568', fontSize: '0.875rem' }}>{formatCurrency(value)}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ padding: '0.3rem 0.8rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600', background: status.bg, color: status.color }}>{status.label}</span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button onClick={() => openAdjustModal(product)}
                      style={{ padding: '0.4rem 0.9rem', border: '1.5px solid #9f7aea', borderRadius: '6px', background: 'white', color: '#6b46c1', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500' }}
                      onMouseOver={e => { e.target.style.background = '#6b46c1'; e.target.style.color = 'white'; }}
                      onMouseOut={e => { e.target.style.background = 'white'; e.target.style.color = '#6b46c1'; }}
                    >
                      Điều chỉnh
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Adjust Modal ── */}
      {showAdjustModal && selectedProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '460px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <h2 style={{ margin: '0 0 0.25rem', color: '#1a202c', fontSize: '1.25rem', fontWeight: '700' }}>Điều chỉnh tồn kho</h2>
            <p style={{ color: '#718096', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              {selectedProduct.product_code} — {selectedProduct.product_name}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Tồn hiện tại */}
              <div style={{ background: '#f7fafc', borderRadius: '8px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#718096', fontSize: '0.875rem' }}>Số lượng hiện tại</span>
                <span style={{ fontWeight: '700', fontSize: '1.3rem', color: '#1a202c' }}>{getTotalStock(selectedProduct)}</span>
              </div>

              {/* Chọn kho — bắt buộc */}
              <div>
                <label style={{ display: 'block', fontWeight: '600', color: '#2d3748', marginBottom: '0.4rem', fontSize: '0.875rem' }}>
                  Kho *
                </label>
                {warehouses.length > 0 ? (
                  <select
                    value={adjustForm.warehouse_id}
                    onChange={e => setAdjustForm(f => ({ ...f, warehouse_id: e.target.value }))}
                    style={{ ...inputStyle, width: '100%' }}
                  >
                    <option value="">-- Chọn kho --</option>
                    {warehouses.map(w => (
                      <option key={w._id || w.warehouse_id} value={w._id || w.warehouse_id}>
                        {w.name || w.warehouse_name} {w.code ? `(${w.code})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div style={{ padding: '0.75rem', background: '#fff5f5', borderRadius: '8px', border: '1px solid #feb2b2', color: '#c53030', fontSize: '0.875rem' }}>
                    ⚠️ Chưa có kho nào. Vui lòng tạo kho trước tại menu <strong>Kho hàng</strong>.
                  </div>
                )}
              </div>

              {/* Loại điều chỉnh */}
              <div>
                <label style={{ display: 'block', fontWeight: '600', color: '#2d3748', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Loại điều chỉnh</label>
                <select
                  value={adjustForm.adjustment_type}
                  onChange={e => setAdjustForm(f => ({ ...f, adjustment_type: e.target.value }))}
                  style={{ ...inputStyle, width: '100%' }}
                >
                  {TYPE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Số lượng */}
              <div>
                <label style={{ display: 'block', fontWeight: '600', color: '#2d3748', marginBottom: '0.4rem', fontSize: '0.875rem' }}>
                  Số lượng *{' '}
                  {adjustForm.adjustment_type === 'set' && (
                    <span style={{ fontWeight: '400', color: '#718096' }}>(nhập số lượng thực tế cần đặt)</span>
                  )}
                </label>
                <input
                  type="number" min="0"
                  value={adjustForm.quantity}
                  onChange={e => setAdjustForm(f => ({ ...f, quantity: e.target.value }))}
                  placeholder="Nhập số lượng..."
                  style={{ ...inputStyle, width: '100%' }}
                  autoFocus
                />
              </div>

              {/* Preview kết quả */}
              {adjustForm.quantity && Number(adjustForm.quantity) > 0 && (
                <div style={{ background: '#ebf8ff', borderRadius: '8px', padding: '0.75rem 1rem', border: '1px solid #bee3f8', fontSize: '0.875rem', color: '#2b6cb0' }}>
                  {(() => {
                    const cur = getTotalStock(selectedProduct);
                    const qty = Number(adjustForm.quantity);
                    if (adjustForm.adjustment_type === 'in')  return `Sau điều chỉnh: ${cur} + ${qty} = ${cur + qty}`;
                    if (adjustForm.adjustment_type === 'out') return `Sau điều chỉnh: ${cur} - ${qty} = ${Math.max(0, cur - qty)}`;
                    if (adjustForm.adjustment_type === 'set') return `Sau điều chỉnh: đặt thành ${qty}`;
                  })()}
                </div>
              )}

              {/* Lý do */}
              <div>
                <label style={{ display: 'block', fontWeight: '600', color: '#2d3748', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Lý do</label>
                <input
                  type="text"
                  value={adjustForm.reason}
                  onChange={e => setAdjustForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Vd: Nhập hàng từ nhà cung cấp..."
                  style={{ ...inputStyle, width: '100%' }}
                />
              </div>

{/* Buttons */}
                             <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  onClick={handleAdjust}
                  disabled={adjusting}
                  style={{ flex: 1, padding: '0.875rem', background: adjusting ? '#a0aec0' : 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.95rem', fontWeight: '600', cursor: adjusting ? 'not-allowed' : 'pointer' }}
                >
                  {adjusting ? 'Đang lưu...' : 'Xác nhận'}
                </button>
                <button
                  onClick={() => setShowAdjustModal(false)}
                  style={{ flex: 1, padding: '0.875rem', background: '#edf2f7', color: '#4a5568', border: 'none', borderRadius: '8px', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer' }}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;