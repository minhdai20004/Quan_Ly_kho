import { useState, useEffect, useCallback, useRef } from 'react';
import { supplierApi } from '../services/productService';

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */
const EMPTY_FORM = {
  name: '',
  short_name: '',
  supplier_type: 'distributor',
  status: 'active',
  payment_terms: 'Net30',
  payment_method: 'bank_transfer',
  rating: 3,
  contact: { name: '', position: '', phone: '', mobile: '', email: '', zalo: '' },
  address: { street: '', ward: '', district: '', city: '', country: 'Vietnam' },
  business: { tax_id: '', business_type: 'tndn', website: '', notes: '' },
};

const SUPPLIER_TYPE_LABELS = {
  manufacturer: { label: 'Nhà SX', color: '#7c3aed', bg: '#ede9fe' },
  distributor:  { label: 'Phân phối', color: '#0369a1', bg: '#e0f2fe' },
  agent:        { label: 'Đại lý', color: '#0f766e', bg: '#ccfbf1' },
  importer:     { label: 'Nhập khẩu', color: '#b45309', bg: '#fef3c7' },
  trader:       { label: 'Thương mại', color: '#9333ea', bg: '#f3e8ff' },
  service:      { label: 'Dịch vụ', color: '#374151', bg: '#f3f4f6' },
};

const STATUS_LABELS = {
  active:      { label: 'Hoạt động', color: '#15803d', bg: '#dcfce7' },
  inactive:    { label: 'Không HĐ', color: '#6b7280', bg: '#f3f4f6' },
  pending:     { label: 'Chờ duyệt', color: '#d97706', bg: '#fef3c7' },
  blacklisted: { label: 'Cấm', color: '#dc2626', bg: '#fee2e2' },
};

const BIZ_TYPES = [
  { value: 'tndn', label: 'TNHH / DN tư nhân' },
  { value: 'cnhd', label: 'Cá nhân hộ DK' },
  { value: 'ctycp', label: 'Công ty Cổ phần' },
  { value: 'dtcp', label: 'ĐT nước ngoài' },
  { value: 'foreign', label: 'Công ty nước ngoài' },
  { value: 'other', label: 'Khác' },
];

const PAYMENT_TERMS = ['COD', 'Cash', 'Net7', 'Net15', 'Net30', 'Net45', 'Net60'];

const avatarColors = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'];
const getAvatarColor = (name = '') => avatarColors[(name.charCodeAt(0) || 0) % avatarColors.length];
const getInitials = (name = '') => name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() || '?';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
const fmtCurrency = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

/* ─────────────────────────────────────────
   STAR RATING
───────────────────────────────────────── */
const StarRating = ({ value = 0, onChange, readonly = false }) => (
  <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
    {[1, 2, 3, 4, 5].map(i => (
      <span key={i}
        onClick={() => !readonly && onChange && onChange(i)}
        style={{
          fontSize: readonly ? '0.85rem' : '1.1rem',
          cursor: readonly ? 'default' : 'pointer',
          color: i <= value ? '#f59e0b' : '#d1d5db',
          transition: 'color 0.15s',
          userSelect: 'none',
        }}
        onMouseEnter={e => { if (!readonly) e.currentTarget.style.color = '#f59e0b'; }}
        onMouseLeave={e => { if (!readonly && i > value) e.currentTarget.style.color = '#d1d5db'; }}
      >★</span>
    ))}
  </div>
);

/* ─────────────────────────────────────────
   STAT CARD
───────────────────────────────────────── */
const StatCard = ({ icon, label, value, color, sub }) => (
  <div style={{
    background: 'white', borderRadius: '16px', padding: '1.25rem 1.5rem',
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center',
    gap: '1rem', flex: 1, minWidth: '160px', border: `2px solid ${color}18`,
    transition: 'transform 0.2s, box-shadow 0.2s',
  }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'; }}
  >
    <div style={{
      width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
      background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '1.4rem',
    }}>{icon}</div>
    <div>
      <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#111827', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.8rem', fontWeight: '600', color: color, marginTop: '2px' }}>{label}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '1px' }}>{sub}</div>}
    </div>
  </div>
);

/* ─────────────────────────────────────────
   SUPPLIER DETAIL DRAWER
───────────────────────────────────────── */
const SupplierDetailDrawer = ({ supplier, onClose, onEdit }) => {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    if (!supplier) return;
    setLoadingProducts(true);
    supplierApi.getProducts(supplier.supplier_id || supplier._id)
      .then(r => setProducts(r.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false));
  }, [supplier]);

  if (!supplier) return null;
  const st = STATUS_LABELS[supplier.status] || STATUS_LABELS.inactive;
  const stype = SUPPLIER_TYPE_LABELS[supplier.supplier_type] || SUPPLIER_TYPE_LABELS.distributor;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 900,
      display: 'flex', alignItems: 'stretch',
    }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        flex: 1, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
      }} />
      {/* Drawer */}
      <div style={{
        width: '420px', background: 'white', boxShadow: '-8px 0 40px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column', overflowY: 'auto',
        animation: 'slideIn 0.25s ease',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: 'white',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                background: 'rgba(255,255,255,0.2)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem', fontWeight: '800', flexShrink: 0,
              }}>{getInitials(supplier.name)}</div>
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: '800' }}>{supplier.name}</div>
                {supplier.short_name && <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>{supplier.short_name}</div>}
                <div style={{ marginTop: '4px', display: 'flex', gap: '6px' }}>
                  <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '20px', background: 'rgba(255,255,255,0.25)', fontWeight: '600' }}>
                    {stype.label}
                  </span>
                  <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '20px', background: 'rgba(255,255,255,0.25)', fontWeight: '600' }}>
                    {st.label}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
              width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer',
              fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>×</button>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: '800' }}>{supplier.total_orders || 0}</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Đơn hàng</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: '800' }}>{products.length}</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Sản phẩm</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: '800' }}>{supplier.rating ? '★'.repeat(supplier.rating) : '—'}</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Đánh giá</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Contact */}
          <Section title="📞 Liên hệ">
            <InfoRow label="Người LH" value={supplier.contact?.name || '—'} />
            <InfoRow label="Chức vụ" value={supplier.contact?.position || '—'} />
            <InfoRow label="Điện thoại" value={supplier.contact?.phone || '—'} />
            <InfoRow label="Di động" value={supplier.contact?.mobile || '—'} />
            <InfoRow label="Email" value={supplier.contact?.email || '—'} />
            <InfoRow label="Zalo" value={supplier.contact?.zalo || '—'} />
          </Section>

          {/* Address */}
          <Section title="📍 Địa chỉ">
            <InfoRow label="Đường" value={supplier.address?.street || '—'} />
            <InfoRow label="Phường/Xã" value={supplier.address?.ward || '—'} />
            <InfoRow label="Quận/Huyện" value={supplier.address?.district || '—'} />
            <InfoRow label="Tỉnh/TP" value={supplier.address?.city || '—'} />
          </Section>

          {/* Business */}
          <Section title="🏢 Doanh nghiệp">
            <InfoRow label="MST" value={supplier.business?.tax_id || '—'} mono />
            <InfoRow label="Loại hình" value={BIZ_TYPES.find(b => b.value === supplier.business?.business_type)?.label || '—'} />
            <InfoRow label="Website" value={supplier.business?.website || '—'} />
          </Section>

          {/* Payment */}
          <Section title="💳 Thanh toán">
            <InfoRow label="Điều khoản" value={supplier.payment_terms || '—'} />
            <InfoRow label="Phương thức" value={supplier.payment_method || '—'} />
          </Section>

          {/* Products */}
          <Section title={`📦 Sản phẩm cung cấp (${products.length})`}>
            {loadingProducts ? (
              <div style={{ textAlign: 'center', padding: '1rem', color: '#9ca3af', fontSize: '0.85rem' }}>Đang tải...</div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1rem', color: '#9ca3af', fontSize: '0.85rem' }}>Chưa có sản phẩm</div>
            ) : products.map((p, i) => (
              <div key={p._id || i} style={{
                padding: '0.625rem 0.75rem', borderRadius: '8px',
                background: i % 2 === 0 ? '#f9fafb' : 'white',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '4px',
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#111827' }}>
                    {p.product_id?.product_name || '—'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontFamily: 'monospace' }}>
                    {p.product_id?.product_code || p.product_id?.sku}
                  </div>
                </div>
                {p.cost_price != null && (
                  <div style={{ fontSize: '0.82rem', color: '#6366f1', fontWeight: '700', flexShrink: 0, marginLeft: '0.5rem' }}>
                    {fmtCurrency(p.cost_price)}
                  </div>
                )}
              </div>
            ))}
          </Section>

          {/* Notes */}
          {supplier.business?.notes && (
            <Section title="📝 Ghi chú">
              <p style={{ fontSize: '0.85rem', color: '#4b5563', margin: 0, lineHeight: 1.6 }}>{supplier.business.notes}</p>
            </Section>
          )}

          {/* Footer info */}
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem' }}>
            Tạo ngày: {fmtDate(supplier.created_at)} · Cập nhật: {fmtDate(supplier.updated_at)}
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => onEdit(supplier)} style={{
            flex: 1, padding: '0.65rem', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '0.875rem',
          }}>✏️ Chỉnh sửa</button>
          <button onClick={onClose} style={{
            flex: 1, padding: '0.65rem', background: '#f9fafb', color: '#6b7280',
            border: '1.5px solid #e5e7eb', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem',
          }}>Đóng</button>
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div>
    <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{title}</div>
    <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '0.5rem 0.75rem' }}>{children}</div>
  </div>
);

const InfoRow = ({ label, value, mono = false }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.3rem 0', borderBottom: '1px solid #f3f4f6' }}>
    <span style={{ fontSize: '0.78rem', color: '#9ca3af', flexShrink: 0, marginRight: '0.75rem' }}>{label}</span>
    <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#111827', textAlign: 'right', fontFamily: mono ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>{value}</span>
  </div>
);

/* ─────────────────────────────────────────
   ADD / EDIT MODAL
───────────────────────────────────────── */
const SupplierModal = ({ form, setForm, editing, loading, onSubmit, onClose }) => {
  const inp = {
    width: '100%', padding: '0.575rem 0.875rem',
    border: '1.5px solid #e5e7eb', borderRadius: '9px',
    fontSize: '0.875rem', boxSizing: 'border-box',
    background: 'white', color: '#111827', outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    fontFamily: 'inherit',
  };
  const sel = { ...inp, cursor: 'pointer' };

  const set = (path, val) => {
    if (path.includes('.')) {
      const [p, c] = path.split('.');
      setForm(prev => ({ ...prev, [p]: { ...prev[p], [c]: val } }));
    } else {
      setForm(prev => ({ ...prev, [path]: val }));
    }
  };

  const onFocus = e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; };
  const onBlur  = e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; };

  const Label = ({ children, required }) => (
    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#374151', marginBottom: '0.3rem' }}>
      {children}{required && <span style={{ color: '#ef4444', marginLeft: '3px' }}>*</span>}
    </label>
  );
  const Group = ({ children, cols = 1 }) => (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '0.75rem' }}>{children}</div>
  );
  const SectionTitle = ({ icon, children }) => (
    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.5rem 0 0.25rem', borderBottom: '2px solid #e0e7ff', marginBottom: '0.75rem' }}>
      {icon} {children}
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '640px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', animation: 'fadeIn 0.2s ease' }}>
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '20px 20px 0 0' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'white' }}>
              {editing ? '✏️ Cập nhật Nhà Cung Cấp' : '➕ Thêm Nhà Cung Cấp Mới'}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)' }}>
              Điền đầy đủ thông tin bên dưới
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <form id="sup-form" onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Thông tin chung */}
            <div>
              <SectionTitle icon="🏪">Thông tin chung</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <Label required>Tên nhà cung cấp</Label>
                  <input style={inp} value={form.name} onChange={e => set('name', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="VD: Công ty TNHH ABC..." required autoFocus />
                </div>
                <Group cols={2}>
                  <div>
                    <Label>Tên viết tắt</Label>
                    <input style={inp} value={form.short_name} onChange={e => set('short_name', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="ABC Corp..." />
                  </div>
                  <div>
                    <Label>Loại nhà cung cấp</Label>
                    <select style={sel} value={form.supplier_type} onChange={e => set('supplier_type', e.target.value)} onFocus={onFocus} onBlur={onBlur}>
                      {Object.entries(SUPPLIER_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Trạng thái</Label>
                    <select style={sel} value={form.status} onChange={e => set('status', e.target.value)} onFocus={onFocus} onBlur={onBlur}>
                      {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Đánh giá</Label>
                    <div style={{ padding: '0.5rem 0' }}>
                      <StarRating value={form.rating} onChange={v => set('rating', v)} />
                    </div>
                  </div>
                </Group>
              </div>
            </div>

            {/* Liên hệ */}
            <div>
              <SectionTitle icon="📞">Thông tin liên hệ</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Group cols={2}>
                  <div>
                    <Label required>Người liên hệ</Label>
                    <input style={inp} value={form.contact.name} onChange={e => set('contact.name', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="Họ và tên..." required />
                  </div>
                  <div>
                    <Label>Chức vụ</Label>
                    <input style={inp} value={form.contact.position} onChange={e => set('contact.position', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="Giám đốc, kế toán..." />
                  </div>
                  <div>
                    <Label required>Số điện thoại</Label>
                    <input style={inp} value={form.contact.phone} onChange={e => set('contact.phone', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="0912 345 678" required />
                  </div>
                  <div>
                    <Label>Di động</Label>
                    <input style={inp} value={form.contact.mobile} onChange={e => set('contact.mobile', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="0909..." />
                  </div>
                </Group>
                <Group cols={2}>
                  <div>
                    <Label required>Email</Label>
                    <input type="email" style={inp} value={form.contact.email} onChange={e => set('contact.email', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="contact@company.vn" required />
                  </div>
                  <div>
                    <Label>Zalo</Label>
                    <input style={inp} value={form.contact.zalo} onChange={e => set('contact.zalo', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="Số Zalo..." />
                  </div>
                </Group>
              </div>
            </div>

            {/* Địa chỉ */}
            <div>
              <SectionTitle icon="📍">Địa chỉ</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <Label required>Số nhà, Đường</Label>
                  <input style={inp} value={form.address.street} onChange={e => set('address.street', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="123 Đường ABC..." required />
                </div>
                <Group cols={3}>
                  <div>
                    <Label>Phường/Xã</Label>
                    <input style={inp} value={form.address.ward} onChange={e => set('address.ward', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="Phường..." />
                  </div>
                  <div>
                    <Label>Quận/Huyện</Label>
                    <input style={inp} value={form.address.district} onChange={e => set('address.district', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="Quận..." />
                  </div>
                  <div>
                    <Label>Tỉnh/Thành phố</Label>
                    <input style={inp} value={form.address.city} onChange={e => set('address.city', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="Hà Nội..." />
                  </div>
                </Group>
              </div>
            </div>

            {/* Doanh nghiệp */}
            <div>
              <SectionTitle icon="🏢">Thông tin doanh nghiệp</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Group cols={2}>
                  <div>
                    <Label required>Mã số thuế (MST)</Label>
                    <input style={{ ...inp, fontFamily: 'monospace' }} value={form.business.tax_id} onChange={e => set('business.tax_id', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="0123456789" required />
                  </div>
                  <div>
                    <Label>Loại hình DN</Label>
                    <select style={sel} value={form.business.business_type} onChange={e => set('business.business_type', e.target.value)} onFocus={onFocus} onBlur={onBlur}>
                      {BIZ_TYPES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                    </select>
                  </div>
                </Group>
                <div>
                  <Label>Website</Label>
                  <input style={inp} value={form.business.website} onChange={e => set('business.website', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="https://company.vn" />
                </div>
              </div>
            </div>

            {/* Thanh toán */}
            <div>
              <SectionTitle icon="💳">Điều khoản thanh toán</SectionTitle>
              <Group cols={2}>
                <div>
                  <Label>Điều khoản</Label>
                  <select style={sel} value={form.payment_terms} onChange={e => set('payment_terms', e.target.value)} onFocus={onFocus} onBlur={onBlur}>
                    {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Phương thức</Label>
                  <select style={sel} value={form.payment_method} onChange={e => set('payment_method', e.target.value)} onFocus={onFocus} onBlur={onBlur}>
                    <option value="bank_transfer">Chuyển khoản</option>
                    <option value="cash">Tiền mặt</option>
                    <option value="check">Séc</option>
                    <option value="credit_card">Thẻ tín dụng</option>
                  </select>
                </div>
              </Group>
            </div>

            {/* Ghi chú */}
            <div>
              <Label>Ghi chú</Label>
              <textarea style={{ ...inp, minHeight: '80px', resize: 'vertical' }} value={form.business.notes} onChange={e => set('business.notes', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="Ghi chú thêm về nhà cung cấp..." />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '0.75rem' }}>
          <button type="submit" form="sup-form" disabled={loading} style={{
            flex: 2, padding: '0.75rem',
            background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white', border: 'none', borderRadius: '12px',
            fontWeight: '700', fontSize: '0.9rem', cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 4px 12px rgba(99,102,241,0.4)',
            transition: 'all 0.2s',
          }}>
            {loading ? '⏳ Đang lưu...' : editing ? '✅ Cập nhật NCC' : '➕ Thêm NCC'}
          </button>
          <button type="button" onClick={onClose} style={{
            flex: 1, padding: '0.75rem', background: 'white',
            color: '#6b7280', border: '1.5px solid #e5e7eb', borderRadius: '12px',
            fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer',
          }}>Hủy</button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
const Suppliers = () => {
  const [suppliers, setSuppliers]     = useState([]);
  const [loading, setLoading]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [editing, setEditing]         = useState(null);
  const [showModal, setShowModal]     = useState(false);
  const [detailSupplier, setDetailSupplier] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType]   = useState('all');
  const [sortOrder, setSortOrder]     = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12;

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

  // Stats
  const stats = {
    total:      suppliers.length,
    active:     suppliers.filter(s => s.status === 'active').length,
    inactive:   suppliers.filter(s => s.status === 'inactive').length,
    pending:    suppliers.filter(s => s.status === 'pending').length,
    blacklisted:suppliers.filter(s => s.status === 'blacklisted').length,
  };

  // Filter + sort
  const filtered = suppliers
    .filter(s => {
      const q = searchQuery.toLowerCase();
      const matchQ = !q || (s.name || '').toLowerCase().includes(q) || (s.contact?.name || '').toLowerCase().includes(q) || (s.contact?.phone || '').includes(q) || (s.contact?.email || '').toLowerCase().includes(q) || (s.business?.tax_id || '').includes(q);
      const matchStatus = filterStatus === 'all' || s.status === filterStatus;
      const matchType   = filterType   === 'all' || s.supplier_type === filterType;
      return matchQ && matchStatus && matchType;
    })
    .sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sortOrder === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (sortOrder === 'a-z')    return (a.name || '').localeCompare(b.name || '');
      if (sortOrder === 'z-a')    return (b.name || '').localeCompare(a.name || '');
      if (sortOrder === 'rating') return (b.rating || 0) - (a.rating || 0);
      return 0;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(currentPage, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset page on filter change
  useEffect(() => setCurrentPage(1), [searchQuery, filterStatus, filterType, sortOrder]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = JSON.parse(JSON.stringify(form));
      // cleanup address
      if (!payload.address.district) payload.address.district = '';
      if (!payload.address.city)     payload.address.city     = '';
      if (editing) {
        await supplierApi.update(editing.supplier_id || editing._id, payload);
      } else {
        const newId = `SUP-${Date.now().toString().slice(-8)}`;
        payload.supplier_id = newId;
        payload.code        = newId;
        await supplierApi.create(payload);
      }
      setShowModal(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      await loadSuppliers();
    } catch (err) {
      alert('❌ Lỗi: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (s) => {
    setForm({
      name:           s.name || '',
      short_name:     s.short_name || '',
      supplier_type:  s.supplier_type || 'distributor',
      status:         s.status || 'active',
      payment_terms:  s.payment_terms || 'Net30',
      payment_method: s.payment_method || 'bank_transfer',
      rating:         s.rating || 3,
      contact: {
        name:     s.contact?.name     || '',
        position: s.contact?.position || '',
        phone:    s.contact?.phone    || '',
        mobile:   s.contact?.mobile   || '',
        email:    s.contact?.email    || '',
        zalo:     s.contact?.zalo     || '',
      },
      address: {
        street:   s.address?.street   || '',
        ward:     s.address?.ward     || '',
        district: s.address?.district || '',
        city:     s.address?.city     || '',
        country:  s.address?.country  || 'Vietnam',
      },
      business: {
        tax_id:        s.business?.tax_id        || '',
        business_type: s.business?.business_type || 'tndn',
        website:       s.business?.website       || '',
        notes:         s.business?.notes         || '',
      },
    });
    setEditing(s);
    setShowModal(true);
    setDetailSupplier(null);
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`Vô hiệu hóa nhà cung cấp "${s.name}"?`)) return;
    setLoading(true);
    try {
      await supplierApi.delete(s.supplier_id || s._id);
      await loadSuppliers();
    } catch (err) {
      alert('❌ Lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => { setShowModal(false); setEditing(null); setForm(EMPTY_FORM); };

  /* ── RENDER ── */
  return (
    <div style={{ padding: '1.5rem', background: '#f1f5f9', minHeight: '100vh' }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:scale(0.96); } to { opacity:1; transform:scale(1); } }
        @keyframes slideIn { from { transform:translateX(100%); } to { transform:translateX(0); } }
        .sup-row:hover { background: #eef2ff !important; }
      `}</style>

      {/* ── Page header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '800', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🏭 Quản Lý Nhà Cung Cấp
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
            WMS · Warehouse Management System · Nhà cung cấp
          </p>
        </div>
        <button
          onClick={() => { setShowModal(true); setEditing(null); setForm(EMPTY_FORM); }}
          style={{
            padding: '0.7rem 1.5rem', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700',
            fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
            display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(99,102,241,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.4)'; }}
        >
          ➕ Thêm NCC mới
        </button>
      </div>

      {/* ── Stats row */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <StatCard icon="🏭" label="Tổng NCC"    value={stats.total}       color="#6366f1" />
        <StatCard icon="✅" label="Hoạt động"   value={stats.active}      color="#10b981" sub={`${stats.total ? Math.round(stats.active/stats.total*100) : 0}%`} />
        <StatCard icon="⏸️" label="Không HĐ"    value={stats.inactive}    color="#9ca3af" />
        <StatCard icon="⏳" label="Chờ duyệt"   value={stats.pending}     color="#f59e0b" />
        {stats.blacklisted > 0 && <StatCard icon="🚫" label="Cấm" value={stats.blacklisted} color="#ef4444" />}
      </div>

      {/* ── Filters toolbar */}
      <div style={{
        background: 'white', borderRadius: '16px', padding: '1rem 1.25rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '1.25rem',
        display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '220px', maxWidth: '360px' }}>
          <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', pointerEvents: 'none' }}>🔍</span>
          <input
            type="text"
            placeholder="Tìm kiếm tên, SĐT, email, MST..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.575rem 0.875rem 0.575rem 2.25rem', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', color: '#111827', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
            onFocus={e => e.target.style.borderColor = '#6366f1'}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>

        {/* Status filter */}
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '0.575rem 0.875rem', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '0.875rem', background: 'white', color: '#374151', cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}
          onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e5e7eb'}
        >
          <option value="all">Tất cả trạng thái</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>

        {/* Type filter */}
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          style={{ padding: '0.575rem 0.875rem', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '0.875rem', background: 'white', color: '#374151', cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}
          onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e5e7eb'}
        >
          <option value="all">Tất cả loại NCC</option>
          {Object.entries(SUPPLIER_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>

        {/* Sort */}
        <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}
          style={{ padding: '0.575rem 0.875rem', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '0.875rem', background: 'white', color: '#374151', cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}
          onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e5e7eb'}
        >
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
          <option value="a-z">A → Z</option>
          <option value="z-a">Z → A</option>
          <option value="rating">Đánh giá cao</option>
        </select>

        <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>
          {filtered.length} / {suppliers.length} NCC
        </span>
      </div>

      {/* ── Table */}
      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: '1.25rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
            <div>Đang tải dữ liệu...</div>
          </div>
        ) : paginated.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏭</div>
            <div style={{ fontWeight: '700', fontSize: '1rem', color: '#374151', marginBottom: '0.25rem' }}>
              {suppliers.length === 0 ? 'Chưa có nhà cung cấp nào' : 'Không tìm thấy kết quả'}
            </div>
            <div style={{ fontSize: '0.875rem' }}>
              {suppliers.length === 0 ? 'Nhấn "+ Thêm NCC mới" để bắt đầu' : 'Thử thay đổi bộ lọc tìm kiếm'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  {['Nhà Cung Cấp', 'Người Liên Hệ', 'Số Điện Thoại', 'Loại & Trạng Thái', 'MST', 'Đánh Giá', 'Hành Động'].map(h => (
                    <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((s, i) => {
                  const stype  = SUPPLIER_TYPE_LABELS[s.supplier_type] || SUPPLIER_TYPE_LABELS.distributor;
                  const status = STATUS_LABELS[s.status]               || STATUS_LABELS.inactive;
                  return (
                    <tr key={s._id}
                      className="sup-row"
                      style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? 'white' : '#fafafa', cursor: 'pointer', transition: 'background 0.15s' }}
                    >
                      {/* Supplier name */}
                      <td style={{ padding: '0.875rem 1rem' }} onClick={() => setDetailSupplier(s)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                            background: getAvatarColor(s.name),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: '800', fontSize: '0.8rem',
                          }}>{getInitials(s.name)}</div>
                          <div>
                            <div style={{ fontWeight: '700', color: '#111827', fontSize: '0.9rem' }}>{s.name}</div>
                            {s.short_name && <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{s.short_name}</div>}
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td style={{ padding: '0.875rem 1rem' }} onClick={() => setDetailSupplier(s)}>
                        <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#374151' }}>{s.contact?.name || '—'}</div>
                        {s.contact?.email && <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{s.contact.email}</div>}
                      </td>

                      {/* Phone */}
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#4b5563', fontWeight: '500', whiteSpace: 'nowrap' }} onClick={() => setDetailSupplier(s)}>
                        {s.contact?.phone || '—'}
                        {s.contact?.zalo && <div style={{ fontSize: '0.72rem', color: '#10b981' }}>Zalo: {s.contact.zalo}</div>}
                      </td>

                      {/* Type + Status badges */}
                      <td style={{ padding: '0.875rem 1rem' }} onClick={() => setDetailSupplier(s)}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', background: stype.bg, color: stype.color, display: 'inline-block', width: 'fit-content' }}>
                            {stype.label}
                          </span>
                          <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', background: status.bg, color: status.color, display: 'inline-block', width: 'fit-content' }}>
                            {status.label}
                          </span>
                        </div>
                      </td>

                      {/* Tax ID */}
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.82rem', color: '#4b5563', fontFamily: 'monospace', fontWeight: '500' }} onClick={() => setDetailSupplier(s)}>
                        {s.business?.tax_id || '—'}
                      </td>

                      {/* Rating */}
                      <td style={{ padding: '0.875rem 1rem' }} onClick={() => setDetailSupplier(s)}>
                        <StarRating value={s.rating || 0} readonly />
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDetailSupplier(s); }}
                            title="Xem chi tiết"
                            style={{ padding: '0.35rem 0.7rem', border: '1.5px solid #e5e7eb', borderRadius: '8px', background: 'white', color: '#6b7280', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
                          >👁</button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEdit(s); }}
                            title="Chỉnh sửa"
                            style={{ padding: '0.35rem 0.7rem', border: '1.5px solid #c7d2fe', borderRadius: '8px', background: 'white', color: '#6366f1', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700', transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#eef2ff'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
                          >✏️</button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(s); }}
                            title="Vô hiệu hóa"
                            style={{ padding: '0.35rem 0.7rem', border: '1.5px solid #fecaca', borderRadius: '8px', background: 'white', color: '#dc2626', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700', transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
                          >🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination */}
      {totalPages > 1 && (
        <div style={{ background: 'white', borderRadius: '16px', padding: '1rem 1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>
            Trang <b>{safePage}</b> / {totalPages} &nbsp;·&nbsp; <b>{filtered.length}</b> nhà cung cấp
          </span>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
              style={{ padding: '0.4rem 0.875rem', border: '1.5px solid #e5e7eb', borderRadius: '8px', background: 'white', cursor: safePage === 1 ? 'not-allowed' : 'pointer', color: '#374151', opacity: safePage === 1 ? 0.4 : 1, fontWeight: '600', fontSize: '0.82rem' }}>
              ← Trước
            </button>
            {Array.from({ length: totalPages }, (_, idx) => idx + 1)
              .filter(n => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
              .reduce((acc, n, i, arr) => {
                if (i > 0 && n - arr[i - 1] > 1) acc.push('...');
                acc.push(n);
                return acc;
              }, [])
              .map((n, i) => n === '...' ? (
                <span key={`e${i}`} style={{ padding: '0.4rem 0.5rem', color: '#9ca3af' }}>…</span>
              ) : (
                <button key={n} onClick={() => setCurrentPage(n)}
                  style={{ padding: '0.4rem 0.7rem', border: '1.5px solid', borderColor: n === safePage ? '#6366f1' : '#e5e7eb', borderRadius: '8px', background: n === safePage ? '#6366f1' : 'white', color: n === safePage ? 'white' : '#374151', cursor: 'pointer', fontWeight: '700', fontSize: '0.82rem', minWidth: '36px' }}>
                  {n}
                </button>
              ))
            }
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
              style={{ padding: '0.4rem 0.875rem', border: '1.5px solid #e5e7eb', borderRadius: '8px', background: 'white', cursor: safePage === totalPages ? 'not-allowed' : 'pointer', color: '#374151', opacity: safePage === totalPages ? 0.4 : 1, fontWeight: '600', fontSize: '0.82rem' }}>
              Sau →
            </button>
          </div>
        </div>
      )}

      {/* ── Detail Drawer */}
      {detailSupplier && (
        <SupplierDetailDrawer
          supplier={detailSupplier}
          onClose={() => setDetailSupplier(null)}
          onEdit={handleEdit}
        />
      )}

      {/* ── Add/Edit Modal */}
      {showModal && (
        <SupplierModal
          form={form}
          setForm={setForm}
          editing={editing}
          loading={saving}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default Suppliers;