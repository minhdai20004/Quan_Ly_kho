import { useState, useEffect, useRef, useCallback } from 'react';
import { productApi, categoryApi } from '../services/productService';
import ProductUnits from '../components/ProductUnits';
import ProductVariants from '../components/ProductVariants';
import ProductSuppliers from '../components/ProductSuppliers';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

const formatDate = (dateString) =>
  dateString ? new Date(dateString).toLocaleDateString('vi-VN') : '—';

const isAdmin = (user) => user?.role === 'admin';

const STATUS_MAP = {
  active:       { label: 'Đang bán',  bg: '#d1fae5', color: '#065f46' },
  out_of_stock: { label: 'Hết hàng',  bg: '#fee2e2', color: '#991b1b' },
  inactive:     { label: 'Ngừng bán', bg: '#e5e7eb', color: '#374151' },
  draft:        { label: 'Nháp',      bg: '#fef3c7', color: '#92400e' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || STATUS_MAP.draft;
  return (
    <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600', background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
};

const inputStyle = {
  width: '100%', padding: '0.75rem', border: '2px solid #e2e8f0',
  borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box', outline: 'none',
  background: 'white', color: '#1a202c',
};

const ReadOnlyBadge = () => (
  <span style={{ padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', background: '#ebf8ff', color: '#2d3748', border: '1px solid #bee3f8' }}>
    👁 Chỉ xem
  </span>
);

const UNITS = [
  { value: 'piece', label: 'Cái' }, { value: 'box', label: 'Thùng' },
  { value: 'kg', label: 'Kg' },     { value: 'liter', label: 'Lít' },
  { value: 'pack', label: 'Túi' },  { value: 'meter', label: 'Mét' },
];


const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    categoryApi.getAll()
      .then(res => {
       const list = Array.isArray(res) ? res : (res.data?.data || res.data || []);
setCategories(list);
        setCategories(list); // giữ nguyên object gốc
      })
      .catch(err => console.error('Load categories failed:', err))
      .finally(() => setLoading(false));
  }, []);
  return { categories, loading };
};

// ── Modal wrapper ──────────────────────────────────────────────────────────────
const Modal = ({ children, onClose, maxWidth = '600px' }) => {
  const innerRef = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (innerRef.current && !innerRef.current.contains(e.target)) onClose(); };
    const id = setTimeout(() => document.addEventListener('mousedown', handler), 50);
    return () => { clearTimeout(id); document.removeEventListener('mousedown', handler); };
  }, [onClose]);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div ref={innerRef} style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }}>
        {children}
      </div>
    </div>
  );
};

// ── ActionButton ───────────────────────────────────────────────────────────────
const ActionBtn = ({ color, onClick, children, title, disabled }) => (
  <button onClick={onClick} title={title} disabled={disabled} style={{ padding: '0.4rem 0.7rem', border: `1px solid ${disabled ? '#e2e8f0' : color}`, borderRadius: '6px', background: 'white', color: disabled ? '#4a5568' : color, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: '500', transition: 'all 0.15s', opacity: disabled ? 0.6 : 1 }}
    onMouseOver={e => { if (!disabled) { e.currentTarget.style.background = color; e.currentTarget.style.color = '#1a202c'; }}}
    onMouseOut={e => { if (!disabled) { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = color; }}}
  >{children}</button>
);

// ── InfoCard ───────────────────────────────────────────────────────────────────
const InfoCard = ({ label, value, span, children }) => (
  <div style={{ padding: '1rem', background: '#f7fafc', borderRadius: '8px', gridColumn: span ? 'span 2' : undefined }}>
    <div style={{ fontSize: '0.78rem', color: '#4a5568', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    <div style={{ fontWeight: '600', color: '#1a202c', fontSize: span ? '1.1rem' : '0.95rem' }}>{children || value || '—'}</div>
  </div>
);

// ── CategorySelect ─────────────────────────────────────────────────────────────
const CategorySelect = ({ name, defaultValue = '', categories, loadingCats }) => (
  <select name={name} defaultValue={defaultValue} style={{ ...inputStyle, background: 'white', color: '#1a202c' }}>
    <option value="">{loadingCats ? 'Đang tải...' : 'Chọn danh mục'}</option>
    {categories.map(c => (
      <option key={c._id} value={c._id}>{c.name}</option>
    ))}useCategories
  </select>
);

// ── Stock Modal ────────────────────────────────────────────────────────────────
const StockModal = ({ product, type, onClose, onDone }) => {
  const isIn = type === 'inbound';
  const totalStock = product.stocks?.reduce((s, x) => s + (x.quantity_on_hand || 0), 0) || 0;
  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await productApi.updateStock(product._id || product.product_id, { transaction_type: type, quantity: parseInt(fd.get('quantity')) || 0, note: fd.get('note') || '' });
      alert(isIn ? 'Nhập kho thành công!' : 'Xuất kho thành công!');
      onDone(); onClose();
    } catch (err) { alert('Lỗi: ' + err.message); }
  };
  return (
    <Modal onClose={onClose} maxWidth="480px">
      <div style={{ padding: '2rem' }}>
        <h2 style={{ margin: '0 0 0.5rem', color: '#1a202c', fontSize: '1.4rem', fontWeight: '700' }}>{isIn ? '📦 Nhập hàng' : '📤 Xuất hàng'}</h2>
        <p style={{ margin: '0 0 1.25rem', color: '#4a5568', fontSize: '0.9rem' }}><strong>{product.product_name}</strong> ({product.product_code})</p>
        {!isIn && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: '#fff5f5', borderRadius: '8px', border: '1px solid #feb2b2' }}>
            Tồn hiện tại: <strong style={{ fontSize: '1.1rem', color: '#c53030' }}>{totalStock} {product.units?.[0]?.name || 'đơn vị'}</strong>
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#2d3748', fontSize: '0.9rem' }}>Số lượng {isIn ? 'nhập' : 'xuất'} *</label>
            <input type="number" name="quantity" required min="1" autoFocus max={!isIn ? totalStock : undefined} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#2d3748', fontSize: '0.9rem' }}>Ghi chú</label>
            <textarea name="note" rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" style={{ flex: 1, padding: '0.875rem', background: isIn ? '#48bb78' : '#f56565', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}>Xác nhận {isIn ? 'nhập' : 'xuất'}</button>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.875rem', background: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}>Hủy</button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

// ── Add Product Modal ──────────────────────────────────────────────────────────
const AddProductModal = ({ onClose, onDone }) => {
  const { categories, loading: loadingCats } = useCategories();
  const [selectedCatId, setSelectedCatId]     = useState('');
  const [selectedCatName, setSelectedCatName] = useState('');
  const [catQuery, setCatQuery]               = useState('');
  const [showCatDrop, setShowCatDrop]         = useState(false);
  const [code, setCode] = useState(`SP-${Math.floor(100000 + Math.random() * 900000)}`);
  const catBlurRef = useRef(null);

  const catSuggestions = catQuery.trim()
    ? categories.filter(c =>
        c.name.toLowerCase().includes(catQuery.toLowerCase()) ||
        (c.category_code || '').toLowerCase().includes(catQuery.toLowerCase())
      ).slice(0, 8)
    : categories.slice(0, 8);

  const handleSelectCat = (cat) => {
    setSelectedCatId(cat._id);
    setSelectedCatName(cat.name);
    setCatQuery('');
    setShowCatDrop(false);
    const prefix = (cat.category_code || '').trim().toUpperCase() || 'SP';
    setCode(`${prefix}-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  const handleClearCat = () => {
    setSelectedCatId('');
    setSelectedCatName('');
    setCatQuery('');
    setCode(`SP-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  const handleCatBlur = () => {
    catBlurRef.current = setTimeout(() => setShowCatDrop(false), 200);
  };

  const handleCatDropMouseDown = (e) => {
    e.preventDefault();
    clearTimeout(catBlurRef.current);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await productApi.create({
        product_code: code,
        sku: `SKU-${Date.now()}`,
        product_name: fd.get('name'),
        category_id: selectedCatId || null,
        status: 'active',
        product_type: 'goods',
        prices: [{ cost_price: parseFloat(fd.get('cost_price')) || 0, selling_price: parseFloat(fd.get('selling_price')) || 0 }],
        stocks: [{ quantity_on_hand: parseInt(fd.get('initial_stock')) || 0, transaction_type: 'initial' }],
        units: [{ name: fd.get('unit'), conversion_rate: 1, is_base: true }]
      });
      onDone(); onClose();
    } catch (err) { alert('Lỗi: ' + err.message); }
  };

  return (
    <Modal onClose={onClose}>
      <div style={{ padding: '2rem' }}>
        <h2 style={{ margin: '0 0 1.5rem', color: '#1a202c', fontSize: '1.5rem', fontWeight: '700' }}>Thêm Sản Phẩm Mới</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#2d3748', fontSize: '0.9rem' }}>Tên sản phẩm *</label>
            <input type="text" name="name" required autoFocus placeholder="Ví dụ: Chai Nước" style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#2d3748', fontSize: '0.9rem' }}>Danh mục</label>
            {selectedCatId ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.875rem', background: '#f0fdf4', border: '2px solid #86efac', borderRadius: '8px' }}>
                <span style={{ flex: 1, fontWeight: '600', color: '#16a34a', fontSize: '0.9rem' }}>✓ {selectedCatName}</span>
                <button type="button" onClick={handleClearCat} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0', fontSize: '1.1rem', lineHeight: 1 }}>×</button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#a0aec0', fontSize: '0.85rem', pointerEvents: 'none' }}>🗂️</span>
                <input
                  type="text"
                  placeholder={loadingCats ? 'Đang tải danh mục...' : 'Tìm danh mục...'}
                  value={catQuery}
                  onChange={e => { setCatQuery(e.target.value); setShowCatDrop(true); }}
                  onFocus={() => setShowCatDrop(true)}
                  onBlur={handleCatBlur}
                  disabled={loadingCats}
                  style={{ ...inputStyle, paddingLeft: '2rem' }}
                />
                {showCatDrop && catSuggestions.length > 0 && (
                  <div
                    onMouseDown={handleCatDropMouseDown}
                    style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '2px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 9999, maxHeight: '200px', overflowY: 'auto', marginTop: '2px' }}
                  >
                    {catSuggestions.map(c => (
                      <div key={c._id} onClick={() => handleSelectCat(c)}
                        style={{ padding: '0.6rem 0.875rem', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                        onMouseLeave={e => e.currentTarget.style.background = 'white'}
                      >
                        <span style={{ fontWeight: '500', color: '#1a202c', fontSize: '0.9rem' }}>{c.name}</span>
                        {c.category_code && <span style={{ fontSize: '0.75rem', color: '#a0aec0', fontFamily: 'monospace' }}>{c.category_code}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#2d3748', fontSize: '0.9rem' }}>Mã sản phẩm (tự động)</label>
            <input type="text" value={code} disabled style={{ ...inputStyle, background: '#f7fafc', color: '#4a5568' }} />
          </div>
          <div style={{ padding: '1rem', background: '#f7fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 0.75rem', color: '#2d3748', fontSize: '0.95rem', fontWeight: '600' }}>Giá cả</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[['cost_price', 'Giá nhập *'], ['selling_price', 'Giá bán *']].map(([name, label]) => (
                <div key={name}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500', color: '#4a5568', fontSize: '0.85rem' }}>{label}</label>
                  <input type="number" name={name} required min="0" placeholder="0" style={inputStyle} />
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: '1rem', background: '#f0fff4', borderRadius: '8px', border: '1px solid #c6f6d5' }}>
            <h4 style={{ margin: '0 0 0.75rem', color: '#2d3748', fontSize: '0.95rem', fontWeight: '600' }}>Tồn kho & Đơn vị</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500', color: '#4a5568', fontSize: '0.85rem' }}>Tồn kho đầu kỳ *</label>
                <input type="number" name="initial_stock" required min="0" placeholder="0" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500', color: '#4a5568', fontSize: '0.85rem' }}>Đơn vị tính *</label>
                <select name="unit" required style={{ ...inputStyle, background: 'white' }}>
                  <option value="">Chọn đơn vị</option>
                  {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" style={{ flex: 1, padding: '0.875rem', background: 'linear-gradient(135deg, #4caf50, #45a049)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}>Tạo sản phẩm</button>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.875rem', background: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}>Hủy</button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

// ── Edit Product Modal ─────────────────────────────────────────────────────────
const EditProductModal = ({ product, onClose, onDone }) => {
  const { categories, loading: loadingCats } = useCategories();
  
  const currentCategoryValue = 
    product.category_id?._id?.toString() || 
    product.category_id?.id?.toString() || 
    (typeof product.category_id === 'string' ? product.category_id : '') || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await productApi.update(product._id || product.product_id, {
        product_name: fd.get('name'),
        category_id: fd.get('category') || null,
        prices: [{ cost_price: parseFloat(fd.get('cost_price')) || 0, selling_price: parseFloat(fd.get('selling_price')) || 0 }]
      });
      onDone(); onClose();
    } catch (err) { alert('Lỗi: ' + err.message); }
  };

  return (
    <Modal onClose={onClose}>
      <div style={{ padding: '2rem' }}>
        <h2 style={{ margin: '0 0 1.5rem', color: '#1a202c', fontSize: '1.5rem', fontWeight: '700' }}>✏️ Sửa Sản Phẩm</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#2d3748', fontSize: '0.9rem' }}>Tên sản phẩm *</label>
            <input type="text" name="name" required defaultValue={product.product_name} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#2d3748', fontSize: '0.9rem' }}>Mã sản phẩm</label>
            <input type="text" value={product.product_code} disabled style={{ ...inputStyle, background: '#f7fafc', color: '#4a5568' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#2d3748', fontSize: '0.9rem' }}>Danh mục</label>
            <CategorySelect name="category" defaultValue={currentCategoryValue} categories={categories} loadingCats={loadingCats} />
          </div>
          <div style={{ padding: '1rem', background: '#f7fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 0.75rem', color: '#2d3748', fontSize: '0.95rem', fontWeight: '600' }}>Giá cả</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500', color: '#4a5568', fontSize: '0.85rem' }}>Giá nhập *</label>
                <input type="number" name="cost_price" required min="0" defaultValue={product.prices?.[0]?.cost_price || 0} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '500', color: '#4a5568', fontSize: '0.85rem' }}>Giá bán *</label>
                <input type="number" name="selling_price" required min="0" defaultValue={product.prices?.[0]?.selling_price || product.prices?.[0]?.wholesale_price || 0} style={inputStyle} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" style={{ flex: 1, padding: '0.875rem', background: 'linear-gradient(135deg, #4caf50, #45a049)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}>Lưu thay đổi</button>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.875rem', background: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}>Hủy</button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

// ── Detail Modal ───────────────────────────────────────────────────────────────
const DetailModal = ({ product, user, onClose, onUpdate }) => {
  const admin = isAdmin(user);
  const [activeTab, setActiveTab] = useState('overview');
  const [stockModal, setStockModal] = useState(null);

  const tabs = [
    { id: 'overview', label: '📋 Tổng quan', color: '#4299e1' },
    { id: 'stock',    label: '🏭 Kho',       color: '#38b2ac' },
    ...(admin ? [{ id: 'advanced', label: '⚙️ Nâng cao', color: '#9f7aea' }] : []),
  ];

  const totalStock = product.stocks?.reduce((s, x) => s + (x.quantity_on_hand || 0), 0) || 0;
  const cost    = product.prices?.[0]?.cost_price || 0;
  const selling = product.prices?.[0]?.selling_price || product.prices?.[0]?.wholesale_price || 0;
  const profit  = selling - cost;
  const margin  = selling > 0 ? ((profit / selling) * 100).toFixed(1) : 0;

  return (
    <>
      <Modal onClose={onClose} maxWidth="1100px">
        <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>

          {/* Header */}
          <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: admin ? '#f7fafc' : '#ebf8ff', flexShrink: 0 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                <h2 style={{ color: '#1a202c', fontWeight: '700', margin: 0, fontSize: '1.2rem' }}>{product.product_code} — {product.product_name}</h2>
                <StatusBadge status={product.status} />
                {admin
                  ? <span style={{ padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', background: '#faf5ff', color: '#6b46c1', border: '1px solid #d6bcfa' }}>👑 Admin</span>
                  : <ReadOnlyBadge />
                }
              </div>
              <p style={{ color: '#4a5568', margin: 0, fontSize: '0.82rem' }}>SKU: {product.sku}{product.barcode && ` | Barcode: ${product.barcode}`}</p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#4a5568', width: '32px', height: '32px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', padding: '0 2rem', background: 'white', flexShrink: 0 }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '0.875rem 1.5rem', border: 'none', background: 'none', cursor: 'pointer', fontWeight: activeTab === tab.id ? '600' : '400', color: activeTab === tab.id ? tab.color : '#4a5568', borderBottom: activeTab === tab.id ? `2px solid ${tab.color}` : '2px solid transparent', marginBottom: '-1px', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>

            {/* ══ TAB: TỔNG QUAN ══ */}
            {activeTab === 'overview' && (
              <div>
                <p style={{ fontSize: '0.78rem', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', margin: '0 0 1rem' }}>Thông tin cơ bản</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                  <InfoCard label="Mã sản phẩm" value={product.product_code} />
                  <InfoCard label="SKU" value={product.sku} />
                  <InfoCard label="Danh mục" value={product.category_id ? (product.category_id.parent_id?.name ? `${product.category_id.parent_id.name} (${product.category_id.name})` : product.category_id.name) : 'Chưa phân loại'} />
                  <InfoCard label="Ngày tạo" value={formatDate(product.created_at)} />
                  <InfoCard label="Tên sản phẩm" span><span style={{ fontSize: '1.1rem' }}>{product.product_name}</span></InfoCard>
                </div>

                {/* Giá — admin thấy đủ, nhân viên ẩn giá vốn & lãi */}
                <p style={{ fontSize: '0.78rem', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', margin: '0 0 0.75rem' }}>
                  Giá cả {!admin && <span style={{ color: '#4a5568', fontWeight: '400', textTransform: 'none' }}>— giá vốn được ẩn</span>}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: admin ? 'repeat(3, 1fr)' : '1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  {admin && (
                    <div style={{ padding: '1rem', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.78rem', color: '#4a5568', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Giá nhập (vốn)</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: '700', color: '#2d3748' }}>{formatCurrency(cost)}</div>
                    </div>
                  )}
                  <div style={{ padding: '1rem', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.78rem', color: '#4a5568', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Giá bán</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: '700', color: '#38a169' }}>{formatCurrency(selling)}</div>
                  </div>
                  {admin && (
                    <div style={{ padding: '1rem', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.78rem', color: '#4a5568', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Lãi gộp</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: '700', color: profit >= 0 ? '#ed8936' : '#e53e3e' }}>{formatCurrency(profit)} ({margin}%)</div>
                    </div>
                  )}
                </div>

                <div style={{ padding: '1.5rem', background: '#f0fff4', borderRadius: '12px', border: '1px solid #c6f6d5' }}>
                  <div style={{ fontSize: '0.78rem', color: '#276749', marginBottom: '0.4rem', textTransform: 'uppercase', fontWeight: '600' }}>Tồn kho hiện tại</div>
                  <div style={{ fontSize: '2.25rem', fontWeight: '700', color: '#276749' }}>
                    {totalStock} <span style={{ fontSize: '1rem', fontWeight: '400' }}>{product.units?.[0]?.name || 'đơn vị'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* ══ TAB: KHO ══ */}
            {activeTab === 'stock' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Nút thao tác: CHỈ admin */}
                {admin ? (
                  <div>
                    <p style={{ fontSize: '0.78rem', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', margin: '0 0 0.75rem' }}>Thao tác kho</p>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button onClick={() => setStockModal('inbound')} style={{ padding: '0.75rem 1.5rem', background: '#48bb78', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem' }}>📦 Nhập kho</button>
                      <button onClick={() => setStockModal('outbound')} style={{ padding: '0.75rem 1.5rem', background: '#f56565', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem' }}>📤 Xuất kho</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '0.875rem 1.25rem', background: '#ebf8ff', borderRadius: '8px', border: '1px solid #bee3f8', color: '#2b6cb0', fontSize: '0.9rem' }}>
                    👁 Bạn chỉ có quyền xem lịch sử kho. Liên hệ admin để thực hiện nhập / xuất kho.
                  </div>
                )}

                {/* Tồn theo vị trí */}
                <div>
                  <p style={{ fontSize: '0.78rem', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', margin: '0 0 0.75rem' }}>Tồn kho theo vị trí</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                    {product.stocks?.filter(s => s.warehouse_id)?.length > 0
                      ? product.stocks.filter(s => s.warehouse_id).map((s, i) => (
                          <div key={i} style={{ padding: '1rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.8rem', color: '#4a5568' }}>{s.warehouse_name || `Kho ${i + 1}`}</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#276749' }}>{s.quantity_on_hand || 0}</div>
                            {s.location && <div style={{ fontSize: '0.75rem', color: '#4a5568', marginTop: '0.2rem' }}>📍 {s.location}</div>}
                          </div>
                        ))
                      : (
                          <div style={{ padding: '1rem', background: '#f0fff4', border: '1px solid #c6f6d5', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.8rem', color: '#4a5568' }}>Tổng tồn kho</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#276749' }}>{totalStock} {product.units?.[0]?.name || ''}</div>
                          </div>
                        )
                    }
                  </div>
                </div>

                 {/* Lịch sử điều chỉnh */}
                 <div>
                   <p style={{ fontSize: '0.78rem', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', margin: '0 0 0.75rem' }}>Lịch sử nhập / xuất / điều chỉnh</p>
                   <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                     <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                       <thead style={{ background: '#f7fafc' }}>
                         <tr>
                           {['Ngày', 'Loại', 'Thay đổi', 'Từ → Đến', 'Ghi chú'].map(h => (
                             <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', color: '#4a5568', fontSize: '0.85rem', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                           ))}
                         </tr>
                       </thead>
                       <tbody>
                         {product.audit_history?.length > 0 ? product.audit_history.slice(0, 50).map((aud, i) => {
                           const date = aud.created_at ? new Date(aud.created_at).toLocaleDateString('vi-VN') : '—';
                           const typeMap = { in: 'Nhập', out: 'Xuất', set: 'Đặt lại', reserve: 'Đặt trước', release: 'Giảm trừ' };
                           const typeLabel = typeMap[aud.adjustment_type] || aud.adjustment_type;
                           const change = Number(aud.quantity_change) || 0;
                           const isInc = change >= 0;
                           const before = Number(aud.quantity_before) || 0;
                           const after  = Number(aud.quantity_after)  || 0;
                           return (
                             <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                               <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{date}</td>
                               <td style={{ padding: '0.75rem 1rem' }}>
                                 <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', background: isInc ? '#c6f6d5' : '#fed7d7', color: isInc ? '#22543d' : '#742a2a' }}>
                                   {typeLabel}
                                 </span>
                               </td>
                               <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: isInc ? '#276749' : '#c53030' }}>
                                 {isInc ? '+' : ''}{change}
                               </td>
                               <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#4a5568' }}>
                                 {before} → {after}
                               </td>
                               <td style={{ padding: '0.75rem 1rem', color: '#4a5568', fontSize: '0.875rem' }}>{aud.notes || '—'}</td>
                             </tr>
                           );
                         }) : (
                           <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#4a5568' }}>Chưa có lịch sử điều chỉnh</td></tr>
                         )}
                       </tbody>
                     </table>
                   </div>
                 </div>
              </div>
            )}

            {/* ══ TAB: NÂNG CAO — CHỈ ADMIN ══ */}
            {activeTab === 'advanced' && admin && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {[
                  { title: '📐 Đơn vị tính',        component: <ProductUnits    productId={product._id || product.product_id} units={product.units || []}     onUpdate={onUpdate} /> },
                  { title: '🎨 Biến thể sản phẩm',  component: <ProductVariants productId={product._id || product.product_id} variants={product.variants || []} onUpdate={onUpdate} /> },
                  { title: '🏭 Nhà cung cấp',        component: <ProductSuppliers productId={product._id || product.product_id} suppliers={product.suppliers || []} onUpdate={onUpdate} /> },
                ].map(({ title, component }) => (
                  <div key={title}>
                    <p style={{ fontSize: '0.78rem', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', margin: '0 0 0.75rem' }}>{title}</p>
                    {component}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {stockModal && admin && (
        <StockModal product={product} type={stockModal} onClose={() => setStockModal(null)} onDone={onUpdate} />
      )}
    </>
  );
};

// ── Inbound Modal ──────────────────────────────────────────────────────────────
const InboundModal = ({ onClose, onDone }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  const handleSearch = (val) => {
    setQuery(val);
    setSelected(null);
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await productApi.getAll({ search: val, limit: 8 });
        setSuggestions(res.data || []);
      } catch { setSuggestions([]); }
      finally { setSearching(false); }
    }, 300);
  };

  const handleSelect = (p) => {
    setSelected(p);
    setQuery(p.product_name);
    setSuggestions([]);
  };

  const handleSubmit = async () => {
    if (!selected) return alert('Vui lòng chọn sản phẩm!');
    if (quantity <= 0) return alert('Số lượng phải lớn hơn 0!');
    setLoading(true);
    try {
      await productApi.updateStock(selected._id, {
        transaction_type: 'inbound',
        quantity,
        note,
      });
      alert(`Nhập kho thành công! +${quantity} ${selected.product_name}`);
      onDone();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '520px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '700', color: '#1a202c' }}>📦 Nhập hàng vào kho</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#718096' }}>×</button>
        </div>
        <div style={{ marginBottom: '1.25rem', position: 'relative' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#2d3748' }}>Tìm sản phẩm *</label>
          <input
            type="text"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Nhập tên, mã SP, SKU..."
            autoFocus
            style={{ width: '100%', padding: '0.75rem', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }}
          />
          {searching && (
            <div style={{ position: 'absolute', right: '0.75rem', top: '2.5rem', color: '#718096', fontSize: '0.85rem' }}>Đang tìm...</div>
          )}
          {suggestions.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '2px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 10, maxHeight: '240px', overflowY: 'auto' }}>
              {suggestions.map(p => (
                <div key={p._id} onClick={() => handleSelect(p)}
                  style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f7fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: '#1a202c', fontSize: '0.9rem' }}>{p.product_name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#718096' }}>{p.product_code} • {p.sku}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: '#48bb78', fontWeight: '600' }}>Tồn: {p.totalStock ?? 0}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {selected && (
          <div style={{ background: '#f0fff4', border: '1px solid #9ae6b4', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: '700', color: '#22543d' }}>{selected.product_name}</div>
              <div style={{ fontSize: '0.82rem', color: '#276749' }}>{selected.product_code} • Tồn hiện tại: {selected.totalStock ?? 0}</div>
            </div>
            <button onClick={() => { setSelected(null); setQuery(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718096', fontSize: '1.2rem' }}>×</button>
          </div>
        )}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#2d3748' }}>Số lượng nhập *</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={e => setQuantity(parseInt(e.target.value) || 1)}
            style={{ width: '100%', padding: '0.75rem', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#2d3748' }}>Ghi chú</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Nhập ghi chú (không bắt buộc)..."
            rows={2}
            style={{ width: '100%', padding: '0.75rem', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box', resize: 'vertical' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleSubmit} disabled={loading || !selected}
            style={{ flex: 1, padding: '0.85rem', background: (!selected || loading) ? '#a0aec0' : '#48bb78', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '1rem', cursor: (!selected || loading) ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Đang nhập...' : '📦 Xác nhận nhập hàng'}
          </button>
          <button onClick={onClose} style={{ padding: '0.85rem 1.5rem', background: '#edf2f7', color: '#4a5568', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Hủy</button>
        </div>
      </div>
    </div>
  );
};
// ── Sale Modal ─────────────────────────────────────────────────────────────────
const SaleModal = ({ onClose, onDone }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  const handleSearch = (val) => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await productApi.getAll({ search: val, limit: 8 });
        setSuggestions(res.data || []);
      } catch { setSuggestions([]); }
      finally { setSearching(false); }
    }, 300);
  };

  const handleSelect = (p) => {
    if (cart.find(c => c._id === p._id)) {
      setQuery(''); setSuggestions([]); return;
    }
    const stock = Array.isArray(p.stocks)
      ? p.stocks.reduce((a, b) => a + (b.quantity_on_hand || 0), 0)
      : (p.totalStock ?? 0);
    const price = p.prices?.[0]?.selling_price || p.prices?.[0]?.wholesale_price || 0;
    setCart(prev => [...prev, { ...p, qty: 1, maxQty: stock, price }]);
    setQuery(''); setSuggestions([]);
  };

  const updateQty = (id, val) => {
    setCart(prev => prev.map(c => c._id === id ? { ...c, qty: Math.max(1, Math.min(val, c.maxQty)) } : c));
  };

  const removeItem = (id) => setCart(prev => prev.filter(c => c._id !== id));

  const total = cart.reduce((sum, c) => sum + c.price * c.qty, 0);

  const handleSubmit = async () => {
    if (cart.length === 0) return alert('Chưa có sản phẩm trong đơn!');
    const outOfStock = cart.filter(c => c.qty > c.maxQty);
    if (outOfStock.length > 0) return alert(`Không đủ tồn kho: ${outOfStock.map(c => c.product_name).join(', ')}`);
    setLoading(true);
    try {
      await Promise.all(cart.map(c =>
        productApi.updateStock(c._id, {
          transaction_type: 'outbound',
          quantity: c.qty,
          note: `Đơn bán${customerName ? ' - KH: ' + customerName : ''}${note ? ' - ' + note : ''}`,
        })
      ));
      alert(`Xuất kho thành công! ${cart.length} sản phẩm${customerName ? ' cho ' + customerName : ''}`);
      onDone(); onClose();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '640px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

        {/* Header */}
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '700', color: '#1a202c' }}>🛒 Tạo đơn bán</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#718096' }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Tên khách */}
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#2d3748' }}>Tên khách hàng</label>
            <input
              type="text"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="Nhập tên khách (không bắt buộc)..."
              style={{ width: '100%', padding: '0.75rem', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          {/* Search sản phẩm */}
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#2d3748' }}>Thêm sản phẩm</label>
            <input
              type="text"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Tìm theo tên, mã SP, SKU..."
              style={{ width: '100%', padding: '0.75rem', border: '2px solid #4299e1', borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }}
            />
            {searching && <div style={{ position: 'absolute', right: '0.75rem', top: '2.6rem', color: '#718096', fontSize: '0.85rem' }}>Đang tìm...</div>}
            {suggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '2px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 9999, maxHeight: '220px', overflowY: 'auto' }}>
                {suggestions.map(p => {
                  const inCart = cart.find(c => c._id === p._id);
                  const stock = Array.isArray(p.stocks)
                    ? p.stocks.reduce((a, b) => a + (b.quantity_on_hand || 0), 0)
                    : (p.totalStock ?? 0);
                  const price = p.prices?.[0]?.selling_price || p.prices?.[0]?.wholesale_price || 0;
                  return (
                    <div key={p._id} onClick={() => !inCart && stock > 0 && handleSelect(p)}
                      style={{ padding: '0.75rem 1rem', cursor: inCart || stock === 0 ? 'not-allowed' : 'pointer', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: inCart || stock === 0 ? 0.5 : 1 }}
                      onMouseEnter={e => { if (!inCart && stock > 0) e.currentTarget.style.background = '#ebf8ff'; }}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    >
                      <div>
                        <div style={{ fontWeight: '600', color: '#1a202c', fontSize: '0.9rem' }}>{p.product_name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#718096' }}>{p.product_code} • {formatCurrency(price)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: '600', color: stock > 0 ? '#48bb78' : '#e53e3e' }}>Tồn: {stock}</div>
                        {inCart && <div style={{ fontSize: '0.75rem', color: '#4299e1' }}>Đã thêm</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Giỏ hàng */}
          {cart.length > 0 && (
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#2d3748' }}>Giỏ hàng ({cart.length} SP)</label>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                {cart.map((c, i) => (
                  <div key={c._id} style={{ padding: '0.75rem 1rem', borderBottom: i < cart.length - 1 ? '1px solid #f0f0f0' : 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#1a202c', fontSize: '0.9rem' }}>{c.product_name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#718096' }}>{formatCurrency(c.price)} / đơn vị • Tồn: {c.maxQty}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button onClick={() => updateQty(c._id, c.qty - 1)} style={{ width: '28px', height: '28px', border: '1px solid #e2e8f0', borderRadius: '6px', background: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '1rem' }}>−</button>
                      <input type="number" value={c.qty} min="1" max={c.maxQty}
                        onChange={e => updateQty(c._id, parseInt(e.target.value) || 1)}
                        style={{ width: '52px', textAlign: 'center', padding: '0.3rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.9rem' }}
                      />
                      <button onClick={() => updateQty(c._id, c.qty + 1)} style={{ width: '28px', height: '28px', border: '1px solid #e2e8f0', borderRadius: '6px', background: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '1rem' }}>+</button>
                    </div>
                    <div style={{ minWidth: '90px', textAlign: 'right', fontWeight: '700', color: '#2d3748', fontSize: '0.9rem' }}>{formatCurrency(c.price * c.qty)}</div>
                    <button onClick={() => removeItem(c._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', fontSize: '1.1rem', padding: '0.25rem' }}>×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ghi chú */}
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#2d3748' }}>Ghi chú</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Ghi chú đơn hàng..."
              rows={2}
              style={{ width: '100%', padding: '0.75rem', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box', resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Footer - Tổng tiền + buttons */}
        <div style={{ padding: '1.25rem 2rem', borderTop: '1px solid #e2e8f0', background: '#f7fafc', borderRadius: '0 0 16px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontWeight: '600', color: '#4a5568' }}>Tổng tiền:</span>
            <span style={{ fontSize: '1.4rem', fontWeight: '700', color: '#2b6cb0' }}>{formatCurrency(total)}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={handleSubmit} disabled={loading || cart.length === 0}
              style={{ flex: 1, padding: '0.875rem', background: loading || cart.length === 0 ? '#a0aec0' : '#4299e1', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '1rem', cursor: loading || cart.length === 0 ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Đang xử lý...' : `🛒 Xác nhận đơn bán${cart.length > 0 ? ` (${cart.length} SP)` : ''}`}
            </button>
            <button onClick={onClose} style={{ padding: '0.875rem 1.5rem', background: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Hủy</button>
          </div>
        </div>
      </div>
    </div>
  );
};
// ══ MAIN ══════════════════════════════════════════════════════════════════════
const Products = ({ user }) => {
  const admin = isAdmin(user);
  const [products,      setProducts]      = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState(null);
  const [showAdd,       setShowAdd]       = useState(false);
  const [showInbound,   setShowInbound]   = useState(false);
  const [showSale,      setShowSale]      = useState(false);
  const [editProduct,   setEditProduct]   = useState(null);
  const [stockFlow,     setStockFlow]     = useState(null);
  const [detailProduct, setDetailProduct] = useState(null);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [statusFilter,  setStatusFilter]  = useState('');
  const [sortOrder,     setSortOrder]     = useState('stock_asc');
  const [pagination,    setPagination]    = useState({ page: 1, total: 0, pages: 0 });

  const filtersRef = useRef({ page: 1, sortOrder: 'stock_asc', statusFilter: '', searchQuery: '' });
const unwrapResponse = (response) => response?.data?.data ?? response?.data ?? response;
useEffect(() => {
  filtersRef.current = { page: pagination.page, sortOrder, statusFilter, searchQuery };
}, [pagination.page, sortOrder, statusFilter, searchQuery]);

  const fetchProducts = useCallback(async () => {
    const { page, sortOrder: so, statusFilter: sf, searchQuery: sq } = filtersRef.current;
    setLoading(true); setError(null);
    try {
      const LIMIT = 15;
      // Sort mặc định: stock ít nhất lên đầu — fetch tất cả rồi sort client-side
      // Với newest/oldest dùng sort backend
      const sortParam = so === 'newest' ? '-created_at' : so === 'oldest' ? 'created_at' : '-created_at';
      const params = { page, limit: LIMIT, sort: sortParam, ...(sf && { status: sf }), ...(sq && { search: sq }) };
      const res = await productApi.getAll(params);

      // api.js dùng fetch thủ công → res là response body trực tiếp: { success, data, pagination }
      const raw = res?.data !== undefined ? res : (res?.data ?? res);
      const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
      const pag  = raw?.pagination || {};
      console.log('📦 API res:', JSON.stringify({ total: pag.total, pages: pag.pages, listLen: list.length }));
      const total = pag.total ?? list.length;
      const pages = (pag.pages ?? Math.ceil(total / LIMIT)) || 1;

      // Sort client-side theo stock
      let sorted = [...list];
      if (so === 'stock_asc' || so === 'newest') {
        sorted.sort((a, b) => {
          const qa = Array.isArray(a.stocks) ? a.stocks.reduce((s, x) => s + (x.quantity_on_hand || 0), 0) : 0;
          const qb = Array.isArray(b.stocks) ? b.stocks.reduce((s, x) => s + (x.quantity_on_hand || 0), 0) : 0;
          return so === 'stock_asc' ? qa - qb : qb - qa;
        });
      }

      setProducts(so === 'stock_asc' || so === 'stock_desc' ? sorted : list);
      setPagination(prev => ({ ...prev, page, total, pages }));
    } catch (err) { if (err.name !== 'AbortError') setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProducts(); }, [pagination.page, sortOrder, statusFilter, fetchProducts]);
  useEffect(() => {
    if (searchQuery === '') { setPagination(p => ({ ...p, page: 1 })); fetchProducts(); return; }
    const id = setTimeout(() => { setPagination(p => ({ ...p, page: 1 })); fetchProducts(); }, 500);
    return () => clearTimeout(id);
  }, [searchQuery, fetchProducts]);

  const refreshDetail = useCallback(async (product) => {
    try { const res = await productApi.getById(product._id || product.product_id); setDetailProduct(unwrapResponse(res)); }
    catch (err) { console.error('Refresh detail failed:', err); }
  }, []);

  const handleUpdate = useCallback(async () => {
    await fetchProducts();
    if (detailProduct) refreshDetail(detailProduct);
  }, [fetchProducts, detailProduct, refreshDetail]);

  const handleViewDetail = async (product) => {
    try { const res = await productApi.getById(product._id || product.product_id); setDetailProduct(unwrapResponse(res)); }
    catch (err) { alert('Lỗi: ' + err.message); }
  };

  const handleDelete = async (productId) => {
    if (!admin || !window.confirm('Xóa sản phẩm này?')) return;
    try { await productApi.delete(productId); fetchProducts(); }
    catch (err) { alert('Lỗi: ' + err.message); }
  };

  const handleToggleStatus = async (product) => {
    if (!admin) return;
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    try {
      await productApi.update(product._id || product.product_id, { status: newStatus });
      fetchProducts();
      if (detailProduct && (detailProduct.product_id === product.product_id || detailProduct._id === product._id))
        setDetailProduct(prev => ({ ...prev, status: newStatus }));
    } catch (err) { alert('Lỗi: ' + err.message); }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <style>{`
        input::placeholder, textarea::placeholder { color: #4a5568; opacity: 1; }
        #search-input::placeholder { color: #4a5568; }
        select option { color: #4a5568; }
        select option:first-child { color: #718096; }
      `}</style>

{/* Header */}
       <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
         <div>
           <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#111827', margin: 0 }}>Quản Lý Sản Phẩm</h1>
           <p style={{ color: '#6b7280', margin: '0.35rem 0 0' }}>WMS Warehouse Management System — Module Sản phẩm</p>
         </div>
         <div style={{ padding: '0.4rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', background: admin ? '#ede9fe' : '#dbeafe', color: admin ? '#7c3aed' : '#2563eb', border: `1px solid ${admin ? '#c4b5fd' : '#93c5fd'}` }}>
           {admin ? '👑 Quản trị viên' : '👁 Nhân viên (Chỉ xem)'}
         </div>
       </div>

{/* Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '1.25rem 1.5rem', background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {admin
            ? [
                { label: '+ Thêm SP',   bg: '#10b981', action: () => setShowAdd(true) },
                { label: '+ Nhập hàng', bg: '#059669', action: () => setShowInbound(true) },
                { label: '+ Đơn bán', bg: '#2563eb', action: () => setShowSale(true) },
              ].map(({ label, bg, action }) => (
                <button key={label} onClick={action} style={{ padding: '0.7rem 1.25rem', fontSize: '0.95rem', fontWeight: '600', background: bg, borderRadius: '8px', border: 'none', color: 'white', cursor: 'pointer' }}>{label}</button>
              ))
            : <span style={{ color: '#6b7280', fontSize: '0.9rem', fontStyle: 'italic' }}>Liên hệ admin để thêm hoặc chỉnh sửa sản phẩm</span>
          }
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }} style={{ padding: '0.65rem 0.75rem', border: '2px solid #d1d5db', borderRadius: '8px', background: 'white', color: '#111827', cursor: 'pointer', minWidth: '140px' }}>
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS_MAP).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
          </select>
          <select value={sortOrder} onChange={e => { setSortOrder(e.target.value); setPagination(p => ({ ...p, page: 1 })); }} style={{ padding: '0.65rem 0.75rem', border: '2px solid #d1d5db', borderRadius: '8px', background: 'white', color: '#111827', cursor: 'pointer', minWidth: '160px' }}>
            <option value="stock_asc">Tồn kho: Ít → Nhiều</option>
            <option value="stock_desc">Tồn kho: Nhiều → Ít</option>
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
          </select>
          <input type="text" placeholder="🔍 Tìm kiếm sản phẩm..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ padding: '0.65rem 0.75rem', border: '2px solid #d1d5db', borderRadius: '8px', minWidth: '240px', outline: 'none', background: 'white', color: '#111827' }} id="search-input" />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
           <thead style={{ background: '#f3f4f6' }}>
             <tr>
               {['Mã / Tên Sản Phẩm', 'Danh mục', ...(admin ? ['Giá vốn'] : []), 'Giá bán', 'Tồn kho', 'Trạng thái', 'Hành động'].map(h => (
                 <th key={h} style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb', whiteSpace: 'nowrap' }}>{h}</th>
               ))}
             </tr>
           </thead>
           <tbody>
             {loading ? (
               <tr><td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Đang tải...</td></tr>
             ) : error ? (
               <tr><td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: '#dc2626' }}>{error}</td></tr>
) : products.length === 0 ? (
                <tr><td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Chưa có sản phẩm nào</td></tr>
              ) : products.map(product => {
                const totalStock = product.stocks?.reduce((s, x) => s + (x.quantity_on_hand || 0), 0) || 0;
                const pid = product._id || product.product_id;
                return (
                  <tr key={pid} style={{ borderBottom: '1px solid #f0f0f0', transition: 'background 0.15s' }}
                    onMouseOver={e => e.currentTarget.style.background = '#f7fafc'}
                    onMouseOut={e => e.currentTarget.style.background = 'white'}
                  >
                   <td style={{ padding: '0.875rem 1rem' }}>
                     <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.9rem' }}>{product.product_code || product.sku}</div>
                     <div style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '0.15rem' }}>{product.product_name}</div>
                     {product.barcode && <div style={{ color: '#6b7280', fontSize: '0.75rem', fontFamily: 'monospace' }}>{product.barcode}</div>}
                   </td>
                   <td style={{ padding: '0.875rem 1rem', color: '#6b7280', fontSize: '0.9rem' }}>{product.category_id ? (product.category_id.parent_id?.name ? `${product.category_id.parent_id.name} (${product.category_id.name})` : product.category_id.name) : '—'}</td>
                   {admin && <td style={{ padding: '0.875rem 1rem', color: '#6b7280', fontSize: '0.9rem' }}>{formatCurrency(product.prices?.[0]?.cost_price)}</td>}
                   <td style={{ padding: '0.875rem 1rem', color: '#6b7280', fontSize: '0.9rem' }}>{formatCurrency(product.prices?.[0]?.selling_price || product.prices?.[0]?.wholesale_price)}</td>
                   <td style={{ padding: '0.875rem 1rem' }}>
                     <span style={{ fontWeight: '700', color: totalStock > 0 ? '#059669' : '#dc2626', fontSize: '1rem' }}>{totalStock}</span>
                   </td>
                   <td style={{ padding: '0.875rem 1rem' }}><StatusBadge status={product.status} /></td>
                   <td style={{ padding: '0.875rem 1rem' }}>
                     <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                       <ActionBtn color="#2563eb" onClick={() => handleViewDetail(product)}>Chi tiết</ActionBtn>
                       <ActionBtn color="#f59e0b" onClick={() => admin && setEditProduct(product)} disabled={!admin} title={!admin ? 'Chỉ admin' : 'Sửa'}>Sửa</ActionBtn>
                       <ActionBtn color={product.status === 'active' ? '#f59e0b' : '#10b981'} onClick={() => handleToggleStatus(product)} disabled={!admin} title={!admin ? 'Chỉ admin' : product.status === 'active' ? 'Ngừng bán' : 'Kích hoạt'}>
                         {product.status === 'active' ? '⏸' : '▶'}
                       </ActionBtn>
                       <ActionBtn color="#10b981" onClick={() => admin && setStockFlow({ product, type: 'inbound' })} disabled={!admin} title={!admin ? 'Chỉ admin' : 'Nhập kho'}>Nhập</ActionBtn>
                       <ActionBtn color="#ef4444" onClick={() => admin && setStockFlow({ product, type: 'outbound' })} disabled={!admin} title={!admin ? 'Chỉ admin' : 'Xuất kho'}>Xuất</ActionBtn>
                       <ActionBtn color="#dc2626" onClick={() => handleDelete(pid)} disabled={!admin} title={!admin ? 'Chỉ admin' : 'Xóa'}>Xóa</ActionBtn>
                     </div>
                   </td>
                 </tr>
               );
             })}
</tbody>
          </table>
        </div>

        {/* Pagination */}
        {(() => {
          const { page, pages, total } = pagination;
          if (!pages) return null;
          const getPageNums = () => {
            const nums = new Set([1, pages]);
            for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) nums.add(i);
            return [...nums].sort((a, b) => a - b);
          };
          const pageNums = getPageNums();
          const btnBase = { height: '36px', minWidth: '36px', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' };
          const goTo = (p) => setPagination(prev => ({ ...prev, page: p }));
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 1.5rem', borderTop: '1px solid #f0f0f0', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <button onClick={() => goTo(page - 1)} disabled={page === 1}
                  style={{ ...btnBase, padding: '0 0.875rem', opacity: page === 1 ? 0.35 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer', color: '#111827' }}
                  onMouseEnter={e => { if (page !== 1) e.currentTarget.style.background = '#f0f4ff'; }}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                  ← Trước
                </button>
                {pageNums.map((num, i) => {
                  const prev = pageNums[i - 1];
                  const isActive = num === page;
                  return (
                    <div key={num} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {prev && num - prev > 1 && <span style={{ color: '#a0aec0', padding: '0 0.2rem' }}>…</span>}
                      <button onClick={() => goTo(num)}
                        style={{ ...btnBase, background: isActive ? '#6366f1' : 'white', color: isActive ? 'white' : '#374151', borderColor: isActive ? '#6366f1' : '#e2e8f0' }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f0f4ff'; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'white'; }}>
                        {num}
                      </button>
                    </div>
                  );
                })}
                <button onClick={() => goTo(page + 1)} disabled={page === pages}
                  style={{ ...btnBase, padding: '0 0.875rem', opacity: page === pages ? 0.35 : 1, cursor: page === pages ? 'not-allowed' : 'pointer', color: '#111827' }}
                  onMouseEnter={e => { if (page !== pages) e.currentTarget.style.background = '#f0f4ff'; }}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                  Sau →
                </button>
              </div>
              <span style={{ fontSize: '0.82rem', color: '#718096' }}>
                Trang <b>{page}</b>/{pages} · <b>{total}</b> sản phẩm
              </span>
            </div>
          );
        })()}

{/* Modals */}
        {showAdd      && admin         && <AddProductModal  onClose={() => setShowAdd(false)}       onDone={fetchProducts} />}
        {showInbound  && admin         && <InboundModal onClose={() => setShowInbound(false)} onDone={fetchProducts} />}
        {showSale && admin && <SaleModal onClose={() => setShowSale(false)} onDone={fetchProducts} />}
        {editProduct  && admin         && <EditProductModal product={editProduct} onClose={() => setEditProduct(null)} onDone={fetchProducts} />}
        {stockFlow    && admin         && <StockModal product={stockFlow.product} type={stockFlow.type} onClose={() => setStockFlow(null)} onDone={fetchProducts} />}
        {detailProduct                 && <DetailModal product={detailProduct} user={user} onClose={() => setDetailProduct(null)} onUpdate={handleUpdate} />}
    </div>
  );
};
export default Products;