// ================================================================
//  WMS — LUXURY INBOUND RECEIPTS  v3.1  (+ auto-fill purchase_price)
//  Paste to: src/views/InboundReceipts.jsx
// ================================================================
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Plus, X, Check, Warning, Trash, PencilSimple,
  MagnifyingGlass, CaretLeft, CaretRight, Package,
  Buildings, Warehouse, CalendarBlank, Note,
  CheckCircle, XCircle, ClockCounterClockwise,
  Eye, ArrowLeft, CalendarX, Hash,
  CurrencyCircleDollar, ArrowsClockwise, Tag,
} from '@phosphor-icons/react';
import { createPortal } from 'react-dom';
import api from '../services/api';

/* ─── Helpers ────────────────────────────────────────────────── */
const fmt      = n => new Intl.NumberFormat('vi-VN').format(n || 0);
const fmtMoney = n => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);
const fmtDate  = d => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
const toInputDate = d => d ? new Date(d).toISOString().slice(0, 10) : '';
const parseList  = (raw) => Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
const parseTotal = (raw) => raw?.pagination?.total ?? raw?.data?.pagination?.total ?? 0;

/* ─── Design tokens ─────────────────────────────────────────── */
const C = {
  pink:    '#be185d', pinkD: '#9d174d', pinkL: '#fce7f3',
  sky:     '#0284c7', skyL:  '#e0f2fe', skyM:  '#38bdf8',
  green:   '#059669', greenL: '#d1fae5',
  red:     '#dc2626', redL:   '#fee2e2',
  amber:   '#d97706', amberL: '#fef3c7',
  purple:  '#7c3aed', purpleL:'#ede9fe',
  gray:    '#64748b', grayL:  '#f1f5f9',
  bg:      '#f0f4f8', surface: '#ffffff',
  border:  '#e2e8f0', border2: '#f1f5f9',
  text1:   '#1e293b', text2: '#475569', text3: '#94a3b8',
};

const STATUS_MAP = {
  draft:     { label: 'Nháp',        color: C.gray,  bg: C.grayL,  border: '#e2e8f0',                    Icon: ClockCounterClockwise },
  confirmed: { label: 'Đã xác nhận', color: C.green, bg: C.greenL, border: 'rgba(5,150,105,0.25)',        Icon: CheckCircle },
  cancelled: { label: 'Đã huỷ',      color: C.red,   bg: C.redL,   border: 'rgba(220,38,38,0.25)',        Icon: XCircle },
};

const PAGE_SIZE = 20;

/* ─── Status Badge ───────────────────────────────────────────── */
function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.draft;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:8, fontSize:11, fontWeight:700, letterSpacing:'0.3px', background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>
      <s.Icon size={11} weight="bold"/>{s.label}
    </span>
  );
}

/* ─── Shimmer ────────────────────────────────────────────────── */
const Skel = ({ w='100%', h=13, r=6 }) => (
  <div style={{ width:w, height:h, borderRadius:r, background:'linear-gradient(90deg,#f1f5f9 25%,#e8edf3 50%,#f1f5f9 75%)', backgroundSize:'200% 100%', animation:'ib-shimmer 1.5s ease-in-out infinite' }}/>
);

/* ─── Input base style ───────────────────────────────────────── */
const inputSx = (err) => ({
  width:'100%', padding:'8px 12px',
  border:`1.5px solid ${err ? C.red : C.border}`,
  borderRadius:10, background:C.surface,
  fontFamily:'Outfit, sans-serif', fontSize:13.5,
  color:C.text1, outline:'none',
  transition:'border-color 0.2s, box-shadow 0.2s',
  boxSizing:'border-box',
  boxShadow: err ? `0 0 0 3px rgba(220,38,38,0.10)` : 'none',
});

/* ─── MaterialCell (Autocomplete + purchase_price hint) ──────── */
function MaterialCell({ value, materials, onChange, disabled }) {
  const [query,   setQuery]   = useState('');
  const [open,    setOpen]    = useState(false);
  const [focused, setFocused] = useState(false);
  const [dropPos, setDropPos] = useState({ top:0, left:0, width:0 });
  const inputRef = useRef(null);

  const selected = useMemo(() => materials.find(m => m._id === value), [materials, value]);
  const getName  = m => m.material_name || m.product_name || m.name || '';
  const getCode  = m => m.material_code || m.product_code || m.code || '';

  const filtered = useMemo(() => {
    if (!query.trim()) return materials.slice(0, 15);
    const q = query.toLowerCase();
    return materials.filter(m => getName(m).toLowerCase().includes(q) || getCode(m).toLowerCase().includes(q)).slice(0, 15);
  }, [query, materials]);

  const updateDropPos = () => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: Math.max(rect.width, 360) });
  };

  const handleFocus  = () => { setFocused(true); setQuery(''); setOpen(true); updateDropPos(); };
  const handleChange = e => { setQuery(e.target.value); setOpen(true); updateDropPos(); };
  const handleBlur   = () => { setTimeout(() => { setFocused(false); setOpen(false); }, 200); };
  const handleSelect = mat => { onChange(mat); setOpen(false); setFocused(false); setQuery(''); };

  if (disabled && selected) {
    return (
      <div>
        <div style={{ fontSize:13.5, fontWeight:600, color:C.text1 }}>{getName(selected)}</div>
        <div style={{ fontSize:11.5, color:C.sky, fontFamily:'JetBrains Mono, monospace', marginTop:1 }}>{getCode(selected)}</div>
      </div>
    );
  }

  const displayValue = focused ? query : selected ? getName(selected) : '';

  return (
    <div style={{ position:'relative', minWidth:220 }}>
      <div style={{ position:'relative' }}>
        <MagnifyingGlass size={13} color={focused ? C.sky : C.text3}
          style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', transition:'color 0.15s' }}/>
        <input
          ref={inputRef}
          value={displayValue}
          placeholder="Tìm vật tư..."
          onFocus={handleFocus} onBlur={handleBlur} onChange={handleChange}
          autoComplete="off"
          style={{ ...inputSx(false), paddingLeft:32, fontSize:13,
            borderColor: focused ? C.sky : selected ? 'rgba(2,132,199,0.35)' : C.border,
            boxShadow:   focused ? `0 0 0 3px rgba(2,132,199,0.12)` : 'none' }}
        />
      </div>

      {open && createPortal(
        <div style={{ position:'absolute', top:dropPos.top, left:dropPos.left, width:dropPos.width, zIndex:9999, background:C.surface, border:`1.5px solid rgba(2,132,199,0.25)`, borderRadius:14, boxShadow:'0 16px 48px rgba(0,0,0,0.14)', maxHeight:300, overflowY:'auto', animation:'ib-fadein 0.15s ease' }}>
          <div style={{ padding:'8px 14px 6px', fontSize:10.5, color:C.text3, fontWeight:700, letterSpacing:'0.5px', textTransform:'uppercase', borderBottom:`1px solid ${C.border2}` }}>
            {query.trim() ? `${filtered.length} kết quả` : `${filtered.length} / ${materials.length} vật tư`}
          </div>
          {filtered.length === 0
            ? <div style={{ padding:'16px', fontSize:13, color:C.text3, textAlign:'center' }}>Không tìm thấy vật tư</div>
            : filtered.map(m => (
              <button key={m._id} onMouseDown={e => { e.preventDefault(); handleSelect(m); }}
                style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 14px', border:'none', background: m._id===value ? C.skyL : 'transparent', cursor:'pointer', textAlign:'left', gap:8, borderBottom:`1px solid ${C.border2}`, transition:'background 0.1s' }}
                onMouseEnter={e => { if (m._id!==value) e.currentTarget.style.background='#f8fafc'; }}
                onMouseLeave={e => { if (m._id!==value) e.currentTarget.style.background='transparent'; }}>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:C.text1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{getName(m)}</div>
                  <div style={{ fontSize:11, color:C.sky, fontFamily:'JetBrains Mono, monospace', marginTop:1 }}>{getCode(m)}</div>
                </div>
                <div style={{ fontSize:11, color:C.text3, textAlign:'right', flexShrink:0 }}>
                  {m.has_expiry_date && <div style={{ color:C.amber, fontSize:10, marginBottom:2 }}>⏱ HSD</div>}
                  <div>Tồn: <strong style={{ color:C.text2 }}>{fmt(m.totalStock || 0)}</strong></div>
                  {/* ✅ Hiện giá mua tham khảo trong dropdown */}
                  {(m.purchase_price||0) > 0 && (
                    <div style={{ color:C.purple, fontWeight:700, marginTop:1 }}>
                      Mua: {fmt(m.purchase_price)}₫
                    </div>
                  )}
                </div>
              </button>
            ))
          }
        </div>,
        document.body
      )}
    </div>
  );
}

/* ─── ReceiptForm ────────────────────────────────────────────── */
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
  const [saving, setSaving]           = useState(false);
  const [errors, setErrors]           = useState({});
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const isDirty = form.items.length > 0 || form.note || form.partner_id;

  const calcExpiry = (mfg, shelfDays) => {
    if (!mfg || !shelfDays) return '';
    const d = new Date(mfg); d.setDate(d.getDate() + Number(shelfDays));
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
    items: [...f.items, {
      _key: Math.random().toString(36).slice(2),
      material_id:'', _material:null,
      quantity:'1', quantity_received:'1', unit_cost:'0',
      batch_no:'', manufacture_date:'', expiry_date:'', note:'',
    }]
  }));

  const removeItem = key => setForm(f => ({ ...f, items: f.items.filter(it => it._key !== key) }));

  // ✅ Auto-fill unit_cost từ purchase_price khi chọn vật tư
  const selectMaterial = (key, mat) => setForm(f => ({
    ...f,
    items: f.items.map(it => it._key !== key ? it : {
      ...it,
      material_id: mat._id,
      _material:   mat,
      unit_cost:   String(mat.purchase_price || 0), // auto-fill giá mua
    }),
  }));

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
        receipt = r?.data?.data ?? r?.data ?? r;
      } else {
        const r = await api.put(`/inbound-receipts/${initial._id}`, payload);
        receipt = r?.data?.data ?? r?.data ?? r;
      }
      if (autoConfirm && receipt?._id) {
        try { await api.patch(`/inbound-receipts/${receipt._id}/confirm`); onSave(); }
        catch (confirmErr) { alert(`Lưu nháp OK, xác nhận lỗi:\n${confirmErr.message}`); onSave(); }
      } else { onSave(); }
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const baseUnit = mat => mat?.units?.find(u => u.is_base)?.name || mat?.unit || '';

  /* ── Field wrapper ── */
  const Field = ({ label, icon: Icon, required, error, children }) => (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      <label style={{ fontSize:11.5, fontWeight:700, color:C.text2, display:'flex', alignItems:'center', gap:4, textTransform:'uppercase', letterSpacing:'0.5px' }}>
        {Icon && <Icon size={11}/>}{label}{required && <span style={{ color:C.pink }}>*</span>}
      </label>
      {children}
      {error && <span style={{ fontSize:11, color:C.red, display:'flex', alignItems:'center', gap:3 }}><Warning size={10}/>{error}</span>}
    </div>
  );

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'flex-start', justifyContent:'center', background:'rgba(15,23,42,0.55)', backdropFilter:'blur(8px)', overflowY:'auto', padding:'16px', animation:'ib-fadein 0.2s ease' }}>
      <div style={{ width:'96vw', maxWidth:1180, background:C.surface, borderRadius:24, boxShadow:'0 32px 80px rgba(0,0,0,0.18)', display:'flex', flexDirection:'column', minHeight:'85vh', border:`1px solid ${C.border}`, position:'relative', animation:'ib-scalein 0.3s cubic-bezier(0.16,1,0.3,1)', marginBottom:24 }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 24px', borderBottom:`1px solid ${C.border}`, background:'linear-gradient(135deg,#f0f9ff,#e0f2fe)', borderRadius:'24px 24px 0 0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:44, height:44, borderRadius:13, background:`linear-gradient(135deg,${C.sky},#0ea5e9)`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 14px rgba(2,132,199,0.35)' }}>
              <Package size={22} color="white" weight="duotone"/>
            </div>
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:C.text1 }}>
                {mode==='add' ? 'Tạo Phiếu Nhập Kho' : `Sửa phiếu ${initial?.receipt_code}`}
              </div>
              <div style={{ fontSize:12, color:C.sky, marginTop:2 }}>Giá mua tự động điền từ vật tư — có thể sửa tay</div>
            </div>
          </div>
          <button onClick={onClose}
            style={{ width:34, height:34, border:`1.5px solid ${C.border}`, background:C.surface, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:C.text3, transition:'all 0.18s' }}
            onMouseEnter={e=>{e.currentTarget.style.background=C.redL;e.currentTarget.style.color=C.red;e.currentTarget.style.borderColor='rgba(220,38,38,0.3)';}}
            onMouseLeave={e=>{e.currentTarget.style.background=C.surface;e.currentTarget.style.color=C.text3;e.currentTarget.style.borderColor=C.border;}}>
            <X size={15}/>
          </button>
        </div>

        <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:20, flex:1 }}>

          {/* Receipt Info */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, padding:'18px 20px', borderRadius:16, background:'#f8fafc', border:`1px solid ${C.border}` }}>
            <Field label="Ngày nhập" icon={CalendarBlank}>
              <input type="date" value={form.receipt_date} onChange={e=>setForm(f=>({...f,receipt_date:e.target.value}))}
                style={inputSx(false)}
                onFocus={e=>{e.target.style.borderColor=C.sky;e.target.style.boxShadow=`0 0 0 3px rgba(2,132,199,0.12)`;}}
                onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow='none';}}/>
            </Field>
            <Field label="Nhà cung cấp" icon={Buildings}>
              <select value={form.partner_id} onChange={e=>setForm(f=>({...f,partner_id:e.target.value}))}
                style={{...inputSx(false),appearance:'none',cursor:'pointer'}}
                onFocus={e=>{e.target.style.borderColor=C.sky;e.target.style.boxShadow=`0 0 0 3px rgba(2,132,199,0.12)`;}}
                onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow='none';}}>
                <option value="">— Không chọn —</option>
                {partners.map(p=><option key={p._id} value={p._id}>{p.name||p.object_name}</option>)}
              </select>
            </Field>
            <Field label="Kho nhập" icon={Warehouse} required error={errors.warehouse_id}>
              <select value={form.warehouse_id} onChange={e=>setForm(f=>({...f,warehouse_id:e.target.value}))}
                style={{...inputSx(!!errors.warehouse_id),appearance:'none',cursor:'pointer'}}
                onFocus={e=>{e.target.style.borderColor=C.sky;e.target.style.boxShadow=`0 0 0 3px rgba(2,132,199,0.12)`;}}
                onBlur={e=>{e.target.style.borderColor=errors.warehouse_id?C.red:C.border;e.target.style.boxShadow='none';}}>
                <option value="">— Chọn kho —</option>
                {warehouses.map(w=><option key={w._id} value={w._id}>{w.name||w.warehouse_name}</option>)}
              </select>
            </Field>
            <Field label="Ghi chú" icon={Note}>
              <input value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="Ghi chú phiếu..."
                style={inputSx(false)}
                onFocus={e=>{e.target.style.borderColor=C.sky;e.target.style.boxShadow=`0 0 0 3px rgba(2,132,199,0.12)`;}}
                onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow='none';}}/>
            </Field>
          </div>

          {/* Items */}
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                <div style={{ width:32, height:32, borderRadius:9, background:C.skyL, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Package size={16} color={C.sky}/>
                </div>
                <span style={{ fontSize:14, fontWeight:800, color:C.text1 }}>Danh sách hàng hoá</span>
                {form.items.length>0&&<span style={{ background:C.skyL, color:C.sky, borderRadius:20, padding:'2px 10px', fontSize:12, fontWeight:700, border:`1px solid rgba(2,132,199,0.2)` }}>{form.items.length}</span>}
                {errors.items&&<span style={{ color:C.red, fontSize:12.5 }}>· {errors.items}</span>}
              </div>
              <button onClick={addItem}
                style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'8px 16px', background:`linear-gradient(135deg,${C.sky},#0ea5e9)`, border:'none', borderRadius:10, color:'white', fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:600, cursor:'pointer', boxShadow:'0 2px 10px rgba(2,132,199,0.28)', transition:'all 0.2s' }}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 4px 16px rgba(2,132,199,0.38)';}}
                onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 2px 10px rgba(2,132,199,0.28)';}}>
                <Plus size={14} weight="bold"/> Thêm dòng
              </button>
            </div>

            {/* Column headers */}
            {form.items.length>0&&(
              <div style={{ display:'grid', gridTemplateColumns:'28px 1fr 80px 80px 160px 130px 32px', gap:10, padding:'8px 14px', background:'linear-gradient(135deg,#f0f9ff,#e0f2fe)', borderRadius:10, border:`1px solid rgba(2,132,199,0.18)`, fontSize:10.5, fontWeight:700, color:C.sky, textTransform:'uppercase', letterSpacing:'0.6px', alignItems:'center' }}>
                <span style={{ textAlign:'center' }}>#</span>
                <span>Vật tư</span>
                <span style={{ textAlign:'center' }}>SL đặt</span>
                <span style={{ textAlign:'center' }}>SL nhận</span>
                <span style={{ textAlign:'right' }}>Đơn giá (đ)</span>
                <span style={{ textAlign:'right' }}>Thành tiền</span>
                <span/>
              </div>
            )}

            {/* Empty state */}
            {form.items.length===0&&(
              <div style={{ padding:'40px 20px', textAlign:'center', border:`2px dashed ${C.border}`, borderRadius:16, background:'#f8fafc' }}>
                <div style={{ width:56, height:56, borderRadius:16, background:C.skyL, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', border:`1.5px dashed rgba(2,132,199,0.3)` }}>
                  <Package size={26} color={C.sky}/>
                </div>
                <div style={{ fontSize:14, fontWeight:600, color:C.text2, marginBottom:4 }}>Chưa có dòng hàng</div>
                <div style={{ fontSize:12.5, color:C.text3 }}>Nhấn "+ Thêm dòng" để bắt đầu</div>
              </div>
            )}

            {/* Item rows */}
            {form.items.map((it, idx) => {
              const mat          = it._material || materials.find(m => m._id === it.material_id);
              const unit         = baseUnit(mat);
              const total        = (Number(it.quantity_received)||Number(it.quantity)||0) * (Number(it.unit_cost)||0);
              const showHSD      = mat?.has_expiry_date;
              const expiryDays   = it.expiry_date ? Math.ceil((new Date(it.expiry_date)-new Date())/(1000*60*60*24)) : null;
              const qtyMismatch  = it.quantity_received && Number(it.quantity_received) !== Number(it.quantity);
              const refPrice     = mat?.purchase_price || 0;
              const currentCost  = Number(it.unit_cost) || 0;
              const priceDiffers = refPrice > 0 && currentCost !== refPrice;

              return (
                <div key={it._key} style={{ borderRadius:14, border:`1.5px solid ${showHSD?'rgba(217,119,6,0.2)':C.border}`, background:C.surface, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.04)', animation:'ib-fadeup 0.3s ease' }}>
                  {/* Main row */}
                  <div style={{ display:'grid', gridTemplateColumns:'28px 1fr 80px 80px 160px 130px 32px', gap:10, padding:'12px 14px', alignItems:'center', background: idx%2===0 ? C.surface : '#fafbfc' }}>
                    <span style={{ fontSize:11.5, color:C.text3, textAlign:'center', fontFamily:'JetBrains Mono,monospace', fontWeight:700 }}>{idx+1}</span>
                    <div>
                      <MaterialCell value={it.material_id} materials={materials} onChange={m=>selectMaterial(it._key,m)}/>
                      {errors[`item_${idx}`]&&<div style={{ fontSize:11, color:C.red, marginTop:3 }}>{errors[`item_${idx}`]}</div>}
                      {/* ✅ Hint giá mua khi đã chọn vật tư */}
                      {mat&&refPrice>0&&(
                        <div style={{ fontSize:10.5, color:C.purple, marginTop:3, display:'flex', alignItems:'center', gap:3 }}>
                          <Tag size={9}/> Giá mua tham khảo: {fmtMoney(refPrice)}
                        </div>
                      )}
                    </div>
                    <input type="number" min={1} value={it.quantity} onChange={e=>updateItem(it._key,'quantity',e.target.value)}
                      style={{...inputSx(false),textAlign:'center',fontSize:13}}
                      onFocus={e=>{e.target.style.borderColor=C.sky;e.target.style.boxShadow=`0 0 0 3px rgba(2,132,199,0.12)`;}}
                      onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow='none';}}/>
                    <input type="number" min={0} value={it.quantity_received} onChange={e=>updateItem(it._key,'quantity_received',e.target.value)}
                      style={{...inputSx(false),textAlign:'center',fontSize:13,borderColor:qtyMismatch?C.amber:C.border}}
                      onFocus={e=>{e.target.style.borderColor=C.sky;e.target.style.boxShadow=`0 0 0 3px rgba(2,132,199,0.12)`;}}
                      onBlur={e=>{e.target.style.borderColor=qtyMismatch?C.amber:C.border;e.target.style.boxShadow='none';}}/>
                    <div>
                      <input type="number" min={0} step={1000} value={it.unit_cost}
                        onChange={e=>updateItem(it._key,'unit_cost',e.target.value)}
                        style={{...inputSx(false),textAlign:'right',fontSize:13,fontFamily:'JetBrains Mono,monospace'}}
                        onFocus={e=>{e.target.style.borderColor=C.sky;e.target.style.boxShadow=`0 0 0 3px rgba(2,132,199,0.12)`;}}
                        onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow='none';}}/>
                      {/* ✅ Hint khi giá khác tham khảo */}
                      {priceDiffers&&(
                        <div style={{ fontSize:10.5, color:C.amber, marginTop:2, textAlign:'right' }}>
                          Tham khảo: {fmtMoney(refPrice)}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:13.5, fontWeight:700, color:total>0?C.sky:C.text3, fontFamily:'JetBrains Mono,monospace' }}>{total>0?fmtMoney(total):'—'}</div>
                      {unit&&<div style={{ fontSize:11, color:C.sky, marginTop:2 }}>{unit}</div>}
                    </div>
                    <button onClick={()=>removeItem(it._key)}
                      style={{ width:30, height:30, border:`1.5px solid ${C.border}`, background:C.surface, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:C.text3, transition:'all 0.15s' }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(220,38,38,0.4)';e.currentTarget.style.background=C.redL;e.currentTarget.style.color=C.red;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.surface;e.currentTarget.style.color=C.text3;}}>
                      <Trash size={13}/>
                    </button>
                  </div>

                  {/* Batch / expiry row */}
                  {mat&&(
                    <div style={{ padding:'12px 14px 14px', borderTop:`1px dashed ${showHSD?'rgba(217,119,6,0.3)':C.border}`, background:showHSD?'rgba(254,243,199,0.35)':'#f8fafc' }}>
                      <div style={{ fontSize:11, fontWeight:700, color:showHSD?C.amber:C.sky, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10, display:'flex', alignItems:'center', gap:5 }}>
                        <CalendarX size={11}/>
                        {showHSD?'Lô hàng & Hạn sử dụng (bắt buộc)':'Lô hàng & Hạn sử dụng (tuỳ chọn)'}
                        {showHSD&&<span style={{ color:C.red }}>*</span>}
                        {mat.default_shelf_life_days&&<span style={{ color:C.text3, fontWeight:400, textTransform:'none', letterSpacing:0 }}>· Tuổi thọ: {mat.default_shelf_life_days} ngày</span>}
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'180px 150px 170px 1fr', gap:12 }}>
                        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                          <label style={{ fontSize:11, fontWeight:700, color:C.text3, textTransform:'uppercase', letterSpacing:'0.5px', display:'flex', alignItems:'center', gap:3 }}><Hash size={10}/>Số lô</label>
                          <input value={it.batch_no} onChange={e=>updateItem(it._key,'batch_no',e.target.value)} placeholder="Tự sinh nếu trống"
                            style={{...inputSx(false),fontSize:12.5,fontFamily:'JetBrains Mono,monospace'}}
                            onFocus={e=>{e.target.style.borderColor=C.sky;e.target.style.boxShadow=`0 0 0 3px rgba(2,132,199,0.10)`;}}
                            onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow='none';}}/>
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                          <label style={{ fontSize:11, fontWeight:700, color:C.text3, textTransform:'uppercase', letterSpacing:'0.5px' }}>NSX</label>
                          <input type="date" value={it.manufacture_date} onChange={e=>updateItem(it._key,'manufacture_date',e.target.value)}
                            style={{...inputSx(false),fontSize:12.5}}
                            onFocus={e=>{e.target.style.borderColor=C.sky;e.target.style.boxShadow=`0 0 0 3px rgba(2,132,199,0.10)`;}}
                            onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow='none';}}/>
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                          <label style={{ fontSize:11, fontWeight:700, color:showHSD?C.amber:C.text3, textTransform:'uppercase', letterSpacing:'0.5px', display:'flex', alignItems:'center', gap:3 }}>
                            HSD {showHSD&&<span style={{ color:C.red }}>*</span>}
                          </label>
                          <input type="date" value={it.expiry_date} onChange={e=>updateItem(it._key,'expiry_date',e.target.value)}
                            style={{...inputSx(!!errors[`exp_${idx}`]),fontSize:12.5,borderColor:errors[`exp_${idx}`]?C.red:showHSD?'rgba(217,119,6,0.4)':C.border}}
                            onFocus={e=>{e.target.style.borderColor=C.amber;e.target.style.boxShadow=`0 0 0 3px rgba(217,119,6,0.12)`;}}
                            onBlur={e=>{e.target.style.borderColor=errors[`exp_${idx}`]?C.red:showHSD?'rgba(217,119,6,0.4)':C.border;e.target.style.boxShadow='none';}}/>
                          {expiryDays!==null&&<span style={{ fontSize:11, color:expiryDays<0?C.red:expiryDays<=30?C.amber:C.green, fontWeight:600 }}>{expiryDays<0?'⚠ Đã hết hạn!':`Còn ${expiryDays} ngày`}</span>}
                          {errors[`exp_${idx}`]&&<span style={{ fontSize:11, color:C.red }}>{errors[`exp_${idx}`]}</span>}
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                          <label style={{ fontSize:11, fontWeight:700, color:C.text3, textTransform:'uppercase', letterSpacing:'0.5px' }}>Ghi chú dòng</label>
                          <input value={it.note} onChange={e=>updateItem(it._key,'note',e.target.value)} placeholder="Ghi chú..."
                            style={{...inputSx(false),fontSize:12.5}}
                            onFocus={e=>{e.target.style.borderColor=C.sky;e.target.style.boxShadow=`0 0 0 3px rgba(2,132,199,0.10)`;}}
                            onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow='none';}}/>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Totals */}
            {form.items.length>0&&(
              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <div style={{ minWidth:300, padding:'16px 20px', borderRadius:14, background:'linear-gradient(135deg,#f0f9ff,#e0f2fe)', border:`1.5px solid rgba(2,132,199,0.2)` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:C.text2, marginBottom:8 }}>
                    <span>Tổng số lượng</span>
                    <span style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, color:C.text1 }}>{fmt(totals.qty)}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:10, borderTop:`1px solid rgba(2,132,199,0.15)` }}>
                    <span style={{ fontSize:13, fontWeight:700, color:C.sky }}>Tổng tiền nhập</span>
                    <span style={{ fontSize:18, fontWeight:800, color:C.sky, fontFamily:'JetBrains Mono,monospace', letterSpacing:'-0.5px' }}>{fmtMoney(totals.cost)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Exit confirm overlay */}
        {showExitConfirm&&(
          <div style={{ position:'absolute', inset:0, zIndex:10, background:'rgba(15,23,42,0.5)', backdropFilter:'blur(6px)', borderRadius:24, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:'28px 32px', maxWidth:360, width:'90%', boxShadow:'0 24px 64px rgba(0,0,0,0.18)', textAlign:'center', animation:'ib-scalein 0.25s cubic-bezier(0.16,1,0.3,1)' }}>
              <div style={{ width:50, height:50, borderRadius:14, margin:'0 auto 16px', background:C.skyL, display:'flex', alignItems:'center', justifyContent:'center', border:`1.5px solid rgba(2,132,199,0.25)` }}>
                <Note size={24} color={C.sky} weight="duotone"/>
              </div>
              <div style={{ fontSize:16, fontWeight:800, color:C.text1, marginBottom:8 }}>Lưu vào bản nháp?</div>
              <div style={{ fontSize:13, color:C.text2, lineHeight:1.6, marginBottom:22 }}>Phiếu chưa được xác nhận. Bạn có muốn lưu lại để tiếp tục sau không?</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <button onClick={async()=>{setShowExitConfirm(false);await handleSave(false);}} disabled={saving}
                  style={{ padding:'10px 16px', borderRadius:11, border:'none', background:`linear-gradient(135deg,${C.sky},#0ea5e9)`, color:'white', fontSize:13.5, fontWeight:700, fontFamily:'Outfit,sans-serif', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7, opacity:saving?0.7:1 }}>
                  <ClockCounterClockwise size={14} weight="bold"/>{saving?'Đang lưu...':'Lưu bản nháp'}
                </button>
                <button onClick={()=>{setShowExitConfirm(false);onClose();}}
                  style={{ padding:'9px 16px', borderRadius:11, border:`1.5px solid rgba(220,38,38,0.25)`, background:C.redL, color:C.red, fontSize:13, fontWeight:600, fontFamily:'Outfit,sans-serif', cursor:'pointer' }}>
                  Bỏ qua, đóng lại
                </button>
                <button onClick={()=>setShowExitConfirm(false)}
                  style={{ padding:'8px 16px', borderRadius:11, border:'none', background:'transparent', color:C.text3, fontSize:12.5, fontFamily:'Outfit,sans-serif', cursor:'pointer' }}>
                  Tiếp tục chỉnh sửa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 24px 18px', borderTop:`1px solid ${C.border}`, background:'#f8fafc', borderRadius:'0 0 24px 24px' }}>
          <button onClick={onClose}
            style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'8px 16px', border:`1.5px solid ${C.border}`, background:C.surface, borderRadius:10, color:C.text2, fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:500, cursor:'pointer', transition:'all 0.18s' }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.pink;e.currentTarget.style.color=C.pink;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.text2;}}>
            <ArrowLeft size={13}/> Đóng
          </button>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={()=>handleSave(false)} disabled={saving}
              style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 18px', border:`1.5px solid rgba(2,132,199,0.3)`, background:C.skyL, borderRadius:11, color:C.sky, fontFamily:'Outfit,sans-serif', fontSize:13.5, fontWeight:600, cursor:'pointer', opacity:saving?0.7:1, transition:'all 0.2s' }}
              onMouseEnter={e=>{if(!saving)e.currentTarget.style.background='#bae6fd';}}
              onMouseLeave={e=>{e.currentTarget.style.background=C.skyL;}}>
              <ClockCounterClockwise size={14}/>{saving?'Đang lưu...':'Lưu nháp'}
            </button>
            <button onClick={()=>handleSave(true)} disabled={saving}
              style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 20px', border:'none', background:`linear-gradient(135deg,${C.pink},${C.pinkD})`, borderRadius:11, color:'white', fontFamily:'Outfit,sans-serif', fontSize:13.5, fontWeight:700, cursor:'pointer', opacity:saving?0.7:1, boxShadow:'0 2px 12px rgba(190,24,93,0.30)', transition:'all 0.2s' }}
              onMouseEnter={e=>{if(!saving){e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 4px 18px rgba(190,24,93,0.40)';}}}
              onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 2px 12px rgba(190,24,93,0.30)';}}>
              {saving?<ArrowsClockwise size={14} style={{animation:'ib-spin 0.8s linear infinite'}}/>:<CheckCircle size={14} weight="fill"/>}
              {saving?'Đang xử lý...':'Lưu & Xác nhận'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── ReceiptDetail ──────────────────────────────────────────── */
function ReceiptDetail({ receipt, onClose }) {
  const partner   = receipt.partner_id;
  const warehouse = receipt.warehouse_id;
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'flex-start', justifyContent:'center', background:'rgba(15,23,42,0.50)', backdropFilter:'blur(8px)', overflowY:'auto', padding:'20px 16px', animation:'ib-fadein 0.2s ease' }}>
      <div style={{ width:'100%', maxWidth:860, background:C.surface, border:`1px solid ${C.border}`, borderRadius:24, boxShadow:'0 24px 64px rgba(0,0,0,0.14)', marginBottom:20, animation:'ib-scalein 0.3s cubic-bezier(0.16,1,0.3,1)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', borderBottom:`1px solid ${C.border}`, background:'linear-gradient(135deg,#f0f9ff,#e0f2fe)', borderRadius:'24px 24px 0 0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:16, fontWeight:800, color:C.text1, fontFamily:'JetBrains Mono,monospace' }}>{receipt.receipt_code}</span>
            <StatusBadge status={receipt.status}/>
          </div>
          <button onClick={onClose}
            style={{ width:32, height:32, border:`1.5px solid ${C.border}`, background:C.surface, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:C.text3, transition:'all 0.18s' }}
            onMouseEnter={e=>{e.currentTarget.style.background=C.redL;e.currentTarget.style.color=C.red;}}
            onMouseLeave={e=>{e.currentTarget.style.background=C.surface;e.currentTarget.style.color=C.text3;}}>
            <X size={15}/>
          </button>
        </div>

        <div style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:18 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
            {[
              { label:'Ngày nhập',    value: fmtDate(receipt.receipt_date||receipt.created_at) },
              { label:'Nhà cung cấp', value: partner?.name||partner?.object_name||'—' },
              { label:'Kho nhập',     value: warehouse?.name||warehouse?.warehouse_name||'—' },
              { label:'Ghi chú',      value: receipt.note||'—' },
            ].map(f=>(
              <div key={f.label} style={{ background:'#f8fafc', borderRadius:12, padding:'12px 14px', border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:10.5, color:C.text3, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:5 }}>{f.label}</div>
                <div style={{ fontSize:13.5, fontWeight:600, color:C.text1 }}>{f.value}</div>
              </div>
            ))}
          </div>

          <div style={{ borderRadius:16, border:`1px solid ${C.border}`, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13.5 }}>
              <thead>
                <tr style={{ background:'#f8fafc', borderBottom:`1.5px solid ${C.border2}` }}>
                  {['#','Vật tư','SL đặt','SL nhận','Đơn giá','Thành tiền','Lô / HSD'].map((h,i)=>(
                    <th key={h} style={{ padding:'10px 14px', textAlign:['SL đặt','SL nhận'].includes(h)?'center':['Đơn giá','Thành tiền'].includes(h)?'right':'left', fontSize:10.5, fontWeight:700, color:C.text3, letterSpacing:'0.6px', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {receipt.items?.map((it,i)=>{
                  const mat      = it.material_id;
                  const name     = mat?.product_name||mat?.material_name||'—';
                  const code     = mat?.product_code||mat?.material_code||'';
                  const total    = (it.quantity_received||it.quantity||0)*(it.unit_cost||0);
                  const days     = it.expiry_date ? Math.ceil((new Date(it.expiry_date)-new Date())/(1000*60*60*24)) : null;
                  const shortage = it.quantity_received < it.quantity;
                  return (
                    <tr key={i} style={{ borderBottom:`1px solid ${C.border2}` }}
                      onMouseEnter={e=>e.currentTarget.style.background='#fdfbfe'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <td style={{ padding:'12px 14px', color:C.text3, fontFamily:'JetBrains Mono,monospace', fontSize:12 }}>{i+1}</td>
                      <td style={{ padding:'12px 14px' }}>
                        <div style={{ fontWeight:600, color:C.text1 }}>{name}</div>
                        {code&&<div style={{ fontSize:11.5, color:C.sky, fontFamily:'JetBrains Mono,monospace', marginTop:1 }}>{code}</div>}
                        {it.note&&<div style={{ fontSize:11.5, color:C.text3 }}>{it.note}</div>}
                      </td>
                      <td style={{ padding:'12px 14px', textAlign:'center', color:C.text2, fontFamily:'JetBrains Mono,monospace', fontWeight:600 }}>{fmt(it.quantity)}</td>
                      <td style={{ padding:'12px 14px', textAlign:'center' }}>
                        <span style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, color:shortage?C.amber:C.text1 }}>{fmt(it.quantity_received||it.quantity)}</span>
                        {shortage&&<div style={{ fontSize:11, color:C.amber, marginTop:2 }}>Thiếu {fmt(it.quantity-it.quantity_received)}</div>}
                      </td>
                      <td style={{ padding:'12px 14px', textAlign:'right', color:C.text2, fontFamily:'JetBrains Mono,monospace', fontSize:13 }}>{fmtMoney(it.unit_cost)}</td>
                      <td style={{ padding:'12px 14px', textAlign:'right', fontFamily:'JetBrains Mono,monospace', fontWeight:700, color:C.sky, fontSize:13.5 }}>{fmtMoney(total)}</td>
                      <td style={{ padding:'12px 14px' }}>
                        {it.batch_no&&<div style={{ fontSize:12, fontFamily:'JetBrains Mono,monospace', color:C.sky, background:C.skyL, padding:'2px 7px', borderRadius:5, display:'inline-block' }}>{it.batch_no}</div>}
                        {it.manufacture_date&&<div style={{ fontSize:11.5, color:C.text3, marginTop:3 }}>NSX: {fmtDate(it.manufacture_date)}</div>}
                        {it.expiry_date&&<div style={{ fontSize:12, fontWeight:600, color:days<0?C.red:days<30?C.amber:C.green, marginTop:3 }}>HSD: {fmtDate(it.expiry_date)} <span style={{ fontSize:11, fontWeight:400 }}>({days<0?'HH':`${days}d`})</span></div>}
                        {!it.batch_no&&!it.expiry_date&&<span style={{ color:C.text3, fontSize:13 }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <div style={{ minWidth:280, padding:'14px 18px', borderRadius:14, background:'linear-gradient(135deg,#f0f9ff,#e0f2fe)', border:`1.5px solid rgba(2,132,199,0.2)` }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:C.text2, marginBottom:8 }}>
                <span>Tổng số lượng</span>
                <span style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, color:C.text1 }}>{fmt(receipt.total_quantity)}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:10, borderTop:`1px solid rgba(2,132,199,0.15)` }}>
                <span style={{ fontSize:13, fontWeight:700, color:C.sky }}>Tổng tiền</span>
                <span style={{ fontSize:18, fontWeight:800, color:C.sky, fontFamily:'JetBrains Mono,monospace' }}>{fmtMoney(receipt.total_cost)}</span>
              </div>
            </div>
          </div>

          <div style={{ display:'flex', gap:16, flexWrap:'wrap', paddingTop:4, borderTop:`1px solid ${C.border}` }}>
            {[
              { label:'Tạo bởi', val:receipt.created_by, date:receipt.created_at },
              receipt.confirmed_by&&{ label:'Xác nhận bởi', val:receipt.confirmed_by },
              receipt.cancelled_by&&{ label:'Huỷ bởi', val:receipt.cancelled_by },
            ].filter(Boolean).map(a=>(
              <div key={a.label} style={{ fontSize:12, color:C.text3 }}>
                {a.label}: <strong style={{ color:C.text2 }}>{a.val}</strong>
                {a.date&&<span style={{ marginLeft:5 }}>· {fmtDate(a.date)}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Pagination ─────────────────────────────────────────────── */
function Pagination({ page, totalPages, onChange }) {
  if (totalPages<=1) return null;
  const btnSx = active => ({ width:34, height:34, borderRadius:9, border:`1.5px solid ${active?C.pink:C.border}`, background:active?`linear-gradient(135deg,${C.pink},${C.pinkD})`:C.surface, color:active?'white':C.text2, fontFamily:'JetBrains Mono,monospace', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:active?'0 2px 10px rgba(190,24,93,0.25)':'none', transition:'all 0.18s' });
  return (
    <div style={{ display:'flex', gap:4 }}>
      <button style={{...btnSx(false),opacity:page===1?0.35:1}} disabled={page===1} onClick={()=>onChange(page-1)}><CaretLeft size={13} weight="bold"/></button>
      {[...Array(Math.min(5,totalPages))].map((_,i)=>{
        const p=i+1;
        return <button key={p} style={btnSx(p===page)} onClick={()=>onChange(p)}>{p}</button>;
      })}
      <button style={{...btnSx(false),opacity:page===totalPages?0.35:1}} disabled={page===totalPages} onClick={()=>onChange(page+1)}><CaretRight size={13} weight="bold"/></button>
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────── */
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
      const firstData = Array.isArray(first?.data?.data) ? first.data.data : Array.isArray(first?.data) ? first.data : Array.isArray(first) ? first : [];
      const totalMat  = first?.data?.pagination?.total ?? first?.pagination?.total ?? firstData.length;
      if (totalMat<=CHUNK||firstData.length===0) return firstData;
      const totalPages = Math.ceil(totalMat/CHUNK);
      const rest = await Promise.all(Array.from({length:totalPages-1},(_,i)=>api.get(`/materials?limit=${CHUNK}&page=${i+2}`)));
      return [...firstData, ...rest.flatMap(r=>{const d=r?.data?.data??r?.data??r??[];return Array.isArray(d)?d:[];})];
    } catch (err) { console.error('[Materials fetch error]',err); return []; }
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit:PAGE_SIZE });
      if (search)       params.set('search', search);
      if (filterStatus) params.set('status', filterStatus);
      const [rRes, allMats, pRes, wRes] = await Promise.allSettled([
        api.get(`/inbound-receipts?${params}`),
        fetchAllMaterials(),
        api.get('/partners').catch(()=>({data:[]})),
        api.get('/warehouses').catch(()=>({data:[]})),
      ]);
      if (rRes.status==='fulfilled') { const raw=rRes.value; setReceipts(parseList(raw)); setTotal(parseTotal(raw)); } else { setReceipts([]); }
      if (allMats.status==='fulfilled') setMaterials(allMats.value);
      if (pRes.status==='fulfilled') { const pRaw=pRes.value?.data??pRes.value; setPartners(Array.isArray(pRaw?.data)?pRaw.data:Array.isArray(pRaw)?pRaw:[]); }
      if (wRes.status==='fulfilled') { const wRaw=wRes.value?.data??wRes.value; setWarehouses(Array.isArray(wRaw?.data)?wRaw.data:Array.isArray(wRaw)?wRaw:[]); }
    } catch (err) { console.error('fetchAll error:',err); }
    finally { setLoading(false); }
  }, [page, search, filterStatus]);

  useEffect(()=>{fetchAll();},[fetchAll]);
  useEffect(()=>{setPage(1);},[search,filterStatus]);

  const handleConfirm = async (id, code) => {
    if (!window.confirm(`Xác nhận phiếu ${code}?\nTồn kho sẽ được cộng và giá vốn tự động cập nhật.`)) return;
    try { await api.patch(`/inbound-receipts/${id}/confirm`); fetchAll(); }
    catch (err) { alert(err.message); }
  };
  const handleCancel = async (id, code) => {
    if (!window.confirm(`Huỷ phiếu ${code}?`)) return;
    try { await api.patch(`/inbound-receipts/${id}/cancel`); fetchAll(); }
    catch (err) { alert(err.message); }
  };
  const handleDelete = async (id, code) => {
    if (!window.confirm(`Xóa phiếu nháp ${code}?`)) return;
    try { await api.delete(`/inbound-receipts/${id}`); fetchAll(); }
    catch (err) { alert(err.message); }
  };
  const openDetail = async id => {
    try { const r = await api.get(`/inbound-receipts/${id}`); const data=r?.data?.data??r?.data??r; setModal({type:'detail',data}); }
    catch (err) { alert(err.message); }
  };

  const totalPages = Math.max(1, Math.ceil(total/PAGE_SIZE));

  const FILTER_TABS = [
    { key:'',          label:'Tất cả',        color:C.pink  },
    { key:'draft',     label:'Nháp',          color:C.gray  },
    { key:'confirmed', label:'Đã xác nhận',   color:C.green },
    { key:'cancelled', label:'Đã huỷ',        color:C.red   },
  ];

  const ActBtn = ({ title, onClick, variant='default', children }) => {
    const V = {
      default: { b:C.border, bg:C.surface, c:C.text3, hb:'#93c5fd', hbg:'#eff6ff', hc:'#2563eb' },
      danger:  { b:C.border, bg:C.surface, c:C.text3, hb:'#fca5a5', hbg:C.redL,   hc:C.red      },
      confirm: { b:'rgba(5,150,105,0.3)', bg:C.greenL, c:C.green, hb:C.green, hbg:'#bbf7d0', hc:C.green },
    };
    const v=V[variant];
    return (
      <button title={title} onClick={onClick}
        style={{ width:30, height:30, border:`1.5px solid ${v.b}`, background:v.bg, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:v.c, transition:'all 0.18s' }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=v.hb;e.currentTarget.style.background=v.hbg;e.currentTarget.style.color=v.hc;}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor=v.b;e.currentTarget.style.background=v.bg;e.currentTarget.style.color=v.c;}}>
        {children}
      </button>
    );
  };

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:'Outfit, sans-serif', padding:'28px 32px 56px' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:48, height:48, borderRadius:15, background:`linear-gradient(135deg,${C.skyL},#bae6fd)`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(2,132,199,0.20)', flexShrink:0 }}>
            <Package size={24} color={C.sky} weight="duotone"/>
          </div>
          <div>
            <h1 style={{ fontSize:22, fontWeight:800, color:C.text1, margin:0, letterSpacing:'-0.5px' }}>Nhập Kho</h1>
            <div style={{ fontSize:13, color:C.text3, marginTop:3 }}>
              <span style={{ fontFamily:'JetBrains Mono,monospace', color:C.sky, fontWeight:700 }}>{total}</span> phiếu nhập
            </div>
          </div>
        </div>
        {isAdmin&&(
          <button onClick={()=>setModal({type:'form',data:null})}
            style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'10px 20px', background:`linear-gradient(135deg,${C.pink},${C.pinkD})`, border:'none', borderRadius:12, color:'white', fontFamily:'Outfit,sans-serif', fontSize:14, fontWeight:700, cursor:'pointer', boxShadow:'0 2px 12px rgba(190,24,93,0.30)', transition:'all 0.22s' }}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 6px 20px rgba(190,24,93,0.40)';}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 2px 12px rgba(190,24,93,0.30)';}}>
            <Plus size={15} weight="bold"/> Tạo Phiếu Nhập
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:220, maxWidth:440 }}>
          <MagnifyingGlass size={15} color={C.text3} style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
          <input placeholder="Tìm mã phiếu..." value={search} onChange={e=>setSearch(e.target.value)}
            style={{...inputSx(false),paddingLeft:38}}
            onFocus={e=>{e.target.style.borderColor=C.pink;e.target.style.boxShadow=`0 0 0 3px rgba(190,24,93,0.10)`;}}
            onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow='none';}}/>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {FILTER_TABS.map(o=>{
            const active=filterStatus===o.key;
            return (
              <button key={o.key} onClick={()=>setFilterStatus(o.key)}
                style={{ padding:'7px 16px', borderRadius:10, border:`1.5px solid ${active?o.color:C.border}`, background:active?`${o.color}18`:C.surface, color:active?o.color:C.text2, fontSize:13, fontWeight:active?700:500, cursor:'pointer', fontFamily:'Outfit,sans-serif', transition:'all 0.18s', boxShadow:active?`0 2px 8px ${o.color}20`:'none' }}>
                {o.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div style={{ background:C.surface, borderRadius:20, border:`1px solid ${C.border}`, boxShadow:'0 4px 20px rgba(0,0,0,0.05)', overflow:'hidden', animation:'ib-fadeup 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13.5 }}>
          <thead>
            <tr style={{ background:'#f8fafc', borderBottom:`1.5px solid ${C.border2}` }}>
              {['MÃ PHIẾU','NGÀY NHẬP','NHÀ CUNG CẤP','KHO NHẬP','SỐ MẶT HÀNG','TỔNG TIỀN','TRẠNG THÁI','THAO TÁC'].map((h,i)=>(
                <th key={h} style={{ padding:'12px 16px', textAlign:h==='SỐ MẶT HÀNG'?'center':h==='TỔNG TIỀN'?'right':h==='THAO TÁC'?'right':'left', fontSize:10.5, fontWeight:700, color:C.text3, letterSpacing:'0.8px', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading?(
              [...Array(7)].map((_,i)=>(
                <tr key={i} style={{ borderBottom:`1px solid ${C.border2}` }}>
                  {[...Array(8)].map((_,j)=><td key={j} style={{ padding:'14px 16px' }}><Skel h={13} w={j===2?'70%':'55%'}/></td>)}
                </tr>
              ))
            ):receipts.length===0?(
              <tr>
                <td colSpan={8} style={{ padding:'56px 20px', textAlign:'center' }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
                    <div style={{ width:64, height:64, background:C.skyL, borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', border:`1.5px dashed rgba(2,132,199,0.3)`, color:C.sky }}>
                      <Package size={28}/>
                    </div>
                    <div style={{ fontSize:14, fontWeight:600, color:C.text2 }}>Chưa có phiếu nhập nào</div>
                  </div>
                </td>
              </tr>
            ):receipts.map((r,idx)=>{
              const partner   = r.partner_id;
              const warehouse = r.warehouse_id;
              return (
                <tr key={r._id}
                  style={{ borderBottom:`1px solid ${C.border2}`, transition:'background 0.15s', animation:`ib-fadeup 0.35s cubic-bezier(0.16,1,0.3,1) ${idx*25}ms both`, cursor:'pointer' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#fdfbfe'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                  onDoubleClick={()=>openDetail(r._id)}
                  title="Nhấp đúp để xem chi tiết">
                  <td style={{ padding:'13px 16px' }}>
                    <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:12.5, fontWeight:700, color:C.sky, background:C.skyL, padding:'3px 9px', borderRadius:7, whiteSpace:'nowrap' }}>{r.receipt_code}</span>
                  </td>
                  <td style={{ padding:'13px 16px', fontSize:13, color:C.text2, whiteSpace:'nowrap' }}>{fmtDate(r.receipt_date||r.created_at)}</td>
                  <td style={{ padding:'13px 16px', fontSize:13, color:C.text2 }}>{partner?.name||partner?.object_name||<span style={{ color:C.text3 }}>—</span>}</td>
                  <td style={{ padding:'13px 16px', fontSize:13, color:C.text2 }}>{warehouse?.name||warehouse?.warehouse_name||'—'}</td>
                  <td style={{ padding:'13px 16px', textAlign:'center' }}>
                    <span style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, color:C.text1, fontSize:14 }}>{r.items?.length||0}</span>
                  </td>
                  <td style={{ padding:'13px 16px', textAlign:'right' }}>
                    <span style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, color:C.sky, fontSize:13.5 }}>{fmtMoney(r.total_cost)}</span>
                  </td>
                  <td style={{ padding:'13px 16px' }}><StatusBadge status={r.status}/></td>
                  <td style={{ padding:'13px 16px', textAlign:'right' }} onClick={e=>e.stopPropagation()} onDoubleClick={e=>e.stopPropagation()}>
                    <div style={{ display:'flex', gap:5, justifyContent:'flex-end' }}>
                      <ActBtn title="Xem chi tiết" onClick={()=>openDetail(r._id)}><Eye size={13}/></ActBtn>
                      {isAdmin&&r.status==='draft'&&(
                        <>
                          <ActBtn title="Sửa phiếu" onClick={async()=>{const res=await api.get(`/inbound-receipts/${r._id}`);const d=res?.data?.data??res?.data??res;setModal({type:'form',data:d});}}>
                            <PencilSimple size={13}/>
                          </ActBtn>
                          <ActBtn title="Xác nhận" variant="confirm" onClick={()=>handleConfirm(r._id,r.receipt_code)}><CheckCircle size={13} weight="fill"/></ActBtn>
                          <ActBtn title="Huỷ phiếu" onClick={()=>handleCancel(r._id,r.receipt_code)}><XCircle size={13}/></ActBtn>
                          <ActBtn title="Xóa nháp" variant="danger" onClick={()=>handleDelete(r._id,r.receipt_code)}><Trash size={13}/></ActBtn>
                        </>
                      )}
                      {isAdmin&&r.status==='confirmed'&&(
                        <ActBtn title="Huỷ phiếu đã xác nhận" variant="danger" onClick={()=>handleCancel(r._id,r.receipt_code)}><XCircle size={13}/></ActBtn>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!loading&&total>PAGE_SIZE&&(
          <div style={{ padding:'14px 20px', borderTop:`1px solid ${C.border2}`, display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fafbfc' }}>
            <span style={{ fontSize:12.5, color:C.text3, fontFamily:'JetBrains Mono,monospace' }}>
              Trang <strong style={{ color:C.text2 }}>{page}</strong>/{totalPages} · <strong style={{ color:C.sky }}>{total}</strong> phiếu
            </span>
            <Pagination page={page} totalPages={totalPages} onChange={setPage}/>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.type==='form'&&(
        <ReceiptForm mode={modal.data?'edit':'add'} initial={modal.data} materials={materials} partners={partners} warehouses={warehouses} onSave={()=>{setModal(null);fetchAll();}} onClose={()=>setModal(null)}/>
      )}
      {modal?.type==='detail'&&modal.data&&(
        <ReceiptDetail receipt={modal.data} onClose={()=>setModal(null)}/>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
        @keyframes ib-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes ib-fadeup{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ib-fadein{from{opacity:0}to{opacity:1}}
        @keyframes ib-scalein{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
        @keyframes ib-spin{to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
};

export default InboundReceipts;