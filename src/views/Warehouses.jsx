import { useState, useEffect, useCallback } from 'react';
import {
  Warehouse,
  Plus,
  MagnifyingGlass,
  PencilSimple,
  Trash,
  X,
  FloppyDisk,
  MapPin,
  Buildings,
  CheckCircle,
  XCircle,
  CaretDown,
  CaretRight,
  DotsThreeVertical,
  ArrowClockwise,
} from '@phosphor-icons/react';
import api from '../services/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const emptyWarehouse = {
  name: '', code: '', address: '', type: 'main', status: 'active', is_default: false,
};
const emptyLocation = {
  location_code: '', name: '', zone: '', aisle: '', rack: '', bin: '',
};

// ─── Badge ────────────────────────────────────────────────────────────────────
const StatusBadge = ({ active }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    background: active ? '#dcfce7' : '#fee2e2',
    color: active ? '#16a34a' : '#dc2626',
  }}>
    {active ? <CheckCircle size={13} weight="fill" /> : <XCircle size={13} weight="fill" />}
    {active ? 'Hoạt động' : 'Ngừng'}
  </span>
);

// ─── Modal Kho ────────────────────────────────────────────────────────────────
const WarehouseModal = ({ open, item, onClose, onSaved }) => {
  const [form, setForm] = useState(emptyWarehouse);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm(item ? {
      name: item.name || item.warehouse_name || '',
      code: item.code || item.warehouse_code || '',
      address: typeof item.address === 'string' ? item.address : (item.address?.full || ''),
      type: item.type || 'main',
      status: item.status || 'active',
      is_default: item.is_default || false,
    } : emptyWarehouse);
    setErr('');
  }, [open, item]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) return setErr('Nhập tên kho');
    if (!form.code.trim()) return setErr('Nhập mã kho');
    setSaving(true); setErr('');
    try {
      if (item) await api.put(`/warehouses/${item._id}`, form);
      else await api.post('/warehouses', form);
      onSaved();
    } catch (e) {
      setErr(e.response?.data?.message || 'Lỗi server');
    } finally { setSaving(false); }
  };

  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 28, width: 480,
        boxShadow: '0 20px 60px rgba(0,0,0,.18)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg,#be185d,#9d174d)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Buildings size={18} color="#fff" weight="fill" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 17, color: '#1e293b' }}>
              {item ? 'Sửa kho hàng' : 'Thêm kho hàng'}
            </span>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Tên kho *" value={form.name} onChange={v => set('name', v)} placeholder="VD: Kho Chính" />
            <Field label="Mã kho *" value={form.code} onChange={v => set('code', v.toUpperCase())} placeholder="VD: KHO-01" disabled={!!item} />
          </div>
          <Field label="Địa chỉ" value={form.address} onChange={v => set('address', v)} placeholder="Địa chỉ kho" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <SelectField label="Loại kho" value={form.type} onChange={v => set('type', v)}
              options={[{ value: 'main', label: 'Kho chính' }, { value: 'transit', label: 'Kho trung chuyển' }, { value: 'returns', label: 'Kho trả hàng' }]} />
            <SelectField label="Trạng thái" value={form.status} onChange={v => set('status', v)}
              options={[{ value: 'active', label: 'Hoạt động' }, { value: 'inactive', label: 'Ngừng' }]} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: '#374151' }}>
            <input type="checkbox" checked={form.is_default} onChange={e => set('is_default', e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#be185d' }} />
            Đặt làm kho mặc định
          </label>
        </div>

        {err && <div style={{ marginTop: 12, padding: '8px 12px', background: '#fee2e2', borderRadius: 8, color: '#dc2626', fontSize: 13 }}>{err}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '9px 20px', borderRadius: 8, border: '1.5px solid #e2e8f0',
            background: '#fff', color: '#64748b', cursor: 'pointer', fontWeight: 600, fontSize: 14,
          }}>Huỷ</button>
          <button onClick={handleSave} disabled={saving} style={{
            padding: '9px 20px', borderRadius: 8, border: 'none',
            background: 'linear-gradient(135deg,#be185d,#9d174d)',
            color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 14,
            display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? .7 : 1,
          }}>
            <FloppyDisk size={16} weight="bold" />
            {saving ? 'Đang lưu...' : 'Lưu kho'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Modal Location ───────────────────────────────────────────────────────────
const LocationModal = ({ open, warehouseId, item, onClose, onSaved }) => {
  const [form, setForm] = useState(emptyLocation);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm(item ? {
      location_code: item.location_code || '',
      name: item.name || '',
      zone: item.zone || '',
      aisle: item.aisle || '',
      rack: item.rack || '',
      bin: item.bin || '',
    } : emptyLocation);
    setErr('');
  }, [open, item]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.location_code.trim()) return setErr('Nhập mã vị trí');
    setSaving(true); setErr('');
    try {
      if (item) await api.put(`/warehouses/${warehouseId}/locations/${item._id}`, form);
      else await api.post(`/warehouses/${warehouseId}/locations`, form);
      onSaved();
    } catch (e) {
      setErr(e.response?.data?.message || 'Lỗi server');
    } finally { setSaving(false); }
  };

  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 440, boxShadow: '0 20px 60px rgba(0,0,0,.18)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: 'linear-gradient(135deg,#0ea5e9,#0284c7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MapPin size={16} color="#fff" weight="fill" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#1e293b' }}>
              {item ? 'Sửa vị trí' : 'Thêm vị trí'}
            </span>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Mã vị trí *" value={form.location_code} onChange={v => set('location_code', v.toUpperCase())} placeholder="VD: A1-01" />
            <Field label="Tên vị trí" value={form.name} onChange={v => set('name', v)} placeholder="VD: Kệ A hàng 1" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Khu (Zone)" value={form.zone} onChange={v => set('zone', v)} placeholder="VD: A" />
            <Field label="Lối đi (Aisle)" value={form.aisle} onChange={v => set('aisle', v)} placeholder="VD: 01" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Kệ (Rack)" value={form.rack} onChange={v => set('rack', v)} placeholder="VD: R1" />
            <Field label="Ngăn (Bin)" value={form.bin} onChange={v => set('bin', v)} placeholder="VD: B2" />
          </div>
        </div>

        {err && <div style={{ marginTop: 10, padding: '8px 12px', background: '#fee2e2', borderRadius: 8, color: '#dc2626', fontSize: 13 }}>{err}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Huỷ</button>
          <button onClick={handleSave} disabled={saving} style={{
            padding: '8px 18px', borderRadius: 8, border: 'none',
            background: 'linear-gradient(135deg,#0ea5e9,#0284c7)',
            color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? .7 : 1,
          }}>
            <FloppyDisk size={15} weight="bold" />
            {saving ? 'Đang lưu...' : 'Lưu vị trí'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Confirm Delete ───────────────────────────────────────────────────────────
const ConfirmDialog = ({ open, message, onConfirm, onCancel, loading }) => {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 360, boxShadow: '0 20px 60px rgba(0,0,0,.18)' }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b', marginBottom: 10 }}>Xác nhận xoá</div>
        <div style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>{message}</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '8px 18px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Huỷ</button>
          <button onClick={onConfirm} disabled={loading} style={{
            padding: '8px 18px', borderRadius: 8, border: 'none', background: '#ef4444',
            color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 13, opacity: loading ? .7 : 1,
          }}>{loading ? 'Đang xoá...' : 'Xoá'}</button>
        </div>
      </div>
    </div>
  );
};

// ─── Field atoms ──────────────────────────────────────────────────────────────
const Field = ({ label, value, onChange, placeholder, disabled }) => (
  <div>
    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
    <input
      value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} disabled={disabled}
      style={{
        width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 14,
        border: '1.5px solid #e2e8f0', outline: 'none', boxSizing: 'border-box',
        background: disabled ? '#f8fafc' : '#fff', color: '#1e293b',
        transition: 'border-color .15s',
      }}
      onFocus={e => !disabled && (e.target.style.borderColor = '#be185d')}
      onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
    />
  </div>
);

const SelectField = ({ label, value, onChange, options }) => (
  <div>
    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 14,
      border: '1.5px solid #e2e8f0', outline: 'none', background: '#fff', color: '#1e293b',
    }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

// ─── Location Row ─────────────────────────────────────────────────────────────
const LocationRow = ({ loc, onEdit, onDelete }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 14px', borderRadius: 8, background: '#f8fafc',
    border: '1px solid #e2e8f0', marginBottom: 6,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <MapPin size={14} color="#0ea5e9" weight="fill" />
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: '#0284c7' }}>{loc.location_code}</span>
      {loc.name && <span style={{ fontSize: 13, color: '#64748b' }}>— {loc.name}</span>}
      {loc.zone && <span style={{ fontSize: 11, padding: '1px 8px', background: '#e0f2fe', borderRadius: 10, color: '#0369a1', fontWeight: 600 }}>Zone {loc.zone}</span>}
    </div>
    <div style={{ display: 'flex', gap: 4 }}>
      <IconBtn icon={<PencilSimple size={14} />} color="#0ea5e9" onClick={onEdit} />
      <IconBtn icon={<Trash size={14} />} color="#ef4444" onClick={onDelete} />
    </div>
  </div>
);

const IconBtn = ({ icon, color, onClick }) => (
  <button onClick={onClick} style={{
    width: 28, height: 28, borderRadius: 7, border: `1.5px solid ${color}20`,
    background: `${color}10`, color, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all .15s',
  }}
    onMouseEnter={e => { e.currentTarget.style.background = `${color}22`; }}
    onMouseLeave={e => { e.currentTarget.style.background = `${color}10`; }}
  >{icon}</button>
);

// ─── Warehouse Card ───────────────────────────────────────────────────────────
const WarehouseCard = ({ w, onEdit, onDelete, onAddLocation, onEditLocation, onDeleteLocation }) => {
  const [expanded, setExpanded] = useState(false);
  const [locations, setLocations] = useState([]);
  const [loadingLoc, setLoadingLoc] = useState(false);

  const loadLocations = useCallback(async () => {
    setLoadingLoc(true);
    try {
      const res = await api.get(`/warehouses/${w._id}/locations`);
      setLocations(res.data?.data || []);
    } catch { setLocations([]); }
    finally { setLoadingLoc(false); }
  }, [w._id]);

  const handleExpand = () => {
    if (!expanded) loadLocations();
    setExpanded(e => !e);
  };

  const typeLabel = { main: 'Kho chính', transit: 'Trung chuyển', returns: 'Trả hàng' }[w.type] || w.type;

  return (
    <div style={{
      background: '#fff', borderRadius: 14, border: '1.5px solid #e2e8f0',
      overflow: 'hidden', transition: 'box-shadow .2s',
      boxShadow: '0 1px 4px rgba(0,0,0,.05)',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,.05)'}
    >
      {/* Card Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 11,
            background: 'linear-gradient(135deg,#be185d15,#9d174d10)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Buildings size={22} color="#be185d" weight="fill" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>{w.name || w.warehouse_name}</span>
              {w.is_default && (
                <span style={{ fontSize: 10, padding: '2px 7px', background: '#fdf4ff', border: '1px solid #e9d5ff', borderRadius: 10, color: '#9333ea', fontWeight: 700 }}>MẶC ĐỊNH</span>
              )}
              <StatusBadge active={w.status === 'active' || w.is_active} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#be185d', fontWeight: 700, background: '#fdf2f8', padding: '2px 8px', borderRadius: 6 }}>
                {w.code || w.warehouse_code}
              </span>
              <span style={{ fontSize: 12, color: '#64748b' }}>{typeLabel}</span>
              {(w.address?.full || typeof w.address === 'string') && (
                <span style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={12} />
                  {typeof w.address === 'string' ? w.address : w.address?.full}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => onEdit(w)} style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
            borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff',
            color: '#64748b', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>
            <PencilSimple size={14} /> Sửa
          </button>
          <button onClick={() => onDelete(w)} style={{
            width: 34, height: 34, borderRadius: 8, border: '1.5px solid #fee2e2',
            background: '#fff5f5', color: '#ef4444', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Trash size={15} />
          </button>
        </div>
      </div>

      {/* Locations section */}
      <div style={{ borderTop: '1px solid #f1f5f9' }}>
        <button onClick={handleExpand} style={{
          width: '100%', padding: '10px 20px', background: 'none', border: 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
          color: '#64748b', fontSize: 13, fontWeight: 600, textAlign: 'left',
        }}>
          {expanded ? <CaretDown size={14} /> : <CaretRight size={14} />}
          <MapPin size={14} color="#0ea5e9" />
          Vị trí trong kho
          {locations.length > 0 && (
            <span style={{ marginLeft: 4, fontSize: 11, padding: '1px 8px', background: '#e0f2fe', borderRadius: 10, color: '#0369a1', fontWeight: 700 }}>
              {locations.length}
            </span>
          )}
        </button>

        {expanded && (
          <div style={{ padding: '0 20px 16px' }}>
            {loadingLoc ? (
              <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>Đang tải...</div>
            ) : (
              <>
                {locations.length === 0 && (
                  <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '12px 0', background: '#f8fafc', borderRadius: 8 }}>
                    Chưa có vị trí nào
                  </div>
                )}
                {locations.map(loc => (
                  <LocationRow
                    key={loc._id}
                    loc={loc}
                    onEdit={() => onEditLocation(w, loc, () => loadLocations())}
                    onDelete={() => onDeleteLocation(w, loc, () => loadLocations())}
                  />
                ))}
                <button onClick={() => onAddLocation(w, () => loadLocations())} style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginTop: 8,
                  padding: '7px 14px', borderRadius: 8, border: '1.5px dashed #bae6fd',
                  background: '#f0f9ff', color: '#0ea5e9', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                }}>
                  <Plus size={14} weight="bold" /> Thêm vị trí
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Warehouse modal
  const [whModal, setWhModal] = useState({ open: false, item: null });
  // Location modal
  const [locModal, setLocModal] = useState({ open: false, warehouseId: null, item: null, onSaved: null });
  // Confirm delete
  const [confirm, setConfirm] = useState({ open: false, message: '', onConfirm: null, loading: false });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/warehouses');
      setWarehouses(res.data?.data || []);
    } catch { setWarehouses([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = warehouses.filter(w => {
    const q = search.toLowerCase();
    return !q
      || (w.name || w.warehouse_name || '').toLowerCase().includes(q)
      || (w.code || w.warehouse_code || '').toLowerCase().includes(q);
  });

  // Delete warehouse
  const handleDeleteWarehouse = (w) => {
    setConfirm({
      open: true,
      message: `Xoá kho "${w.name || w.warehouse_name}"? Hành động này không thể hoàn tác.`,
      loading: false,
      onConfirm: async () => {
        setConfirm(c => ({ ...c, loading: true }));
        try {
          await api.delete(`/warehouses/${w._id}`);
          setConfirm({ open: false });
          load();
        } catch { setConfirm(c => ({ ...c, loading: false })); }
      },
    });
  };

  // Location callbacks
  const handleAddLocation = (w, cb) => {
    setLocModal({ open: true, warehouseId: w._id, item: null, onSaved: cb });
  };
  const handleEditLocation = (w, loc, cb) => {
    setLocModal({ open: true, warehouseId: w._id, item: loc, onSaved: cb });
  };
  const handleDeleteLocation = (w, loc, cb) => {
    setConfirm({
      open: true,
      message: `Xoá vị trí "${loc.location_code}"?`,
      loading: false,
      onConfirm: async () => {
        setConfirm(c => ({ ...c, loading: true }));
        try {
          await api.delete(`/warehouses/${w._id}/locations/${loc._id}`);
          setConfirm({ open: false });
          cb();
        } catch { setConfirm(c => ({ ...c, loading: false })); }
      },
    });
  };

  const activeCount = warehouses.filter(w => w.status === 'active' || w.is_active).length;

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'Outfit, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '20px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg,#be185d,#9d174d)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Warehouse size={22} color="#fff" weight="fill" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1e293b' }}>Kho Hàng</h1>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Quản lý kho & vị trí lưu trữ</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={load} style={{
              width: 38, height: 38, borderRadius: 9, border: '1.5px solid #e2e8f0',
              background: '#fff', color: '#64748b', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ArrowClockwise size={16} />
            </button>
            <button onClick={() => setWhModal({ open: true, item: null })} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
              borderRadius: 9, border: 'none',
              background: 'linear-gradient(135deg,#be185d,#9d174d)',
              color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14,
            }}>
              <Plus size={16} weight="bold" /> Thêm kho
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
          {[
            { label: 'Tổng kho', value: warehouses.length, color: '#be185d', bg: '#fdf2f8' },
            { label: 'Đang hoạt động', value: activeCount, color: '#16a34a', bg: '#dcfce7' },
            { label: 'Tạm ngừng', value: warehouses.length - activeCount, color: '#dc2626', bg: '#fee2e2' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', background: s.bg, borderRadius: 10 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</span>
              <span style={{ fontSize: 13, color: s.color, fontWeight: 600 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 32px' }}>
        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 360, marginBottom: 20 }}>
          <MagnifyingGlass size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kho..."
            style={{
              width: '100%', padding: '9px 12px 9px 36px', borderRadius: 9,
              border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none',
              background: '#fff', boxSizing: 'border-box', color: '#1e293b',
            }}
            onFocus={e => e.target.style.borderColor = '#be185d'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>

        {/* List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 90, background: '#fff', borderRadius: 14, border: '1.5px solid #e2e8f0', animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
            <Buildings size={48} style={{ marginBottom: 12, opacity: .4 }} />
            <div style={{ fontSize: 15, fontWeight: 600 }}>
              {search ? 'Không tìm thấy kho phù hợp' : 'Chưa có kho nào'}
            </div>
            {!search && (
              <button onClick={() => setWhModal({ open: true, item: null })} style={{
                marginTop: 14, padding: '9px 18px', borderRadius: 9, border: 'none',
                background: 'linear-gradient(135deg,#be185d,#9d174d)',
                color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14,
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                <Plus size={15} weight="bold" /> Thêm kho đầu tiên
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(w => (
              <WarehouseCard
                key={w._id}
                w={w}
                onEdit={item => setWhModal({ open: true, item })}
                onDelete={handleDeleteWarehouse}
                onAddLocation={handleAddLocation}
                onEditLocation={handleEditLocation}
                onDeleteLocation={handleDeleteLocation}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <WarehouseModal
        open={whModal.open}
        item={whModal.item}
        onClose={() => setWhModal({ open: false, item: null })}
        onSaved={() => { setWhModal({ open: false, item: null }); load(); }}
      />
      <LocationModal
        open={locModal.open}
        warehouseId={locModal.warehouseId}
        item={locModal.item}
        onClose={() => setLocModal({ open: false, warehouseId: null, item: null, onSaved: null })}
        onSaved={() => { setLocModal(l => ({ ...l, open: false })); locModal.onSaved?.(); }}
      />
      <ConfirmDialog
        open={confirm.open}
        message={confirm.message}
        loading={confirm.loading}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm({ open: false })}
      />

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  );
}