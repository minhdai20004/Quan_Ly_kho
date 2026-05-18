import { useState, useEffect, useRef, useCallback } from 'react';
import { supplierApi } from '../services/productService';

const EMPTY_FORM = {
  name: '',
  contact: { name: '', phone: '', email: '' },
  address: { street: '', ward: '', district: '', city: '', country: 'Vietnam' },
  business: { tax_id: '', business_type: 'other' },
  supplier_type: 'distributor',
  payment_terms: 'Net30',
  is_active: true,
};

const inputStyle = {
  width: '100%', padding: '0.6rem 0.875rem',
  border: '2px solid #e2e8f0', borderRadius: '8px',
  fontSize: '0.9rem', boxSizing: 'border-box',
  background: 'white', color: '#1a202c', outline: 'none',
  transition: 'border-color 0.15s',
};

const Suppliers = () => {
  const [suppliers, setSuppliers]     = useState([]);
  const [loading, setLoading]         = useState(false);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [editing, setEditing]         = useState(null);
  const [showModal, setShowModal]     = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder]     = useState('newest');

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await supplierApi.getAll();
      setSuppliers(res.data || []);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSuppliers(); }, [loadSuppliers]);

  const filtered = suppliers
    .filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.contact?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.contact?.phone || '').includes(searchQuery)
    )
    .sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sortOrder === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (sortOrder === 'a-z')    return a.name.localeCompare(b.name);
      if (sortOrder === 'z-a')    return b.name.localeCompare(a.name);
      return 0;
    });

  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setForm(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
    } else {
      setForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, address: { ...form.address }, business: { ...form.business } };
      if (!payload.address.district) payload.address.district = '-';
      if (!payload.address.city)     payload.address.city     = '-';
      const validTypes = ['tndn','cnhd','ctycp','dtcp','foreign','other'];
      if (!validTypes.includes(payload.business.business_type?.toLowerCase())) {
        payload.business.business_type = 'other';
      } else {
        payload.business.business_type = payload.business.business_type.toLowerCase();
      }
      if (editing) {
        await supplierApi.update(editing.supplier_id || editing._id, payload);
      } else {
        const newId = `SUP-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
        payload.supplier_id = newId;
        payload.code = newId;
        await supplierApi.create(payload);
      }
      setShowModal(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      await loadSuppliers();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (s) => {
    setForm({
      name: s.name,
      contact: s.contact || { name: '', phone: '', email: '' },
      address: {
        street: s.address ? [s.address.street, s.address.district, s.address.city].filter(v => v && v !== '-').join(', ') : '',
        ward: '', district: '', city: '', country: 'Vietnam',
      },
      business: s.business || { tax_id: '', business_type: 'other' },
      supplier_type: s.supplier_type || 'distributor',
      payment_terms: (s.payment_terms || 'Net30').replace(' ', ''),
      is_active: s.is_active !== undefined ? s.is_active : true,
    });
    setEditing(s);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa nhà cung cấp này?')) return;
    setLoading(true);
    try {
      await supplierApi.delete(id);
      await loadSuppliers();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => { setShowModal(false); setEditing(null); setForm(EMPTY_FORM); };

  const getInitials = (name) => name?.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() || '?';
  const avatarColors = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];
  const getColor = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

  return (
    <div style={{ padding: '1.5rem', background: '#f7f9fc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '700', color: '#1a202c' }}>Quản Lý Nhà Cung Cấp</h1>
        <p style={{ margin: '0.25rem 0 0', color: '#718096', fontSize: '0.9rem' }}>WMS Warehouse Management System — Nhà cung cấp</p>
      </div>

      {/* Toolbar */}
      <div style={{
        background: 'white', borderRadius: '14px', padding: '1rem 1.25rem',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: '1.25rem',
        display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={() => { setShowModal(true); setEditing(null); setForm(EMPTY_FORM); }}
            style={{
              padding: '0.6rem 1.25rem', background: 'linear-gradient(135deg, #4ade80, #16a34a)',
              color: 'white', border: 'none', borderRadius: '9px', fontWeight: '700',
              fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}
          >+ Thêm NCC</button>
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            style={{
              padding: '0.6rem 0.875rem', border: '2px solid #e2e8f0', borderRadius: '9px',
              fontSize: '0.875rem', background: 'white', color: '#4a5568', cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="a-z">A → Z</option>
            <option value="z-a">Z → A</option>
          </select>
        </div>

        <div style={{ position: 'relative', flex: 1, maxWidth: '360px', minWidth: '200px' }}>
          <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#a0aec0' }}>🔍</span>
          <input
            type="text"
            placeholder="Tìm kiếm NCC..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ ...inputStyle, paddingLeft: '2.1rem', border: '2px solid #e2e8f0' }}
            onFocus={e => e.target.style.borderColor = '#6366f1'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: '700', color: '#1a202c', fontSize: '0.95rem' }}>
            🚚 Danh sách ({filtered.length})
          </span>
          <span style={{ fontSize: '0.82rem', color: '#a0aec0' }}>Tổng {suppliers.length} nhà cung cấp</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#718096' }}>⏳ Đang tải...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f7fafc' }}>
                  {['Tên NCC', 'Người liên hệ', 'Số điện thoại', 'Địa chỉ', 'Mã số thuế', 'Hành động'].map(h => (
                    <th key={h} style={{
                      padding: '0.75rem 1rem', textAlign: 'left',
                      fontSize: '0.75rem', fontWeight: '700', color: '#718096',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s._id}
                    style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? 'white' : '#fafafa', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#fafafa'}
                  >
                    {/* Tên NCC */}
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div style={{
                          width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
                          background: getColor(s.name),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: '700', fontSize: '0.78rem',
                        }}>{getInitials(s.name)}</div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#1a202c', fontSize: '0.9rem' }}>{s.name}</div>
                          {s.short_name && <div style={{ fontSize: '0.75rem', color: '#a0aec0' }}>{s.short_name}</div>}
                        </div>
                      </div>
                    </td>
                    {/* Liên hệ */}
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ fontSize: '0.88rem', color: '#2d3748', fontWeight: '500' }}>{s.contact?.name || '—'}</div>
                      {s.contact?.email && <div style={{ fontSize: '0.75rem', color: '#a0aec0' }}>{s.contact.email}</div>}
                    </td>
                    {/* SĐT */}
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.88rem', color: '#4a5568' }}>
                      {s.contact?.phone || '—'}
                    </td>
                    {/* Địa chỉ */}
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.85rem', color: '#718096', maxWidth: '200px' }}>
                      {s.address
                        ? [s.address.street, s.address.district, s.address.city].filter(v => v && v !== '-').join(', ') || '—'
                        : '—'}
                    </td>
                    {/* MST */}
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.85rem', color: '#4a5568', fontFamily: 'monospace' }}>
                      {s.business?.tax_id || '—'}
                    </td>
                    {/* Actions */}
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleEdit(s)} style={{
                          padding: '0.4rem 0.875rem', border: '1.5px solid #6366f1', borderRadius: '7px',
                          background: 'white', color: '#6366f1', cursor: 'pointer',
                          fontSize: '0.82rem', fontWeight: '600', transition: 'all 0.15s',
                        }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#6366f1'; e.currentTarget.style.color = 'white'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#6366f1'; }}
                        >Sửa</button>
                        <button onClick={() => handleDelete(s.supplier_id || s._id)} style={{
                          padding: '0.4rem 0.875rem', border: '1.5px solid #fc8181', borderRadius: '7px',
                          background: 'white', color: '#e53e3e', cursor: 'pointer',
                          fontSize: '0.82rem', fontWeight: '600', transition: 'all 0.15s',
                        }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fff5f5'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
                        >Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#718096' }}>
                {suppliers.length === 0 ? 'Chưa có nhà cung cấp nào' : 'Không tìm thấy NCC phù hợp'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal thêm/sửa */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', width: '100%', maxWidth: '500px',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          }}>
            {/* Modal header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: '#1a202c' }}>
                {editing ? '✏️ Cập nhật NCC' : '🚚 Thêm NCC mới'}
              </h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#a0aec0', lineHeight: 1 }}>×</button>
            </div>

            {/* Modal body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
              <form onSubmit={handleSubmit} id="supplier-form" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#4a5568', marginBottom: '0.35rem' }}>Tên nhà cung cấp *</label>
                  <input type="text" placeholder="Nhập tên NCC..." value={form.name}
                    onChange={e => handleChange('name', e.target.value)} required autoFocus style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#4a5568', marginBottom: '0.35rem' }}>Người liên hệ</label>
                    <input type="text" placeholder="Họ tên..." value={form.contact.name}
                      onChange={e => handleChange('contact.name', e.target.value)} style={inputStyle}
                      onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#4a5568', marginBottom: '0.35rem' }}>Số điện thoại</label>
                    <input type="text" placeholder="0xxx..." value={form.contact.phone}
                      onChange={e => handleChange('contact.phone', e.target.value)} style={inputStyle}
                      onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#4a5568', marginBottom: '0.35rem' }}>Email</label>
                  <input type="email" placeholder="email@company.com" value={form.contact.email}
                    onChange={e => handleChange('contact.email', e.target.value)} style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#4a5568', marginBottom: '0.35rem' }}>Mã số thuế *</label>
                  <input type="text" placeholder="0123456789" value={form.business.tax_id}
                    onChange={e => handleChange('business.tax_id', e.target.value)} required style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#4a5568', marginBottom: '0.35rem' }}>Địa chỉ</label>
                  <input type="text" placeholder="Số nhà, đường, quận, thành phố..." value={form.address.street}
                    onChange={e => handleChange('address.street', e.target.value)} style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                </div>

              </form>
            </div>

            {/* Modal footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.75rem' }}>
              <button type="submit" form="supplier-form" disabled={loading} style={{
                flex: 1, padding: '0.7rem', background: loading ? '#a0aec0' : 'linear-gradient(135deg, #4ade80, #16a34a)',
                color: 'white', border: 'none', borderRadius: '9px',
                fontWeight: '700', fontSize: '0.9rem', cursor: loading ? 'not-allowed' : 'pointer',
              }}>
                {loading ? 'Đang lưu...' : editing ? '💾 Cập nhật' : '➕ Thêm NCC'}
              </button>
              <button type="button" onClick={closeModal} style={{
                flex: 1, padding: '0.7rem', background: '#f7fafc',
                color: '#4a5568', border: '2px solid #e2e8f0', borderRadius: '9px',
                fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer',
              }}>Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;