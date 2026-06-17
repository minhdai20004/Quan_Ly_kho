import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Plus, X, Check, Warning, Trash, PencilSimple,
  MagnifyingGlass, CaretLeft, CaretRight, Package,
  Buildings, Warehouse, CalendarBlank, Note,
  CheckCircle, XCircle, ClockCounterClockwise,
  Printer, Eye, ArrowLeft, CalendarX, Hash,
  CurrencyCircleDollar, CaretDown, CaretUp,
} from '@phosphor-icons/react';
import { createPortal } from 'react-dom';
import api from '../services/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt      = n => new Intl.NumberFormat('vi-VN').format(n || 0);
const fmtMoney = n => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);
const fmtDate  = d => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
const toInputDate = d => d ? new Date(d).toISOString().slice(0, 10) : '';

// ─── Parse API response linh hoạt (handle cả trường hợp api.js đã unwrap) ──
const parseList = (raw) => Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
const parseTotal = (raw) => raw?.pagination?.total ?? raw?.data?.pagination?.total ?? 0;

const STATUS_MAP = {
  draft:     { label: 'Nháp',        cls: 'badge-gray',  icon: <ClockCounterClockwise size={11} weight="bold" /> },
  confirmed: { label: 'Đã xác nhận', cls: 'badge-green', icon: <CheckCircle size={11} weight="bold" /> },
  cancelled: { label: 'Đã huỷ',      cls: 'badge-red',   icon: <XCircle size={11} weight="bold" /> },
};

const PAGE_SIZE = 20;

// ─── Material Autocomplete Cell ───────────────────────────────────────────────
function MaterialCell({ value, materials, onChange, disabled }) {
  const [query,   setQuery]   = useState('');
  const [open,    setOpen]    = useState(false);
  const [focused, setFocused] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef(null);
  const wrapRef  = useRef(null);

  const selected = useMemo(() => materials.find(m => m._id === value), [materials, value]);

  const getName = m => m.material_name || m.product_name || m.name || m.title || '';
  const getCode = m => m.material_code || m.product_code || m.code || m.sku || '';

  const filtered = useMemo(() => {
    if (!query.trim()) return materials.slice(0, 15);
    const q = query.toLowerCase();
    return materials.filter(m =>
      getName(m).toLowerCase().includes(q) ||
      getCode(m).toLowerCase().includes(q)
    ).slice(0, 15);
  }, [query, materials]);

  const updateDropPos = () => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropPos({
      top:   rect.bottom + window.scrollY + 4,
      left:  rect.left + window.scrollX,
      width: Math.max(rect.width, 320),
    });
  };

  const handleFocus = () => { setFocused(true); setQuery(''); setOpen(true); updateDropPos(); };
  const handleChange = e => { setQuery(e.target.value); setOpen(true); updateDropPos(); };
  const handleBlur  = () => { setTimeout(() => { setFocused(false); setOpen(false); }, 200); };
  const handleSelect = mat => { onChange(mat); setOpen(false); setFocused(false); setQuery(''); };

  if (disabled && selected) {
    return (
      <div style={{ fontSize: '0.82rem' }}>
        <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>{getName(selected)}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--accent)', fontFamily: 'monospace' }}>{getCode(selected)}</div>
      </div>
    );
  }

  const displayValue = focused ? query : selected ? getName(selected) : '';

  return (
    <div ref={wrapRef} style={{ position: 'relative', minWidth: 220 }}>
      <div style={{ position: 'relative' }}>
        <MagnifyingGlass size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: focused ? '#38bdf8' : 'var(--text-3)', transition: 'color 0.15s', pointerEvents: 'none' }} />
        <input
          ref={inputRef}
          className="input"
          style={{ paddingLeft: 26, fontSize: '0.82rem', width: '100%', borderColor: focused ? '#38bdf8' : selected ? 'rgba(56,189,248,0.4)' : '', boxShadow: focused ? '0 0 0 2px rgba(56,189,248,0.15)' : '', transition: 'border-color 0.15s, box-shadow 0.15s', background: 'rgba(255,255,255,0.06)', color: '#f0f9ff' }}
          value={displayValue}
          placeholder="Tìm vật tư..."
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          autoComplete="off"
        />
      </div>

      {open && createPortal(
        <div style={{ position: 'absolute', top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999, background: '#0f172a', border: '1px solid rgba(56,189,248,0.25)', borderRadius: 10, boxShadow: '0 20px 60px rgba(0,0,0,0.7)', maxHeight: 280, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '0.875rem', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>Không tìm thấy vật tư</div>
          ) : (
            <>
              <div style={{ padding: '0.4rem 0.875rem 0.3rem', fontSize: '0.65rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(56,189,248,0.08)' }}>
                {query.trim() ? `${filtered.length} kết quả` : `Hiển thị ${filtered.length} / ${materials.length} vật tư`}
              </div>
              {filtered.map(m => (
                <button
                  key={m._id}
                  onMouseDown={e => { e.preventDefault(); handleSelect(m); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.875rem', border: 'none', background: m._id === value ? 'rgba(14,165,233,0.18)' : 'transparent', cursor: 'pointer', textAlign: 'left', gap: '0.5rem', borderBottom: '1px solid rgba(148,163,184,0.06)', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(14,165,233,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.background = m._id === value ? 'rgba(14,165,233,0.18)' : 'transparent'}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 500, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getName(m)}</div>
                    <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontFamily: 'monospace', marginTop: 1 }}>{getCode(m)}</div>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', textAlign: 'right', flexShrink: 0 }}>
                    {m.has_expiry_date && <div style={{ color: '#fbbf24', fontSize: '0.65rem', marginBottom: 1 }}>⏱ HSD</div>}
                    <div>Tồn: <strong style={{ color: '#94a3b8' }}>{fmt(m.totalStock || 0)}</strong></div>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── Receipt Form (Create / Edit) ─────────────────────────────────────────────
function ReceiptForm({ mode, initial, materials, partners, warehouses, onSave, onClose }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    receipt_date: initial?.receipt_date ? toInputDate(initial.receipt_date) : today,
    partner_id:   initial?.partner_id?._id || initial?.partner_id || '',
    warehouse_id: initial?.warehouse_id?._id || initial?.warehouse_id || warehouses[0]?._id || '',
    note:         initial?.note || '',
    items: initial?.items?.length ? initial.items.map(it => ({
      _key:              Math.random().toString(36).slice(2),
      material_id:       it.material_id?._id || it.material_id || '',
      _material:         it.material_id || null,
      quantity:          String(it.quantity || 1),
      quantity_received: String(it.quantity_received || it.quantity || 1),
      unit_cost:         String(it.unit_cost || 0),
      batch_no:          it.batch_no || '',
      manufacture_date:  it.manufacture_date ? toInputDate(it.manufacture_date) : '',
      expiry_date:       it.expiry_date ? toInputDate(it.expiry_date) : '',
      note:              it.note || '',
    })) : [],
  });
  const [saving, setSaving]                 = useState(false);
  const [errors, setErrors]                 = useState({});
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const isDirty = form.items.length > 0 || form.note || form.partner_id;

  const calcExpiry = (mfg, shelfDays) => {
    if (!mfg || !shelfDays) return '';
    const d = new Date(mfg);
    d.setDate(d.getDate() + Number(shelfDays));
    return d.toISOString().slice(0, 10);
  };

  const updateItem = (key, field, val) => {
    setForm(f => ({
      ...f,
      items: f.items.map(it => {
        if (it._key !== key) return it;
        const updated = { ...it, [field]: val };
        if (field === 'manufacture_date' && it._material?.default_shelf_life_days && !it.expiry_date)
          updated.expiry_date = calcExpiry(val, it._material.default_shelf_life_days);
        return updated;
      }),
    }));
  };

  const addItem = () => setForm(f => ({
    ...f,
    items: [...f.items, { _key: Math.random().toString(36).slice(2), material_id: '', _material: null, quantity: '1', quantity_received: '1', unit_cost: '0', batch_no: '', manufacture_date: '', expiry_date: '', note: '' }],
  }));

  const removeItem   = key => setForm(f => ({ ...f, items: f.items.filter(it => it._key !== key) }));
  const selectMaterial = (key, mat) => setForm(f => ({ ...f, items: f.items.map(it => it._key !== key ? it : { ...it, material_id: mat._id, _material: mat }) }));

  const totals = useMemo(() => {
    let qty = 0, cost = 0;
    form.items.forEach(it => {
      const q = Number(it.quantity_received) || Number(it.quantity) || 0;
      qty += q; cost += q * (Number(it.unit_cost) || 0);
    });
    return { qty, cost };
  }, [form.items]);

  const validate = () => {
    const e = {};
    if (!form.warehouse_id) e.warehouse_id = 'Chọn kho nhập';
    if (!form.items.length) e.items = 'Thêm ít nhất 1 dòng hàng';
    form.items.forEach((it, i) => {
      if (!it.material_id) e[`item_${i}`] = 'Chọn vật tư';
      if (it._material?.has_expiry_date && !it.expiry_date) e[`exp_${i}`] = 'Cần nhập HSD';
    });
    return e;
  };

  const handleSave = async (autoConfirm = false) => {
    const e = validate();
    if (Object.keys(e).length) return setErrors(e);
    setSaving(true);
    try {
      const payload = {
        receipt_date: form.receipt_date,
        partner_id:   form.partner_id || undefined,
        warehouse_id: form.warehouse_id,
        note:         form.note,
        items: form.items.map(it => ({
          material_id:       it.material_id,
          quantity:          Number(it.quantity) || 1,
          quantity_received: Number(it.quantity_received) || Number(it.quantity) || 1,
          unit_cost:         Number(it.unit_cost) || 0,
          batch_no:          it.batch_no || '',
          manufacture_date:  it.manufacture_date || null,
          expiry_date:       it.expiry_date || null,
          note:              it.note || '',
        })),
      };

      let receipt;
      if (mode === 'add') {
        const r = await api.post('/inbound-receipts', payload);
        // Handle cả api.js đã unwrap lẫn chưa unwrap
        receipt = r?.data?.data ?? r?.data ?? r;
      } else {
        const r = await api.put(`/inbound-receipts/${initial._id}`, payload);
        receipt = r?.data?.data ?? r?.data ?? r;
      }

      // Luôn refresh list sau khi save thành công (dù confirm có fail hay không)
      if (autoConfirm && receipt?._id) {
        try {
          await api.patch(`/inbound-receipts/${receipt._id}/confirm`);
          onSave(); // close + refresh
        } catch (confirmErr) {
          // Phiếu đã được lưu dạng nháp, chỉ confirm bị lỗi
          const msg = confirmErr.response?.data?.message || confirmErr.message;
          alert(`Lưu phiếu nháp thành công nhưng xác nhận thất bại:\n${msg}`);
          onSave(); // vẫn refresh để hiện phiếu nháp mới tạo
        }
      } else {
        onSave(); // close + refresh
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const baseUnit = mat => mat?.units?.find(u => u.is_base)?.name || mat?.unit || '';

  const S = {
    label:     { fontSize: '0.7rem', fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 },
    fieldWrap: { display: 'flex', flexDirection: 'column' },
  };

  return (
    <div
      onClick={e => { if (e.target !== e.currentTarget) return; if (isDirty) setShowExitConfirm(true); else onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(2,8,23,0.85)', backdropFilter: 'blur(6px)', overflowY: 'auto', padding: '1rem' }}
    >
      <div style={{ width: '96vw', maxWidth: 1200, background: 'linear-gradient(160deg, #0a1628 0%, #0c1e38 60%, #091520 100%)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: 18, boxShadow: '0 0 0 1px rgba(14,165,233,0.08), 0 40px 80px rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', minHeight: '85vh', position: 'relative' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.1rem 1.75rem', background: 'linear-gradient(135deg, rgba(14,165,233,0.18) 0%, rgba(56,189,248,0.06) 100%)', borderBottom: '1px solid rgba(56,189,248,0.15)', borderRadius: '18px 18px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(14,165,233,0.4)' }}>
              <Package size={20} style={{ color: '#fff' }} weight="fill" />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f0f9ff' }}>{mode === 'add' ? 'Tạo Phiếu Nhập Kho' : `Sửa phiếu ${initial?.receipt_code}`}</div>
              <div style={{ fontSize: '0.72rem', color: '#7dd3fc', marginTop: 1 }}>Ghi nhận hàng hoá nhập vào kho</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, cursor: 'pointer', color: '#94a3b8', padding: '0.4rem', display: 'flex', alignItems: 'center' }}><X size={16} /></button>
        </div>

        <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
          {/* Receipt info */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', padding: '1.25rem', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(56,189,248,0.1)' }}>
            <div style={S.fieldWrap}>
              <label style={S.label}><CalendarBlank size={10} /> Ngày nhập</label>
              <input className="input" type="date" value={form.receipt_date} onChange={e => setForm(f => ({ ...f, receipt_date: e.target.value }))} style={{ fontSize: '0.85rem', background: 'rgba(255,255,255,0.06)', color: '#f0f9ff', border: '1px solid rgba(56,189,248,0.2)' }} />
            </div>
            <div style={S.fieldWrap}>
              <label style={S.label}><Buildings size={10} /> Nhà cung cấp</label>
              <select className="input" value={form.partner_id} onChange={e => setForm(f => ({ ...f, partner_id: e.target.value }))} style={{ fontSize: '0.85rem', background: 'rgba(14,30,54,0.9)', color: '#f0f9ff', border: '1px solid rgba(56,189,248,0.2)' }}>
                <option value="">— Không chọn —</option>
                {partners.map(p => <option key={p._id} value={p._id}>{p.name || p.object_name}</option>)}
              </select>
            </div>
            <div style={S.fieldWrap}>
              <label style={S.label}><Warehouse size={10} /> Kho nhập <span style={{ color: '#f87171' }}>*</span></label>
              <select className="input" value={form.warehouse_id} onChange={e => setForm(f => ({ ...f, warehouse_id: e.target.value }))} style={{ fontSize: '0.85rem', background: 'rgba(14,30,54,0.9)', color: '#f0f9ff', border: `1px solid ${errors.warehouse_id ? '#f87171' : 'rgba(56,189,248,0.2)'}` }}>
                <option value="">— Chọn kho —</option>
                {warehouses.map(w => <option key={w._id} value={w._id}>{w.name || w.warehouse_name}</option>)}
              </select>
              {errors.warehouse_id && <span style={{ fontSize: '0.68rem', color: '#f87171', marginTop: 2 }}>{errors.warehouse_id}</span>}
            </div>
            <div style={S.fieldWrap}>
              <label style={S.label}><Note size={10} /> Ghi chú</label>
              <input className="input" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Ghi chú phiếu..." style={{ fontSize: '0.85rem', background: 'rgba(255,255,255,0.06)', color: '#f0f9ff', border: '1px solid rgba(56,189,248,0.2)' }} />
            </div>
          </div>

          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#7dd3fc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={14} style={{ color: '#38bdf8' }} />
                Danh sách hàng hoá
                {form.items.length > 0 && <span style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8', borderRadius: 10, padding: '0 0.45rem', fontSize: '0.72rem' }}>{form.items.length}</span>}
                {errors.items && <span style={{ color: '#f87171', fontWeight: 400, fontSize: '0.75rem' }}>{errors.items}</span>}
              </div>
              <button className="btn btn-primary" style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }} onClick={addItem}><Plus size={13} weight="bold" /> Thêm dòng</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 85px 85px 130px 130px 30px', gap: '0.5rem', padding: '0.5rem 0.875rem', background: 'linear-gradient(135deg, rgba(14,165,233,0.2), rgba(56,189,248,0.08))', borderRadius: 8, border: '1px solid rgba(56,189,248,0.2)', fontSize: '0.65rem', fontWeight: 700, color: '#7dd3fc', textTransform: 'uppercase', letterSpacing: '0.06em', alignItems: 'center' }}>
              <span style={{ textAlign: 'center' }}>#</span>
              <span>Vật tư</span>
              <span style={{ textAlign: 'center' }}>SL đặt</span>
              <span style={{ textAlign: 'center' }}>SL nhận</span>
              <span style={{ textAlign: 'right' }}>Đơn giá (đ)</span>
              <span style={{ textAlign: 'right' }}>Thành tiền</span>
              <span></span>
            </div>

            {form.items.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#475569', fontSize: '0.85rem', border: '2px dashed rgba(56,189,248,0.12)', borderRadius: 10 }}>Chưa có dòng hàng — nhấn "+ Thêm dòng" để bắt đầu</div>
            ) : form.items.map((it, idx) => {
              const mat   = it._material || materials.find(m => m._id === it.material_id);
              const unit  = baseUnit(mat);
              const total = (Number(it.quantity_received) || Number(it.quantity) || 0) * (Number(it.unit_cost) || 0);
              const showHSD = mat?.has_expiry_date;
              const expiryDays = it.expiry_date ? Math.ceil((new Date(it.expiry_date) - new Date()) / (1000*60*60*24)) : null;

              return (
                <div key={it._key} style={{ borderRadius: 10, border: '1px solid rgba(56,189,248,0.12)', background: idx % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'rgba(14,165,233,0.03)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 85px 85px 130px 130px 30px', gap: '0.5rem', padding: '0.625rem 0.875rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: '#475569', textAlign: 'center', fontWeight: 600 }}>{idx + 1}</span>
                    <div>
                      <MaterialCell value={it.material_id} materials={materials} onChange={m => selectMaterial(it._key, m)} />
                      {errors[`item_${idx}`] && <div style={{ fontSize: '0.68rem', color: '#f87171', marginTop: 2 }}>{errors[`item_${idx}`]}</div>}
                    </div>
                    <input className="input" type="number" min={1} value={it.quantity} onChange={e => updateItem(it._key, 'quantity', e.target.value)} style={{ textAlign: 'center', fontSize: '0.85rem', background: 'rgba(255,255,255,0.06)', color: '#f0f9ff', border: '1px solid rgba(56,189,248,0.15)' }} />
                    <input className="input" type="number" min={0} value={it.quantity_received} onChange={e => updateItem(it._key, 'quantity_received', e.target.value)} style={{ textAlign: 'center', fontSize: '0.85rem', background: 'rgba(255,255,255,0.06)', color: '#f0f9ff', border: `1px solid ${it.quantity_received && Number(it.quantity_received) !== Number(it.quantity) ? '#fbbf24' : 'rgba(56,189,248,0.15)'}` }} />
                    <input className="input" type="number" min={0} value={it.unit_cost} onChange={e => updateItem(it._key, 'unit_cost', e.target.value)} style={{ textAlign: 'right', fontSize: '0.85rem', background: 'rgba(255,255,255,0.06)', color: '#f0f9ff', border: '1px solid rgba(56,189,248,0.15)' }} />
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: total > 0 ? '#38bdf8' : '#334155' }}>{total > 0 ? fmtMoney(total) : '—'}</div>
                      {unit && <div style={{ fontSize: '0.65rem', color: '#0ea5e9', marginTop: 1 }}>{unit}</div>}
                    </div>
                    <button onClick={() => removeItem(it._key)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.5}><Trash size={14} /></button>
                  </div>

                  {mat && (
                    <div style={{ padding: '0.625rem 0.875rem 0.75rem', borderTop: '1px dashed rgba(56,189,248,0.12)', background: showHSD ? 'rgba(251,191,36,0.04)' : 'rgba(14,165,233,0.03)', borderRadius: '0 0 10px 10px' }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: showHSD ? '#fbbf24' : '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CalendarX size={10} />
                        {showHSD ? 'Lô hàng & Hạn sử dụng (bắt buộc)' : 'Lô hàng & Hạn sử dụng (tuỳ chọn)'}
                        {showHSD && <span style={{ color: '#f87171' }}>*</span>}
                        {mat.default_shelf_life_days && <span style={{ color: '#94a3b8', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>· Tuổi thọ mặc định: {mat.default_shelf_life_days} ngày</span>}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '180px 140px 160px 1fr', gap: '0.75rem', alignItems: 'end' }}>
                        <div style={S.fieldWrap}>
                          <label style={{ ...S.label, color: '#64748b' }}><Hash size={9} /> Số lô</label>
                          <input className="input" value={it.batch_no} onChange={e => updateItem(it._key, 'batch_no', e.target.value)} placeholder="Tự sinh nếu trống" style={{ fontSize: '0.78rem', fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', border: '1px solid rgba(100,116,139,0.3)', padding: '0.35rem 0.5rem' }} />
                        </div>
                        <div style={S.fieldWrap}>
                          <label style={{ ...S.label, color: '#64748b' }}>NSX</label>
                          <input className="input" type="date" value={it.manufacture_date} onChange={e => updateItem(it._key, 'manufacture_date', e.target.value)} style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', border: '1px solid rgba(100,116,139,0.3)', padding: '0.35rem 0.5rem' }} />
                        </div>
                        <div style={S.fieldWrap}>
                          <label style={{ ...S.label, color: showHSD ? '#fbbf24' : '#64748b' }}>HSD {showHSD && <span style={{ color: '#f87171' }}>*</span>}</label>
                          <input className="input" type="date" value={it.expiry_date} onChange={e => updateItem(it._key, 'expiry_date', e.target.value)} style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', border: `1px solid ${errors[`exp_${idx}`] ? '#f87171' : showHSD ? 'rgba(251,191,36,0.4)' : 'rgba(100,116,139,0.3)'}`, padding: '0.35rem 0.5rem' }} />
                          {expiryDays !== null && <span style={{ fontSize: '0.65rem', marginTop: 2, color: expiryDays < 0 ? '#f87171' : expiryDays <= 30 ? '#fbbf24' : '#4ade80' }}>{expiryDays < 0 ? '⚠ Đã hết hạn!' : `Còn ${expiryDays} ngày`}</span>}
                          {errors[`exp_${idx}`] && <span style={{ fontSize: '0.65rem', color: '#f87171', marginTop: 2 }}>{errors[`exp_${idx}`]}</span>}
                        </div>
                        <div style={S.fieldWrap}>
                          <label style={{ ...S.label, color: '#64748b' }}>Ghi chú dòng</label>
                          <input className="input" value={it.note} onChange={e => updateItem(it._key, 'note', e.target.value)} placeholder="Ghi chú cho dòng này..." style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', border: '1px solid rgba(100,116,139,0.3)', padding: '0.35rem 0.5rem' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {form.items.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ minWidth: 300, padding: '1rem 1.25rem', borderRadius: 12, background: 'linear-gradient(135deg, rgba(14,165,233,0.12), rgba(56,189,248,0.06))', border: '1px solid rgba(56,189,248,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                    <span>Tổng số lượng</span>
                    <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{fmt(totals.qty)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(56,189,248,0.15)' }}>
                    <span style={{ fontWeight: 700, color: '#7dd3fc' }}>Tổng tiền</span>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#38bdf8' }}>{fmtMoney(totals.cost)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Exit Confirm Dialog */}
        {showExitConfirm && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(2,8,23,0.75)', backdropFilter: 'blur(4px)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'linear-gradient(160deg, #0a1628, #0c1e38)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: 16, padding: '2rem 2.25rem', maxWidth: 380, width: '90%', boxShadow: '0 24px 64px rgba(0,0,0,0.7)', textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, margin: '0 auto 1.25rem', background: 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(14,165,233,0.1))', border: '1px solid rgba(56,189,248,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Note size={22} style={{ color: '#38bdf8' }} weight="duotone" />
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f0f9ff', marginBottom: '0.5rem' }}>Lưu vào bản nháp?</div>
              <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.55, marginBottom: '1.75rem' }}>Phiếu chưa được xác nhận. Bạn có muốn lưu lại để tiếp tục sau không?</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button onClick={async () => { setShowExitConfirm(false); await handleSave(false); }} disabled={saving} style={{ padding: '0.65rem 1rem', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: '#fff', fontSize: '0.85rem', fontWeight: 700, fontFamily: 'var(--font)', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}><ClockCounterClockwise size={14} weight="bold" />{saving ? 'Đang lưu...' : 'Lưu bản nháp'}</span>
                </button>
                <button onClick={() => { setShowExitConfirm(false); onClose(); }} style={{ padding: '0.6rem 1rem', borderRadius: 10, border: '1px solid rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.06)', color: '#f87171', fontSize: '0.82rem', fontWeight: 600, fontFamily: 'var(--font)', cursor: 'pointer' }}>Bỏ qua, đóng lại</button>
                <button onClick={() => setShowExitConfirm(false)} style={{ padding: '0.5rem 1rem', borderRadius: 10, border: 'none', background: 'transparent', color: '#475569', fontSize: '0.78rem', fontFamily: 'var(--font)', cursor: 'pointer' }}>Tiếp tục chỉnh sửa</button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.75rem', borderTop: '1px solid rgba(56,189,248,0.12)', background: 'rgba(14,165,233,0.04)', borderRadius: '0 0 18px 18px' }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ color: '#94a3b8' }}><ArrowLeft size={13} /> Đóng</button>
          <div style={{ display: 'flex', gap: '0.625rem' }}>
            <button onClick={() => handleSave(false)} disabled={saving} className="btn btn-secondary" style={{ opacity: saving ? 0.7 : 1, color: '#7dd3fc', border: '1px solid rgba(56,189,248,0.3)' }}>
              <ClockCounterClockwise size={13} />{saving ? 'Đang lưu...' : 'Lưu nháp'}
            </button>
            <button onClick={() => handleSave(true)} disabled={saving} className="btn btn-primary" style={{ opacity: saving ? 0.7 : 1, background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', boxShadow: '0 4px 12px rgba(14,165,233,0.35)' }}>
              <CheckCircle size={13} weight="fill" />{saving ? 'Đang xử lý...' : 'Lưu & Xác nhận'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Receipt Detail Modal ─────────────────────────────────────────────────────
function ReceiptDetail({ receipt, onClose }) {
  const st        = STATUS_MAP[receipt.status] || STATUS_MAP.draft;
  const partner   = receipt.partner_id;
  const warehouse = receipt.warehouse_id;

  // FIX: handleOutsideClick đã được định nghĩa đúng chỗ
  const handleOutsideClick = e => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div onClick={handleOutsideClick} style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(2,6,23,0.8)', backdropFilter: 'blur(4px)', overflowY: 'auto', padding: '1.5rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 820, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: '0 32px 64px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', fontFamily: 'monospace' }}>{receipt.receipt_code}</span>
            <span className={`badge ${st.cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>{st.icon}{st.label}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}><X size={16} /></button>
        </div>

        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
            {[
              { label: 'Ngày nhập',    value: fmtDate(receipt.receipt_date || receipt.created_at) },
              { label: 'Nhà cung cấp', value: partner?.name || partner?.object_name || '—' },
              { label: 'Kho nhập',     value: warehouse?.name || warehouse?.warehouse_name || '—' },
              { label: 'Ghi chú',      value: receipt.note || '—' },
            ].map(f => (
              <div key={f.label} style={{ background: 'var(--bg-3, rgba(148,163,184,0.06))', borderRadius: 8, padding: '0.625rem 0.875rem' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>{f.label}</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-2)' }}>{f.value}</div>
              </div>
            ))}
          </div>

          <div className="table-wrap" style={{ margin: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Vật tư</th>
                  <th style={{ textAlign: 'center' }}>SL đặt</th>
                  <th style={{ textAlign: 'center' }}>SL nhận</th>
                  <th style={{ textAlign: 'right' }}>Đơn giá</th>
                  <th style={{ textAlign: 'right' }}>Thành tiền</th>
                  <th>Lô / HSD</th>
                </tr>
              </thead>
              <tbody>
                {receipt.items?.map((it, i) => {
                  const mat   = it.material_id;
                  const name  = mat?.product_name || mat?.material_name || '—';
                  const code  = mat?.product_code || mat?.material_code || '';
                  const total = (it.quantity_received || it.quantity || 0) * (it.unit_cost || 0);
                  const days  = it.expiry_date ? Math.ceil((new Date(it.expiry_date) - new Date()) / (1000*60*60*24)) : null;
                  return (
                    <tr key={i}>
                      <td style={{ color: 'var(--text-3)', fontSize: '0.78rem' }}>{i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--text-1)', fontSize: '0.85rem' }}>{name}</div>
                        {code && <div style={{ fontSize: '0.72rem', color: 'var(--accent)', fontFamily: 'monospace' }}>{code}</div>}
                        {it.note && <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{it.note}</div>}
                      </td>
                      <td style={{ textAlign: 'center', color: 'var(--text-2)' }}>{fmt(it.quantity)}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: it.quantity_received < it.quantity ? '#fbbf24' : 'var(--text-1)' }}>
                        {fmt(it.quantity_received || it.quantity)}
                        {it.quantity_received < it.quantity && <div style={{ fontSize: '0.65rem', color: '#fbbf24' }}>Thiếu {fmt(it.quantity - it.quantity_received)}</div>}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-2)', fontSize: '0.82rem' }}>{fmtMoney(it.unit_cost)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-1)', fontSize: '0.85rem' }}>{fmtMoney(total)}</td>
                      <td>
                        {it.batch_no && <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--accent)' }}>{it.batch_no}</div>}
                        {it.manufacture_date && <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>NSX: {fmtDate(it.manufacture_date)}</div>}
                        {it.expiry_date && <div style={{ fontSize: '0.72rem', fontWeight: 500, color: days < 0 ? '#f87171' : days < 30 ? '#fbbf24' : '#4ade80' }}>HSD: {fmtDate(it.expiry_date)}{days !== null && <span style={{ marginLeft: 4, fontSize: '0.65rem' }}>({days < 0 ? 'HH' : `${days}d`})</span>}</div>}
                        {!it.batch_no && !it.expiry_date && <span style={{ color: 'var(--text-3)', fontSize: '0.75rem' }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', minWidth: 260, padding: '0.875rem 1.25rem', borderRadius: 10, background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-3)' }}>
                <span>Tổng số lượng</span><span style={{ fontWeight: 600, color: 'var(--text-2)' }}>{fmt(receipt.total_quantity)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-3)', paddingTop: '0.375rem', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 600 }}>Tổng tiền</span>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--accent)' }}>{fmtMoney(receipt.total_cost)}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Tạo bởi', val: receipt.created_by, date: receipt.created_at },
              receipt.confirmed_by && { label: 'Xác nhận bởi', val: receipt.confirmed_by },
              receipt.cancelled_by && { label: 'Huỷ bởi', val: receipt.cancelled_by },
            ].filter(Boolean).map(a => (
              <div key={a.label} style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>
                {a.label}: <strong style={{ color: 'var(--text-2)' }}>{a.val}</strong>
                {a.date && <span style={{ marginLeft: 4 }}>· {fmtDate(a.date)}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const InboundReceipts = ({ user }) => {
  const [receipts,     setReceipts]     = useState([]);
  const [materials,    setMaterials]    = useState([]);
  const [partners,     setPartners]     = useState([]);
  const [warehouses,   setWarehouses]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page,         setPage]         = useState(1);
  const [total,        setTotal]        = useState(0);
  const [modal,        setModal]        = useState(null);
  const isAdmin = user?.role === 'admin';

  const fetchAllMaterials = async () => {
    try {
      const CHUNK = 100;
      const first = await api.get(`/materials?limit=${CHUNK}&page=1`);
      const raw = first; // api.js returns parsed JSON directly
      const firstData = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
      const totalMat  = raw?.pagination?.total ?? raw?.total ?? firstData.length;
      if (totalMat <= CHUNK || firstData.length === 0) return firstData;
      const totalPages = Math.ceil(totalMat / CHUNK);
      const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) =>
          api.get(`/materials?limit=${CHUNK}&page=${i + 2}`)
        )
      );
      return [
        ...firstData,
        ...rest.flatMap(r => {
          const d = r.data?.data ?? r.data ?? r ?? [];
          return Array.isArray(d) ? d : [];
        }),
      ];
    } catch (err) {
      console.error('[Materials fetch error]', err);
      return [];
    }
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: PAGE_SIZE });
      if (search)       params.set('search', search);
      if (filterStatus) params.set('status', filterStatus);

      const [rRes, allMats, pRes, wRes] = await Promise.allSettled([
        api.get(`/inbound-receipts?${params}`),
        fetchAllMaterials(),
        api.get('/partners').catch(() => ({ data: [] })),
        api.get('/warehouses').catch(() => ({ data: [] })),
      ]);

      if (rRes.status === 'fulfilled') {
        // FIX: handle cả api.js đã unwrap (rRes.value = {data:[], pagination:{}})
        // lẫn chưa unwrap (rRes.value = {data: {data:[], pagination:{}}})
        const raw = rRes.value; // api.js returns parsed JSON directly
        setReceipts(parseList(raw));
        setTotal(parseTotal(raw));
      } else {
        console.error('[Receipts error]', rRes.reason?.response?.data || rRes.reason?.message);
        setReceipts([]);
      }

      if (allMats.status === 'fulfilled') setMaterials(allMats.value);

      if (pRes.status === 'fulfilled') {
        const pRaw = pRes.value?.data ?? pRes.value;
        setPartners(Array.isArray(pRaw?.data) ? pRaw.data : Array.isArray(pRaw) ? pRaw : []);
      }

      if (wRes.status === 'fulfilled') {
        const wRaw = wRes.value?.data ?? wRes.value;
        setWarehouses(Array.isArray(wRaw?.data) ? wRaw.data : Array.isArray(wRaw) ? wRaw : []);
      }
    } catch (err) {
      console.error('fetchAll error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { setPage(1); }, [search, filterStatus]);

  const handleConfirm = async (id, code) => {
    if (!window.confirm(`Xác nhận phiếu ${code}? Tồn kho sẽ được cộng sau khi xác nhận.`)) return;
    try { await api.patch(`/inbound-receipts/${id}/confirm`); fetchAll(); }
    catch (err) { alert(err.response?.data?.message || err.message); }
  };

  const handleCancel = async (id, code) => {
    if (!window.confirm(`Huỷ phiếu ${code}?`)) return;
    try { await api.patch(`/inbound-receipts/${id}/cancel`); fetchAll(); }
    catch (err) { alert(err.response?.data?.message || err.message); }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Xóa phiếu nháp ${code}?`)) return;
    try { await api.delete(`/inbound-receipts/${id}`); fetchAll(); }
    catch (err) { alert(err.message); }
  };

  const openDetail = async id => {
    try {
      const r = await api.get(`/inbound-receipts/${id}`);
      const data = r?.data?.data ?? r?.data ?? r;
      setModal({ type: 'detail', data });
    } catch (err) { alert(err.message); }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="view">
      <div className="page-header">
        <div>
          <div className="page-title">Nhập Kho</div>
          <div className="page-subtitle">{total} phiếu nhập</div>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setModal({ type: 'form', data: null })}>
            <Plus size={14} weight="bold" /> Tạo Phiếu Nhập
          </button>
        )}
      </div>

      <div className="filter-bar" style={{ gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <MagnifyingGlass size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input className="input" style={{ paddingLeft: '2.25rem', width: '100%' }} placeholder="Tìm mã phiếu..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          {[
            { key: '',          label: 'Tất cả' },
            { key: 'draft',     label: 'Nháp',        color: 'var(--text-3)' },
            { key: 'confirmed', label: 'Đã xác nhận', color: '#4ade80' },
            { key: 'cancelled', label: 'Đã huỷ',      color: '#f87171' },
          ].map(o => (
            <button key={o.key} onClick={() => setFilterStatus(o.key)} style={{ padding: '0.3rem 0.75rem', borderRadius: 20, border: '1px solid', borderColor: filterStatus === o.key ? (o.color || 'var(--accent)') : 'var(--border)', background: filterStatus === o.key ? `${o.color || 'var(--accent)'}15` : 'transparent', color: filterStatus === o.key ? (o.color || 'var(--accent)') : 'var(--text-3)', fontSize: '0.75rem', fontWeight: filterStatus === o.key ? 600 : 400, cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all 0.15s' }}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mã phiếu</th><th>Ngày nhập</th><th>Nhà cung cấp</th><th>Kho nhập</th>
              <th style={{ textAlign: 'center' }}>Số mặt hàng</th>
              <th style={{ textAlign: 'right' }}>Tổng tiền</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i}>{[...Array(8)].map((_, j) => <td key={j}><div style={{ height: 12, background: 'var(--border)', borderRadius: 4 }} /></td>)}</tr>
              ))
            ) : receipts.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-3)' }}>Chưa có phiếu nhập nào</td></tr>
            ) : receipts.map(r => {
              const st        = STATUS_MAP[r.status] || STATUS_MAP.draft;
              const partner   = r.partner_id;
              const warehouse = r.warehouse_id;
              return (
                <tr key={r._id}>
                  <td><span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)', fontSize: '0.82rem' }}>{r.receipt_code}</span></td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-2)' }}>{fmtDate(r.receipt_date || r.created_at)}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-2)' }}>{partner?.name || partner?.object_name || <span style={{ color: 'var(--text-3)' }}>—</span>}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-2)' }}>{warehouse?.name || warehouse?.warehouse_name || '—'}</td>
                  <td style={{ textAlign: 'center', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-1)' }}>{r.items?.length || 0}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-1)', fontSize: '0.85rem' }}>{fmtMoney(r.total_cost)}</td>
                  <td><span className={`badge ${st.cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>{st.icon}{st.label}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.3rem 0.55rem', fontSize: '0.72rem' }} title="Xem chi tiết" onClick={() => openDetail(r._id)}><Eye size={12} /></button>
                      {isAdmin && r.status === 'draft' && (
                        <>
                          <button className="btn btn-secondary" style={{ padding: '0.3rem 0.55rem', fontSize: '0.72rem' }} title="Sửa phiếu"
                            onClick={async () => { const res = await api.get(`/inbound-receipts/${r._id}`); const d = res?.data?.data ?? res?.data ?? res; setModal({ type: 'form', data: d }); }}>
                            <PencilSimple size={12} />
                          </button>
                          <button className="btn btn-primary" style={{ padding: '0.3rem 0.55rem', fontSize: '0.72rem' }} title="Xác nhận phiếu" onClick={() => handleConfirm(r._id, r.receipt_code)}><CheckCircle size={12} weight="fill" /></button>
                          <button className="btn btn-secondary" style={{ padding: '0.3rem 0.55rem', fontSize: '0.72rem' }} title="Huỷ phiếu" onClick={() => handleCancel(r._id, r.receipt_code)}><XCircle size={12} /></button>
                          <button className="btn btn-danger" style={{ padding: '0.3rem 0.55rem', fontSize: '0.72rem' }} title="Xóa phiếu nháp" onClick={() => handleDelete(r._id, r.receipt_code)}><Trash size={12} /></button>
                        </>
                      )}
                      {isAdmin && r.status === 'confirmed' && (
                        <button className="btn btn-secondary" style={{ padding: '0.3rem 0.55rem', fontSize: '0.72rem' }} title="Huỷ phiếu đã xác nhận" onClick={() => handleCancel(r._id, r.receipt_code)}><XCircle size={12} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!loading && total > PAGE_SIZE && (
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--text-3)', paddingTop: '1.25rem' }}>
            Trang {page}/{totalPages} · {total} phiếu
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.3rem', padding: '1.25rem 0 0.5rem' }}>
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="btn btn-secondary" style={{ padding: '0.3rem 0.5rem', opacity: page === 1 ? 0.4 : 1 }}><CaretLeft size={13} weight="bold" /></button>
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const p = i + 1;
              return <button key={p} onClick={() => setPage(p)} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: p === page ? 700 : 400, fontFamily: 'var(--font)', background: p === page ? 'var(--accent)' : 'transparent', color: p === page ? '#fff' : 'var(--text-3)' }}>{p}</button>;
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="btn btn-secondary" style={{ padding: '0.3rem 0.5rem', opacity: page === totalPages ? 0.4 : 1 }}><CaretRight size={13} weight="bold" /></button>
          </div>
        </div>
      )}

      {modal?.type === 'form' && (
        <ReceiptForm mode={modal.data ? 'edit' : 'add'} initial={modal.data} materials={materials} partners={partners} warehouses={warehouses} onSave={() => { setModal(null); fetchAll(); }} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'detail' && modal.data && (
        <ReceiptDetail receipt={modal.data} onClose={() => setModal(null)} />
      )}
    </div>
  );
};

export default InboundReceipts;