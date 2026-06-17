import { useState, useEffect, useCallback } from 'react';
import { categoryApi, productApi } from '../services/productService';

const formatCurrency = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

const inputStyle = {
  width: '100%', padding: '0.65rem 0.75rem', border: '1.5px solid #e2e8f0',
  borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box',
  outline: 'none', color: '#1a202c', background: 'white',
};

// Helper lấy stock và giá từ product đúng chuẩn API
const getProductStock = (p) =>
  Array.isArray(p.stocks)
    ? p.stocks.reduce((a, b) => a + (b.quantity_on_hand || 0), 0)
    : (p.totalStock || 0);

const getProductCost = (p) =>
  p.prices?.[0]?.cost_price ?? p.cost_price ?? 0;

const Modal = ({ onClose, children, maxWidth = '480px' }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
    onClick={e => e.target === e.currentTarget && onClose()}>
    <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
      {children}
    </div>
  </div>
);

const CategoryFormModal = ({ onClose, onDone, editing, categories, parentId = null }) => {
  const [form, setForm] = useState({
    name: editing?.name || '',
    category_code: editing?.category_code || '',
    description: editing?.description || '',
    status: editing?.status || 'active',
    parent_id: editing?.parent_id || parentId || '',
  });
  const [saving, setSaving] = useState(false);
  const parentCats = categories.filter(c => !c.parent_id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        parent_id: form.parent_id || null,
        category_code: form.category_code || form.name.toUpperCase().replace(/\s+/g, '_').slice(0, 10),
      };
      if (editing) {
        await categoryApi.update(editing._id, payload);
      } else {
        await categoryApi.create(payload);
      }
      onDone();
      onClose();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div style={{ padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: '#1a202c' }}>
            {editing ? '✏️ Sửa danh mục' : form.parent_id ? '➕ Thêm danh mục con' : '➕ Thêm danh mục'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#718096' }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#2d3748' }}>Danh mục cha</label>
            <select value={form.parent_id} onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))} style={{ ...inputStyle }}>
              <option value="">-- Danh mục gốc --</option>
              {parentCats.filter(c => c._id !== editing?._id).map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#2d3748' }}>Tên danh mục *</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required autoFocus placeholder="VD: iPhone, Samsung..." style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#2d3748' }}>Mã danh mục</label>
            <input type="text" value={form.category_code} onChange={e => setForm(f => ({ ...f, category_code: e.target.value.toUpperCase() }))}
              placeholder="VD: IPHONE, SAMSUNG..." style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#2d3748' }}>Mô tả</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Mô tả danh mục..." rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#2d3748' }}>Trạng thái</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inputStyle}>
              <option value="active">Hoạt động</option>
              <option value="inactive">Tạm dừng</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" disabled={saving}
              style={{ flex: 1, padding: '0.75rem', background: saving ? '#a0aec0' : 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Thêm'}
            </button>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '0.75rem', background: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
              Hủy
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

const ProductsModal = ({ category, products, onClose }) => {
  const prods = products.filter(p => (p.category_id?._id || p.category_id)?.toString() === category._id?.toString());
  return (
    <Modal onClose={onClose} maxWidth="800px">
      <div style={{ padding: '1.5rem 2rem', background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: '16px 16px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, color: 'white', fontWeight: '700' }}>{category.name}</h2>
          <p style={{ margin: '0.2rem 0 0', color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>{prods.length} sản phẩm</p>
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
      </div>
      <div style={{ overflowY: 'auto', maxHeight: '60vh' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f7fafc', position: 'sticky', top: 0 }}>
            <tr>
              {['Mã/Tên', 'Giá vốn', 'Giá bán', 'Tồn kho', 'Trạng thái'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', color: '#4a5568', fontSize: '0.8rem', borderBottom: '2px solid #e2e8f0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {prods.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#718096' }}>Không có sản phẩm nào</td></tr>
            ) : prods.map((p, i) => {
              const qty  = getProductStock(p);
              const cost = getProductCost(p);
              const sell = p.prices?.[0]?.selling_price ?? p.selling_price ?? 0;
              return (
                <tr key={p._id || i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#1a202c' }}>{p.product_code}</div>
                    <div style={{ fontSize: '0.8rem', color: '#718096' }}>{p.product_name}</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#4a5568' }}>{formatCurrency(cost)}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#4a5568' }}>{formatCurrency(sell)}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: qty === 0 ? '#e53e3e' : qty < 10 ? '#d69e2e' : '#38a169' }}>{qty}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600', background: p.status === 'active' ? '#c6f6d5' : '#e2e8f0', color: p.status === 'active' ? '#22543d' : '#4a5568' }}>
                      {p.status === 'active' ? 'Đang bán' : p.status === 'out_of_stock' ? 'Hết hàng' : 'Ngừng bán'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Modal>
  );
};

const CategoryNode = ({ cat, children, products, allCategories, depth, onEdit, onAddChild, onDelete, onToggleStatus, onViewProducts }) => {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = children.length > 0;
  const isActive = cat.is_active === true || cat.status === 'active';

  const getAllDescendantIds = (catId) => {
    const kids = allCategories.filter(c => (c.parent_id?._id || c.parent_id)?.toString() === catId?.toString());
    return [catId, ...kids.flatMap(c => getAllDescendantIds(c._id?.toString()))];
  };
  const catIds = getAllDescendantIds(cat._id?.toString());
  const catProds = products.filter(p => catIds.includes((p.category_id?._id || p.category_id)?.toString()));

  const prodCount  = catProds.length;
  const totalStock = catProds.reduce((s, p) => s + getProductStock(p), 0);
  const totalValue = catProds.reduce((s, p) => s + getProductStock(p) * getProductCost(p), 0);

  const indent = depth * 24;

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', padding: '0.75rem 1rem',
        borderBottom: '1px solid #f0f0f0', gap: '0.75rem',
        background: depth === 0 ? 'white' : '#fafbff',
      }}
        onMouseEnter={e => e.currentTarget.style.background = depth === 0 ? '#f7f9ff' : '#f0f4ff'}
        onMouseLeave={e => e.currentTarget.style.background = depth === 0 ? 'white' : '#fafbff'}
      >
        <div style={{ width: indent, flexShrink: 0 }} />
        <div style={{ flex: 2, minWidth: 0 }}>
          <div onClick={() => hasChildren && setExpanded(e => !e)}
            style={{ fontWeight: depth === 0 ? '700' : '600', color: '#1a202c', fontSize: depth === 0 ? '0.95rem' : '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: hasChildren ? 'pointer' : 'default' }}>
            {hasChildren ? (
              <span style={{ fontSize: '0.7rem', color: '#667eea', display: 'inline-block', transition: 'transform 0.2s', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
            ) : (
              <span style={{ fontSize: '0.7rem', color: '#cbd5e0' }}>—</span>
            )}
            {depth === 0 ? '📁' : '📄'} {cat.name}
            {!isActive && <span style={{ fontSize: '0.7rem', background: '#ffebee', color: '#c53030', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Tạm dừng</span>}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#a0aec0', fontFamily: 'monospace', marginLeft: '1.2rem' }}>{cat.category_code || '—'}</div>
        </div>
        <div style={{ flex: 1 }}>
          <button onClick={() => prodCount > 0 && onViewProducts(cat)}
            style={{ background: prodCount > 0 ? '#ebf8ff' : '#f7fafc', color: prodCount > 0 ? '#2b6cb0' : '#a0aec0', border: 'none', borderRadius: '20px', padding: '0.2rem 0.6rem', fontWeight: '600', fontSize: '0.8rem', cursor: prodCount > 0 ? 'pointer' : 'default' }}>
            {prodCount} SP
          </button>
        </div>
        <div style={{ flex: 1, fontSize: '0.82rem', fontWeight: '600', color: totalStock > 0 ? '#38a169' : '#a0aec0' }}>{totalStock.toLocaleString()}</div>
        <div style={{ flex: 1, fontSize: '0.82rem', fontWeight: '600', color: totalValue > 0 ? '#553c9a' : '#a0aec0' }}>{formatCurrency(totalValue)}</div>
        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
          {depth === 0 && (
            <button onClick={() => onAddChild(cat)}
              style={{ padding: '0.3rem 0.6rem', border: '1.5px solid #48bb78', borderRadius: '6px', background: 'white', color: '#48bb78', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}>
              + Con
            </button>
          )}
          <button onClick={() => onEdit(cat)} style={{ padding: '0.3rem 0.6rem', border: '1.5px solid #4299e1', borderRadius: '6px', background: 'white', color: '#4299e1', cursor: 'pointer', fontSize: '0.75rem' }}>Sửa</button>
          <button onClick={() => onToggleStatus(cat)} style={{ padding: '0.3rem 0.6rem', border: `1.5px solid ${isActive ? '#ed8936' : '#48bb78'}`, borderRadius: '6px', background: 'white', color: isActive ? '#ed8936' : '#48bb78', cursor: 'pointer', fontSize: '0.75rem' }}>
            {isActive ? 'Dừng' : 'Bật'}
          </button>
          <button onClick={() => onDelete(cat)} style={{ padding: '0.3rem 0.6rem', border: '1.5px solid #fc8181', borderRadius: '6px', background: 'white', color: '#e53e3e', cursor: 'pointer', fontSize: '0.75rem' }}>Xóa</button>
        </div>
      </div>
      {expanded && hasChildren && children.map(child => (
        <CategoryNode key={child._id} cat={child}
          children={allCategories.filter(c => (c.parent_id?._id || c.parent_id)?.toString() === child._id?.toString())}
          products={products} allCategories={allCategories} depth={depth + 1}
          onEdit={onEdit} onAddChild={onAddChild} onDelete={onDelete}
          onToggleStatus={onToggleStatus} onViewProducts={onViewProducts}
        />
      ))}
    </div>
  );
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm]     = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [addChildOf, setAddChildOf] = useState(null);
  const [viewProdsCat, setViewProdsCat] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        categoryApi.getAll(),
        productApi.getAll({ limit: 500 }),
      ]);
      const catList = catRes?.data?.data ?? catRes?.data ?? catRes ?? [];
      setCategories(Array.isArray(catList) ? catList : []);
      const prodList = prodRes?.data?.data ?? prodRes?.data ?? [];
      setProducts(Array.isArray(prodList) ? prodList : []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleEdit     = (cat) => { setEditingCat(cat); setAddChildOf(null); setShowForm(true); };
  const handleAddChild = (cat) => { setEditingCat(null); setAddChildOf(cat); setShowForm(true); };
  const handleAddRoot  = ()    => { setEditingCat(null); setAddChildOf(null); setShowForm(true); };

  const handleDelete = async (cat) => {
    const prodCount  = products.filter(p => (p.category_id?._id || p.category_id)?.toString() === cat._id?.toString()).length;
    const childCount = categories.filter(c => (c.parent_id?._id || c.parent_id)?.toString() === cat._id?.toString()).length;
    if (prodCount  > 0) return alert(`Không thể xóa! "${cat.name}" đang có ${prodCount} sản phẩm.`);
    if (childCount > 0) return alert(`Không thể xóa! "${cat.name}" đang có ${childCount} danh mục con.`);
    if (!window.confirm(`Xóa danh mục "${cat.name}"?`)) return;
    try { await categoryApi.delete(cat._id); fetchData(); }
    catch (err) { alert('Lỗi: ' + err.message); }
  };

  const handleToggleStatus = async (cat) => {
    const isActive = cat.is_active === true || cat.status === 'active';
    try {
      await categoryApi.update(cat._id, { status: isActive ? 'inactive' : 'active', is_active: !isActive });
      fetchData();
    } catch (err) { alert('Lỗi: ' + err.message); }
  };

  const rootCats = categories.filter(c => !c.parent_id);
  const filteredRoots = searchQuery
    ? categories.filter(c => (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (c.category_code || '').toLowerCase().includes(searchQuery.toLowerCase()))
    : rootCats;

  return (
    <div style={{ padding: '1.5rem', background: '#f7f9fc', minHeight: '100vh' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '700', color: '#1a202c' }}>Quản Lý Danh Mục</h1>
        <p style={{ margin: '0.25rem 0 0', color: '#718096', fontSize: '0.9rem' }}>WMS Warehouse Management System - Module Danh Mục</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {[
          { label: 'Tổng danh mục', value: categories.length, color: '#667eea' },
          { label: 'Danh mục gốc', value: rootCats.length, color: '#48bb78' },
          { label: 'Danh mục con', value: categories.length - rootCats.length, color: '#ed8936' },
          { label: 'Tổng sản phẩm', value: products.length, color: '#4299e1' },
        ].map(s => (
          <div key={s.label} style={{ flex: '1', minWidth: '160px', background: 'white', borderRadius: '12px', padding: '1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderLeft: `4px solid ${s.color}` }}>
            <div style={{ fontSize: '0.8rem', color: '#718096', marginBottom: '0.3rem' }}>{s.label}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#1a202c' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '1rem 1.5rem', marginBottom: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={handleAddRoot}
          style={{ padding: '0.65rem 1.25rem', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}>
          + Thêm danh mục gốc
        </button>
        <input type="text" placeholder="🔍 Tìm kiếm danh mục..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          style={{ ...inputStyle, maxWidth: '300px', flex: 1 }} />
      </div>

      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', background: 'linear-gradient(135deg, #667eea, #764ba2)', gap: '0.75rem' }}>
          <div style={{ flex: 2, color: 'white', fontWeight: '700', fontSize: '0.85rem' }}>Tên / Mã</div>
          <div style={{ flex: 1, color: 'white', fontWeight: '700', fontSize: '0.85rem' }}>Số SP</div>
          <div style={{ flex: 1, color: 'white', fontWeight: '700', fontSize: '0.85rem' }}>Tồn kho</div>
          <div style={{ flex: 1, color: 'white', fontWeight: '700', fontSize: '0.85rem' }}>Giá trị</div>
          <div style={{ flexShrink: 0, color: 'white', fontWeight: '700', fontSize: '0.85rem', minWidth: '200px' }}>Hành động</div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#718096' }}>⏳ Đang tải...</div>
        ) : filteredRoots.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#718096' }}>📂 Không có danh mục nào</div>
        ) : filteredRoots.map(cat => (
          <CategoryNode key={cat._id} cat={cat}
            children={categories.filter(c => (c.parent_id?._id || c.parent_id)?.toString() === cat._id?.toString())}
            products={products} allCategories={categories} depth={0}
            onEdit={handleEdit} onAddChild={handleAddChild}
            onDelete={handleDelete} onToggleStatus={handleToggleStatus}
            onViewProducts={setViewProdsCat}
          />
        ))}

        <div style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid #f0f0f0', color: '#718096', fontSize: '0.85rem' }}>
          {categories.length} danh mục · {rootCats.length} gốc · {categories.length - rootCats.length} con
        </div>
      </div>

      {showForm && (
        <CategoryFormModal
          onClose={() => { setShowForm(false); setEditingCat(null); setAddChildOf(null); }}
          onDone={fetchData}
          editing={editingCat}
          categories={categories}
          parentId={addChildOf?._id || null}
        />
      )}

      {viewProdsCat && (
        <ProductsModal category={viewProdsCat} products={products} onClose={() => setViewProdsCat(null)} />
      )}
    </div>
  );
};

export default Categories;