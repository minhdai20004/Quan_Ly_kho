import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Package, MagnifyingGlass, Tag, ArrowUp, ArrowDown,
  Equals, X, Check, Warning, CaretLeft, CaretRight,
  CaretUpDown, SortAscending, SortDescending,
  ArrowClockwise, CurrencyCircleDollar,
  Prohibit, Lightning, CalendarX, Timer,
  Plus, Trash, PencilSimple,
} from '@phosphor-icons/react';
import api from '../services/api';

const PAGE_SIZE = 15;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCurrency = n =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

const formatDate = d => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const getDaysUntil = d => {
  if (!d) return null;
  return Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));
};

const getExpiryStatus = (nearest_expiry, has_expiry_date, threshold = 30) => {
  if (!has_expiry_date) return null; // không track HSD
  if (!nearest_expiry)  return { key: 'no_batch', label: 'Chưa có lô',  cls: 'badge-gray',   color: 'var(--text-3)' };
  const days = getDaysUntil(nearest_expiry);
  if (days < 0)              return { key: 'expired',  label: 'Đã hết hạn', cls: 'badge-red',    color: '#f87171', days };
  if (days <= threshold)     return { key: 'expiring', label: `Còn ${days}d`, cls: 'badge-yellow', color: '#fbbf24', days };
  return                            { key: 'ok',       label: `Còn ${days}d`, cls: 'badge-green',  color: '#4ade80', days };
};

const formatPackUnit = (qty, unitPerPack) => {
  const u = Number(unitPerPack);
  if (!u || u <= 1) return null;
  const boxes = Math.floor(qty / u);
  const loose = qty % u;
  if (boxes === 0) return `${loose} lẻ`;
  if (loose === 0) return `${boxes} thùng`;
  return `${boxes} thùng ${loose} lẻ`;
};

// ─── Batch Panel ──────────────────────────────────────────────────────────────
function BatchPanel({ material, warehouses, onClose, onRefresh }) {
  const [batches,   setBatches]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editBatch, setEditBatch] = useState(null);
  const [form, setForm] = useState({
    batch_no: '', manufacture_date: '', expiry_date: '',
    quantity: '', unit_cost: '', warehouse_id: warehouses[0]?._id || '', notes: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get(`/material-batches/material/${material._id}`);
      setBatches(r.data?.data || []);
    } catch (_) {}
    finally { setLoading(false); }
  }, [material._id]);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  const openAdd = () => {
    setEditBatch(null);
    // Auto-fill HSD từ default_shelf_life_days nếu có
    setForm({
      batch_no: '', manufacture_date: '', expiry_date: '',
      quantity: '', unit_cost: '', warehouse_id: warehouses[0]?._id || '', notes: '',
    });
    setShowForm(true);
  };

  const openEdit = b => {
    setEditBatch(b);
    setForm({
      batch_no:         b.batch_no || '',
      manufacture_date: b.manufacture_date ? b.manufacture_date.slice(0, 10) : '',
      expiry_date:      b.expiry_date ? b.expiry_date.slice(0, 10) : '',
      quantity:         String(b.quantity),
      unit_cost:        String(b.unit_cost || ''),
      warehouse_id:     b.warehouse_id?._id || b.warehouse_id || '',
      notes:            b.notes || '',
    });
    setShowForm(true);
  };

  // Auto-calc HSD khi nhập NSX
  const handleMfgChange = val => {
    setForm(f => {
      const upd = { ...f, manufacture_date: val };
      if (val && material.default_shelf_life_days && !f.expiry_date) {
        const d = new Date(val);
        d.setDate(d.getDate() + material.default_shelf_life_days);
        upd.expiry_date = d.toISOString().slice(0, 10);
      }
      return upd;
    });
  };

  const handleSave = async () => {
    if (!form.expiry_date) return alert('Vui lòng nhập hạn sử dụng');
    if (!form.quantity || Number(form.quantity) <= 0) return alert('Số lượng phải > 0');
    setSaving(true);
    try {
      if (editBatch) {
        await api.put(`/material-batches/${editBatch._id}`, {
          batch_no:         form.batch_no || undefined,
          manufacture_date: form.manufacture_date || null,
          expiry_date:      form.expiry_date,
          quantity:         Number(form.quantity),
          unit_cost:        Number(form.unit_cost) || 0,
          notes:            form.notes,
        });
      } else {
        await api.post('/material-batches', {
          material_id:      material._id,
          warehouse_id:     form.warehouse_id,
          batch_no:         form.batch_no || undefined,
          manufacture_date: form.manufacture_date || null,
          expiry_date:      form.expiry_date,
          quantity:         Number(form.quantity),
          unit_cost:        Number(form.unit_cost) || 0,
          notes:            form.notes,
        });
      }
      setShowForm(false);
      fetchBatches();
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally { setSaving(false); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Xóa lô hàng này?')) return;
    try { await api.delete(`/material-batches/${id}`); fetchBatches(); onRefresh(); }
    catch (err) { alert(err.message); }
  };

  const now = new Date();

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(2,6,23,0.75)', backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        width: '100%', maxWidth: 620,
        background: 'var(--bg-2)', border: '1px solid var(--border)',
        borderRadius: 16, boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-1)' }}>
              Quản lý lô hàng — HSD
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 2 }}>
              {material._code} · {material._name}
              {material.default_shelf_life_days && (
                <span style={{ marginLeft: 8, color: 'var(--accent)' }}>
                  · HSD mặc định: {material.default_shelf_life_days} ngày
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className="btn btn-primary" style={{ fontSize: '0.78rem', padding: '0.35rem 0.7rem' }}
              onClick={openAdd}>
              <Plus size={12} weight="bold" /> Thêm lô
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Form thêm/sửa */}
        {showForm && (
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'rgba(14,165,233,0.04)', flexShrink: 0 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: '0.75rem' }}>
              {editBatch ? 'Sửa lô hàng' : 'Thêm lô hàng mới'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 500 }}>Số lô</label>
                <input className="input" value={form.batch_no} onChange={e => setForm(f => ({ ...f, batch_no: e.target.value }))}
                  placeholder="Tự sinh nếu trống" style={{ fontSize: '0.8rem', fontFamily: 'monospace' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 500 }}>NSX</label>
                <input className="input" type="date" value={form.manufacture_date}
                  onChange={e => handleMfgChange(e.target.value)} style={{ fontSize: '0.8rem' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 500 }}>HSD <span style={{ color: '#f87171' }}>*</span></label>
                <input className="input" type="date" value={form.expiry_date}
                  onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} style={{ fontSize: '0.8rem' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 500 }}>Kho</label>
                <select className="input" value={form.warehouse_id}
                  onChange={e => setForm(f => ({ ...f, warehouse_id: e.target.value }))} style={{ fontSize: '0.8rem' }}>
                  {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 500 }}>Số lượng <span style={{ color: '#f87171' }}>*</span></label>
                <input className="input" type="number" min={0} value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="0" style={{ fontSize: '0.8rem' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 500 }}>Giá vốn / sp</label>
                <input className="input" type="number" min={0} value={form.unit_cost}
                  onChange={e => setForm(f => ({ ...f, unit_cost: e.target.value }))} placeholder="0" style={{ fontSize: '0.8rem' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" style={{ fontSize: '0.78rem' }} onClick={() => setShowForm(false)}>Huỷ</button>
              <button className="btn btn-primary" style={{ fontSize: '0.78rem', opacity: saving ? 0.7 : 1 }} onClick={handleSave} disabled={saving}>
                <Check size={12} weight="bold" /> {saving ? 'Đang lưu...' : editBatch ? 'Cập nhật' : 'Tạo lô'}
              </button>
            </div>
          </div>
        )}

        {/* Batch list */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-3)', fontSize: '0.8rem' }}>Đang tải...</div>
          ) : batches.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)', fontSize: '0.8rem' }}>
              Chưa có lô hàng nào — nhấn "Thêm lô" để bắt đầu
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Số lô', 'NSX', 'HSD', 'Kho', 'Số lượng', 'Trạng thái', ''].map(h => (
                    <th key={h} style={{ padding: '0.6rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {batches.map(b => {
                  const days = Math.ceil((new Date(b.expiry_date) - now) / (1000 * 60 * 60 * 24));
                  const isExpired = days < 0;
                  const isSoon    = !isExpired && days <= 30;
                  return (
                    <tr key={b._id} style={{ borderBottom: '1px solid var(--border)', background: isExpired ? 'rgba(248,113,113,0.04)' : isSoon ? 'rgba(251,191,36,0.04)' : 'transparent' }}>
                      <td style={{ padding: '0.65rem 1rem', fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 600 }}>{b.batch_no}</td>
                      <td style={{ padding: '0.65rem 1rem', fontSize: '0.78rem', color: 'var(--text-3)' }}>{formatDate(b.manufacture_date)}</td>
                      <td style={{ padding: '0.65rem 1rem', fontSize: '0.78rem', fontWeight: 500, color: isExpired ? '#f87171' : isSoon ? '#fbbf24' : 'var(--text-2)' }}>
                        {formatDate(b.expiry_date)}
                      </td>
                      <td style={{ padding: '0.65rem 1rem', fontSize: '0.78rem', color: 'var(--text-3)' }}>{b.warehouse_id?.name || '—'}</td>
                      <td style={{ padding: '0.65rem 1rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-1)' }}>{b.quantity}</td>
                      <td style={{ padding: '0.65rem 1rem' }}>
                        {isExpired
                          ? <span className="badge badge-red">Hết hạn</span>
                          : isSoon
                          ? <span className="badge badge-yellow">Còn {days} ngày</span>
                          : <span className="badge badge-green">Còn {days} ngày</span>
                        }
                      </td>
                      <td style={{ padding: '0.65rem 1rem', textAlign: 'right' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.2rem 0.45rem', marginRight: '0.3rem' }} onClick={() => openEdit(b)}>
                          <PencilSimple size={11} />
                        </button>
                        <button className="btn btn-danger" style={{ padding: '0.2rem 0.45rem' }} onClick={() => handleDelete(b._id)}>
                          <Trash size={11} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Adjust Modal ─────────────────────────────────────────────────────────────
function AdjustModal({ material, warehouses, onClose, onDone }) {
  const curStock = material.totalStock || 0;
  const [form, setForm] = useState({
    type: 'in',
    quantity: '', thuong: '', le: '',
    warehouse_id: warehouses[0]?._id || '',
    reason: '',
    unit_per_pack: material.unit_per_pack || '',
    // Batch fields (chỉ dùng khi type='in' và has_expiry_date)
    batch_no: '', manufacture_date: '', expiry_date: '',
  });
  const [saving, setSaving] = useState(false);

  const upc    = Number(form.unit_per_pack);
  const qty    = Number(form.quantity) || 0;
  const previewAfter = form.type === 'in' ? curStock + qty
    : form.type === 'out' ? Math.max(0, curStock - qty)
    : form.type === 'set' ? qty : curStock;

  const showBatchFields = form.type === 'in' && material.has_expiry_date;

  const handleMfgChange = val => {
    setForm(f => {
      const upd = { ...f, manufacture_date: val };
      if (val && material.default_shelf_life_days && !f.expiry_date) {
        const d = new Date(val);
        d.setDate(d.getDate() + material.default_shelf_life_days);
        upd.expiry_date = d.toISOString().slice(0, 10);
      }
      return upd;
    });
  };

  const handleSubmit = async () => {
    if (!qty || qty <= 0) return alert('Nhập số lượng hợp lệ (> 0)');
    if (showBatchFields && !form.expiry_date) return alert('Vật tư này cần nhập hạn sử dụng');
    setSaving(true);
    try {
      // Điều chỉnh tồn kho
      await api.post('/material-stock/adjust', {
        material_id:     material._id,
        warehouse_id:    form.warehouse_id || undefined,
        adjustment_type: form.type,
        quantity:        qty,
        notes:           form.reason || 'Điều chỉnh thủ công',
      });
      // Tạo lô nếu nhập hàng có HSD
      if (showBatchFields && form.expiry_date) {
        await api.post('/material-batches', {
          material_id:      material._id,
          warehouse_id:     form.warehouse_id,
          batch_no:         form.batch_no || undefined,
          manufacture_date: form.manufacture_date || null,
          expiry_date:      form.expiry_date,
          quantity:         qty,
        });
      }
      onDone();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally { setSaving(false); }
  };

  const TYPE_OPTIONS = [
    { value: 'in',  icon: <ArrowUp size={13} weight="bold" />,    label: 'Nhập thêm',       color: '#4ade80' },
    { value: 'out', icon: <ArrowDown size={13} weight="bold" />,  label: 'Xuất / Giảm',     color: '#f87171' },
    { value: 'set', icon: <Equals size={13} weight="bold" />,     label: 'Đặt lại SL',      color: 'var(--accent)' },
  ];

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(2,6,23,0.75)', backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        width: '100%', maxWidth: 460,
        background: 'var(--bg-2)', border: '1px solid var(--border)',
        borderRadius: 16, boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-1)' }}>Điều chỉnh tồn kho</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 2 }}>{material._code} — {material._name}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}><X size={15} /></button>
        </div>

        <div style={{ overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Current stock */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderRadius: 10, background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>Tồn hiện tại</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-1)' }}>{curStock}</span>
          </div>

          {/* Type selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
            {TYPE_OPTIONS.map(t => (
              <button key={t.value} onClick={() => setForm(f => ({ ...f, type: t.value }))}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '0.6rem 0.4rem', borderRadius: 8, border: '1px solid',
                  borderColor: form.type === t.value ? t.color : 'var(--border)',
                  background: form.type === t.value ? `${t.color}18` : 'transparent',
                  color: form.type === t.value ? t.color : 'var(--text-3)',
                  cursor: 'pointer', fontFamily: 'var(--font)', fontSize: '0.75rem', fontWeight: 500,
                  transition: 'all 0.15s',
                }}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {/* Warehouse */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-3)' }}>Kho *</label>
            {warehouses.length > 0
              ? <select className="input" value={form.warehouse_id} onChange={e => setForm(f => ({ ...f, warehouse_id: e.target.value }))}>
                  {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                </select>
              : <div style={{ padding: '0.65rem', borderRadius: 8, fontSize: '0.8rem', color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
                  Chưa có kho — vào Kho Hàng để tạo kho trước.
                </div>
            }
          </div>

          {/* Batch fields — chỉ hiện khi nhập hàng có HSD */}
          {showBatchFields && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem', borderRadius: 10, background: 'rgba(14,165,233,0.04)', border: '1px solid rgba(14,165,233,0.15)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                Thông tin lô hàng
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 500 }}>Số lô</label>
                  <input className="input" value={form.batch_no} onChange={e => setForm(f => ({ ...f, batch_no: e.target.value }))}
                    placeholder="Tự sinh nếu trống" style={{ fontSize: '0.8rem', fontFamily: 'monospace' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 500 }}>NSX</label>
                  <input className="input" type="date" value={form.manufacture_date}
                    onChange={e => handleMfgChange(e.target.value)} style={{ fontSize: '0.8rem' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 500 }}>HSD <span style={{ color: '#f87171' }}>*</span></label>
                <input className="input" type="date" value={form.expiry_date}
                  onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} style={{ fontSize: '0.8rem' }} />
              </div>
            </div>
          )}

          {/* Quantity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-3)' }}>
              Số lượng *{form.type === 'set' && <span style={{ fontWeight: 400, opacity: 0.7 }}> (số chính xác cần đặt)</span>}
            </label>
            {upc > 1 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input className="input" type="number" min={0} value={form.thuong}
                  onChange={e => { const t = Number(e.target.value)||0; const l = Number(form.le)||0; setForm(f => ({ ...f, thuong: e.target.value, quantity: String(t * upc + l) })); }}
                  placeholder="0" style={{ width: 70, textAlign: 'center' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>thùng</span>
                <span style={{ color: 'var(--border)' }}>+</span>
                <input className="input" type="number" min={0} value={form.le}
                  onChange={e => { const l = Number(e.target.value)||0; const t = Number(form.thuong)||0; setForm(f => ({ ...f, le: e.target.value, quantity: String(t * upc + l) })); }}
                  placeholder="0" style={{ width: 70, textAlign: 'center' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>lẻ</span>
                <span style={{ color: 'var(--border)' }}>=</span>
                <span style={{ fontWeight: 700, color: 'var(--accent)', minWidth: 36 }}>{form.quantity || 0}</span>
              </div>
            ) : (
              <input className="input" type="number" min={0} value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                placeholder="Nhập số lượng..." autoFocus />
            )}
          </div>

          {/* Preview */}
          {qty > 0 && (
            <div style={{ padding: '0.65rem 1rem', borderRadius: 8, fontSize: '0.8rem', background: 'rgba(14,165,233,0.07)', border: '1px solid rgba(14,165,233,0.2)', color: 'var(--text-2)' }}>
              Sau điều chỉnh: <strong style={{ color: 'var(--accent)', fontSize: '1rem' }}>{previewAfter}</strong>
              {upc > 1 && <span style={{ color: 'var(--text-3)', marginLeft: 6 }}>({formatPackUnit(previewAfter, upc)})</span>}
            </div>
          )}

          {/* Reason */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-3)' }}>Lý do</label>
            <input className="input" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="VD: Nhập hàng từ nhà cung cấp..." />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border)' }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Huỷ</button>
          <button onClick={handleSubmit} disabled={saving} className="btn btn-primary" style={{ flex: 2, opacity: saving ? 0.7 : 1 }}>
            <Check size={13} weight="bold" />{saving ? 'Đang lưu...' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sort Dropdown ─────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'name_asc',    label: 'Tên A → Z',          icon: <SortAscending size={13} /> },
  { value: 'name_desc',   label: 'Tên Z → A',          icon: <SortDescending size={13} /> },
  { value: 'stock_asc',   label: 'Tồn kho thấp nhất',  icon: <SortAscending size={13} /> },
  { value: 'stock_desc',  label: 'Tồn kho cao nhất',   icon: <SortDescending size={13} /> },
  { value: 'expiry_asc',  label: 'HSD gần nhất',       icon: <CalendarX size={13} /> },
  { value: 'value_desc',  label: 'Giá trị cao nhất',   icon: <SortDescending size={13} /> },
];
function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = SORT_OPTIONS.find(o => o.value === value) || SORT_OPTIONS[0];
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(p => !p)} className="btn btn-secondary"
        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', height: '2.25rem', paddingInline: '0.75rem' }}>
        {current.icon}{current.label}<CaretUpDown size={12} style={{ color: 'var(--text-3)' }} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 20 }} />
          <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 30, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', minWidth: 210, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
            {SORT_OPTIONS.map(o => (
              <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 0.875rem', border: 'none', cursor: 'pointer', textAlign: 'left', background: o.value === value ? 'rgba(14,165,233,0.1)' : 'transparent', color: o.value === value ? 'var(--accent)' : 'var(--text-2)', fontSize: '0.8rem', fontFamily: 'var(--font)', transition: 'background 0.1s' }}>
                {o.icon}{o.label}{o.value === value && <Check size={12} style={{ marginLeft: 'auto' }} weight="bold" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) pages.push(i);
    else if (pages[pages.length - 1] !== '...') pages.push('...');
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', padding: '1.25rem 0 0.5rem' }}>
      <button onClick={() => onChange(page - 1)} disabled={page === 1} className="btn btn-secondary" style={{ padding: '0.3rem 0.5rem', opacity: page === 1 ? 0.4 : 1 }}><CaretLeft size={13} weight="bold" /></button>
      {pages.map((p, i) => p === '...'
        ? <span key={`e${i}`} style={{ padding: '0 0.25rem', color: 'var(--text-3)', fontSize: '0.8rem' }}>···</span>
        : <button key={p} onClick={() => onChange(p)} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: p === page ? 700 : 400, fontFamily: 'var(--font)', background: p === page ? 'var(--accent)' : 'transparent', color: p === page ? '#fff' : 'var(--text-3)', transition: 'all 0.15s' }}>{p}</button>
      )}
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages} className="btn btn-secondary" style={{ padding: '0.3rem 0.5rem', opacity: page === totalPages ? 0.4 : 1 }}><CaretRight size={13} weight="bold" /></button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const EXPIRY_FILTER_OPTIONS = [
  { key: 'all',      label: 'Tất cả' },
  { key: 'expired',  label: 'Hết hạn',   color: '#f87171' },
  { key: 'expiring', label: 'Sắp hết',   color: '#fbbf24' },
  { key: 'ok',       label: 'Còn hạn',   color: '#4ade80' },
  { key: 'no_track', label: 'Không track HSD' },
];

const Inventory = () => {
  const [materials,  setMaterials]  = useState([]);
  const [groups,     setGroups]     = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState('');
  const [filterGroup,     setFilterGroup]     = useState('');
  const [filterGroupName, setFilterGroupName] = useState('');
  const [filterExpiry,    setFilterExpiry]    = useState('all');
  const [sortBy,     setSortBy]     = useState('name_asc');
  const [page,       setPage]       = useState(1);
  const [threshold,  setThreshold]  = useState(30);
  const [editThreshold, setEditThreshold] = useState(false);
  const [thresholdInput, setThresholdInput] = useState('30');
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [batchTarget,  setBatchTarget]  = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [mRes, gRes, wRes] = await Promise.all([
        api.get('/materials'),
        api.get('/material-groups'),
        api.get('/warehouses').catch(() => ({ data: [] })),
      ]);
      setMaterials(mRes.data?.data || mRes.data || []);
      setGroups(gRes.data?.data   || gRes.data   || []);
      setWarehouses(wRes.data?.data || wRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [search, filterGroup, filterExpiry, sortBy]);

  const normalize = m => ({
    ...m,
    _name:    m.material_name || m.product_name || '—',
    _code:    m.material_code || m.product_code || '—',
    _group:   m.group_id?.name || m.category_id?.name || m.group_name || '—',
    _groupId: String(m.group_id?._id || m.group_id || m.category_id?._id || m.category_id || ''),
    _stock:   m.totalStock || 0,
    _cost:    m.cost_price || m.prices?.[0]?.cost_price || 0,
    _expiry:  m.nearest_expiry || null,
    _expiryStatus: getExpiryStatus(m.nearest_expiry, m.has_expiry_date, threshold),
  });

  const flatGroupOptions = useMemo(() => {
    const result = [];
    function flatten(list, depth = 0) {
      list.forEach(g => {
        result.push({ ...g, _depth: depth });
        const children = groups.filter(c => String(c.parent_id?._id || c.parent_id) === String(g._id));
        if (children.length) flatten(children, depth + 1);
      });
    }
    flatten(groups.filter(g => !g.parent_id));
    return result;
  }, [groups]);

  const getDescendantIds = useCallback((groupId) => {
    const ids = new Set([String(groupId)]);
    const queue = [String(groupId)];
    while (queue.length) {
      const cur = queue.shift();
      groups.forEach(g => {
        const pid = String(g.parent_id?._id || g.parent_id || '');
        if (pid === cur) { const sid = String(g._id); if (!ids.has(sid)) { ids.add(sid); queue.push(sid); } }
      });
    }
    return ids;
  }, [groups]);

  const allFiltered = useMemo(() => {
    const normalized = materials.map(normalize);
    const q = search.toLowerCase();
    const descendantIds = filterGroup ? getDescendantIds(filterGroup) : null;

    const base = normalized.filter(m => {
      const matchSearch = !search || m._name.toLowerCase().includes(q) || m._code.toLowerCase().includes(q);
      const matchGroup  = !filterGroup || (m._groupId && descendantIds.has(m._groupId));
      const matchExpiry = filterExpiry === 'all' ? true
        : filterExpiry === 'no_track' ? !m.has_expiry_date
        : m._expiryStatus?.key === filterExpiry;
      return matchSearch && matchGroup && matchExpiry;
    });

    return [...base].sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':   return a._name.localeCompare(b._name, 'vi');
        case 'name_desc':  return b._name.localeCompare(a._name, 'vi');
        case 'stock_asc':  return a._stock - b._stock;
        case 'stock_desc': return b._stock - a._stock;
        case 'value_desc': return (b._stock * b._cost) - (a._stock * a._cost);
        case 'expiry_asc': {
          const da = a._expiry ? new Date(a._expiry) : new Date('9999-01-01');
          const db = b._expiry ? new Date(b._expiry) : new Date('9999-01-01');
          return da - db;
        }
        default: return 0;
      }
    });
  }, [materials, search, filterGroup, filterExpiry, sortBy, getDescendantIds, threshold]);

  const totalPages = Math.max(1, Math.ceil(allFiltered.length / PAGE_SIZE));
  const paginated  = allFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Stats
  const outOfStock   = allFiltered.filter(m => m._stock === 0).length;
  const lowStock     = allFiltered.filter(m => m._stock > 0 && m._stock < threshold).length;
  const expiredCount = allFiltered.filter(m => m._expiryStatus?.key === 'expired').length;
  const expiringCount= allFiltered.filter(m => m._expiryStatus?.key === 'expiring').length;
  const totalValue   = allFiltered.reduce((s, m) => s + m._stock * m._cost, 0);

  const clearGroup = () => { setFilterGroup(''); setFilterGroupName(''); setPage(1); };

  return (
    <div className="view">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Tồn Kho</div>
          <div className="page-subtitle">{allFiltered.length}/{materials.length} vật tư</div>
        </div>
        <button className="btn btn-secondary" onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <ArrowClockwise size={14} /> Làm mới
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.875rem', marginBottom: '1.5rem' }}>
        {/* Total */}
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: 'var(--accent)', borderRadius: '12px 0 0 12px' }} />
          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Tổng vật tư</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-1)' }}>{allFiltered.length}</div>
        </div>
        {/* Out of stock */}
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: '#f87171', borderRadius: '12px 0 0 12px' }} />
          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Hết hàng</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f87171' }}>{outOfStock}</div>
        </div>
        {/* Expiry alert */}
        <div style={{ background: 'var(--bg-2)', border: `1px solid ${expiredCount > 0 ? 'rgba(248,113,113,0.3)' : expiringCount > 0 ? 'rgba(251,191,36,0.3)' : 'var(--border)'}`, borderRadius: 12, padding: '1rem 1.25rem', position: 'relative', overflow: 'hidden', cursor: expiredCount + expiringCount > 0 ? 'pointer' : 'default' }}
          onClick={() => expiredCount > 0 ? setFilterExpiry('expired') : expiringCount > 0 ? setFilterExpiry('expiring') : null}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: expiredCount > 0 ? '#f87171' : '#fbbf24', borderRadius: '12px 0 0 12px' }} />
          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CalendarX size={11} /> HSD
            <button onClick={e => { e.stopPropagation(); setThresholdInput(String(threshold)); setEditThreshold(v => !v); }}
              style={{ marginLeft: 'auto', fontSize: '0.65rem', padding: '0.1rem 0.35rem', border: '1px solid var(--border)', borderRadius: 4, background: 'transparent', color: 'var(--text-3)', cursor: 'pointer', fontFamily: 'var(--font)' }}>
              &lt;{threshold}d
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
            {expiredCount > 0 && <span style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f87171' }}>{expiredCount}</span>}
            {expiringCount > 0 && <span style={{ fontSize: expiredCount > 0 ? '1rem' : '1.6rem', fontWeight: 700, color: '#fbbf24' }}>{expiringCount}</span>}
            {expiredCount === 0 && expiringCount === 0 && <span style={{ fontSize: '1.6rem', fontWeight: 700, color: '#4ade80' }}>0</span>}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: 2 }}>
            {expiredCount > 0 ? `${expiredCount} hết hạn` : ''}{expiredCount > 0 && expiringCount > 0 ? ' · ' : ''}{expiringCount > 0 ? `${expiringCount} sắp hết` : ''}{expiredCount === 0 && expiringCount === 0 ? 'Tốt' : ''}
          </div>
          {/* Threshold popover */}
          {editThreshold && (
            <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 100, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.75rem', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', marginTop: 4, minWidth: 220, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
              onClick={e => e.stopPropagation()}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)' }}>Cảnh báo khi HSD dưới:</span>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <input className="input" type="number" min={1} max={365} value={thresholdInput} onChange={e => setThresholdInput(e.target.value)} style={{ width: 70, textAlign: 'center' }} autoFocus />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>ngày</span>
                <button className="btn btn-primary" style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                  onClick={() => { const v = Number(thresholdInput); if (v > 0) { setThreshold(v); setEditThreshold(false); } }}>Lưu</button>
                <button className="btn btn-secondary" style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }} onClick={() => setEditThreshold(false)}>Huỷ</button>
              </div>
            </div>
          )}
        </div>
        {/* Total value */}
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: '#a78bfa', borderRadius: '12px 0 0 12px' }} />
          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Giá trị tồn kho</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-1)' }}>{formatCurrency(totalValue)}</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: 2 }}>Theo giá vốn</div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="filter-bar" style={{ flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <MagnifyingGlass size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input className="input" style={{ paddingLeft: '2.25rem', width: '100%' }} placeholder="Tìm tên hoặc mã vật tư..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {filterGroupName ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', borderRadius: 8, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)', fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 500, flexShrink: 0 }}>
            <Tag size={13} />{filterGroupName}
            <button onClick={clearGroup} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--accent)', display: 'flex', alignItems: 'center' }}><X size={13} /></button>
          </div>
        ) : (
          <select className="input" style={{ width: 'auto', minWidth: 180, flexShrink: 0 }} value={filterGroup}
            onChange={e => { const g = flatGroupOptions.find(g => g._id === e.target.value); setFilterGroup(e.target.value); setFilterGroupName(g?.name || ''); }}>
            <option value="">Tất cả nhóm</option>
            {flatGroupOptions.map(g => <option key={g._id} value={g._id}>{'　'.repeat(g._depth)}{g._depth > 0 ? '└ ' : ''}{g.name}</option>)}
          </select>
        )}
        <SortDropdown value={sortBy} onChange={setSortBy} />
      </div>

      {/* Expiry filter pills */}
      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {EXPIRY_FILTER_OPTIONS.map(o => {
          const count = o.key === 'all' ? allFiltered.length
            : o.key === 'no_track' ? materials.filter(m => !m.has_expiry_date).length
            : o.key === 'expired'  ? expiredCount
            : o.key === 'expiring' ? expiringCount
            : allFiltered.filter(m => getExpiryStatus(m.nearest_expiry, m.has_expiry_date, threshold)?.key === o.key).length;
          const active = filterExpiry === o.key;
          return (
            <button key={o.key} onClick={() => setFilterExpiry(o.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.3rem 0.75rem', borderRadius: 20, border: '1px solid',
                borderColor: active ? (o.color || 'var(--accent)') : 'var(--border)',
                background: active ? `${o.color || 'var(--accent)'}15` : 'transparent',
                color: active ? (o.color || 'var(--accent)') : 'var(--text-3)',
                fontSize: '0.75rem', fontWeight: active ? 600 : 400,
                cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all 0.15s',
              }}>
              {o.label}
              <span style={{ background: active ? (o.color || 'var(--accent)') : 'var(--border)', color: active ? '#fff' : 'var(--text-3)', borderRadius: 10, padding: '0 0.35rem', fontSize: '0.68rem', fontWeight: 700 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mã / Tên Vật Tư</th>
              <th>Nhóm</th>
              <th>Số Lượng</th>
              <th>HSD Gần Nhất</th>
              <th>Giá Vốn</th>
              <th>Giá Trị</th>
              <th>Trạng Thái</th>
              <th style={{ textAlign: 'right' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i}>{[...Array(8)].map((_, j) => <td key={j}><div style={{ height: 12, background: 'var(--border)', borderRadius: 4 }} /></td>)}</tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                    <Warning size={28} style={{ color: '#f87171' }} />
                    <span style={{ color: '#f87171', fontSize: '0.875rem' }}>{error}</span>
                    <button className="btn btn-primary" onClick={fetchData} style={{ fontSize: '0.8rem' }}><ArrowClockwise size={13} /> Thử lại</button>
                  </div>
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-3)' }}>
                {search || filterGroupName ? 'Không tìm thấy kết quả' : 'Chưa có vật tư nào'}
              </td></tr>
            ) : paginated.map(m => {
              const exSt  = m._expiryStatus;
              const units = m.units || [];
              const base  = units.find(u => u.is_base);
              const biggest = [...units].filter(u => !u.is_base && u.ratio > 1).sort((a, b) => b.ratio - a.ratio)[0];
              const bigQty  = biggest ? Math.floor(m._stock / biggest.ratio) : 0;
              const value   = m._stock * m._cost;
              return (
                <tr key={m._id} style={{ background: exSt?.key === 'expired' ? 'rgba(248,113,113,0.03)' : 'transparent' }}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--accent)', fontFamily: 'monospace', fontSize: '0.78rem' }}>{m._code}</div>
                    <div style={{ fontWeight: 500, color: 'var(--text-1)', fontSize: '0.85rem', marginTop: 2 }}>{m._name}</div>
                  </td>
                  <td>
                    {m._group !== '—'
                      ? <span style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 6, padding: '0.15rem 0.5rem', fontSize: '0.75rem', color: 'var(--accent)' }}>{m._group}</span>
                      : <span style={{ color: 'var(--text-3)' }}>—</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontWeight: 700, color: m._stock === 0 ? '#f87171' : 'var(--text-1)', fontSize: '0.9rem' }}>
                        {biggest && bigQty > 0
                          ? <>{bigQty} <span style={{ color: 'var(--accent)', fontSize: '0.78rem' }}>{biggest.name}</span></>
                          : <>{m._stock} <span style={{ color: 'var(--accent)', fontSize: '0.78rem' }}>{base?.name || ''}</span></>
                        }
                      </span>
                      {biggest && bigQty > 0 && <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>= {m._stock} {base?.name}</span>}
                    </div>
                  </td>
                  {/* HSD column */}
                  <td>
                    {!m.has_expiry_date ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>—</span>
                    ) : !m._expiry ? (
                      <button className="btn btn-secondary" style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                        onClick={() => setBatchTarget(m)}>
                        <Plus size={10} weight="bold" /> Thêm lô
                      </button>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: exSt?.color || 'var(--text-2)' }}>
                          {formatDate(m._expiry)}
                        </span>
                        {exSt?.days !== undefined && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>
                            {exSt.days < 0 ? `Hết hạn ${Math.abs(exSt.days)} ngày trước` : `Còn ${exSt.days} ngày`}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-2)', fontSize: '0.82rem' }}>
                    {m._cost ? formatCurrency(m._cost) : <span style={{ color: 'var(--text-3)' }}>—</span>}
                  </td>
                  <td style={{ fontWeight: 500, color: 'var(--text-1)', fontSize: '0.82rem' }}>
                    {m._cost ? formatCurrency(value) : <span style={{ color: 'var(--text-3)' }}>—</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span className={`badge ${m._stock === 0 ? 'badge-red' : m._stock < threshold ? 'badge-yellow' : 'badge-green'}`}>
                        {m._stock === 0 ? 'Hết hàng' : m._stock < threshold ? 'Sắp hết' : 'Còn đủ'}
                      </span>
                      {exSt && exSt.key !== 'no_batch' && (
                        <span className={`badge ${exSt.cls}`}>{exSt.label}</span>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end' }}>
                      {m.has_expiry_date && (
                        <button className="btn btn-secondary" style={{ padding: '0.3rem 0.55rem', fontSize: '0.72rem' }}
                          title="Quản lý lô hàng / HSD"
                          onClick={() => setBatchTarget(m)}>
                          <CalendarX size={12} />
                        </button>
                      )}
                      <button className="btn btn-secondary" style={{ padding: '0.3rem 0.55rem', fontSize: '0.72rem' }}
                        title="Điều chỉnh tồn kho"
                        onClick={() => setAdjustTarget(m)}>
                        <Lightning size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && allFiltered.length > 0 && (
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--text-3)', paddingTop: '1.25rem' }}>
            Trang {page}/{totalPages} · {allFiltered.length} kết quả
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}

      {adjustTarget && (
        <AdjustModal material={adjustTarget} warehouses={warehouses}
          onClose={() => setAdjustTarget(null)}
          onDone={() => { setAdjustTarget(null); fetchData(); }} />
      )}
      {batchTarget && (
        <BatchPanel material={batchTarget} warehouses={warehouses}
          onClose={() => setBatchTarget(null)}
          onRefresh={fetchData} />
      )}
    </div>
  );
};

export default Inventory;