// ================================================================
//  WMS — LUXURY WAREHOUSES  v3.0
//  Paste to: src/views/Warehouses.jsx
// ================================================================
import { useState, useEffect, useCallback } from 'react';
import {
  Warehouse, Plus, MagnifyingGlass, PencilSimple, Trash,
  X, FloppyDisk, MapPin, Buildings, CheckCircle, XCircle,
  CaretDown, CaretRight, ArrowsClockwise, Warning,
} from '@phosphor-icons/react';
import api from '../services/api';

/* ── Tokens ───────────────────────────────────────────────────── */
const C = {
  pink:'#be185d', pinkD:'#9d174d', pinkL:'#fce7f3',
  sky:'#0284c7',  skyL:'#e0f2fe',  skyD:'#0ea5e9',
  green:'#059669',greenL:'#d1fae5',
  red:'#dc2626',  redL:'#fee2e2',
  amber:'#d97706',amberL:'#fef3c7',
  purple:'#7c3aed',purpleL:'#ede9fe',
  bg:'#f0f4f8', surface:'#ffffff',
  border:'#e2e8f0', border2:'#f1f5f9',
  text1:'#1e293b', text2:'#475569', text3:'#94a3b8',
};

const emptyWarehouse = { name:'', code:'', address:'', type:'main', status:'active', is_default:false };
const emptyLocation  = { location_code:'', name:'', zone:'', aisle:'', rack:'', bin:'' };

const inSx = (err=false, disabled=false) => ({
  width:'100%', padding:'9px 12px',
  border:`1.5px solid ${err?C.red:C.border}`, borderRadius:10,
  background: disabled?'#f8fafc':C.surface,
  fontFamily:'Outfit,sans-serif', fontSize:13.5,
  color:C.text1, outline:'none',
  transition:'border-color 0.2s, box-shadow 0.2s', boxSizing:'border-box',
});
const fp = e=>{e.target.style.borderColor=C.pink;e.target.style.boxShadow=`0 0 0 3px rgba(190,24,93,0.10)`;};
const fs = e=>{e.target.style.borderColor=C.sky; e.target.style.boxShadow=`0 0 0 3px rgba(2,132,199,0.10)`;};
const br = e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow='none';};

/* ── Skel ─────────────────────────────────────────────────────── */
const Skel = ({h=14,w='100%',r=7}) => (
  <div style={{height:h,width:w,borderRadius:r,background:'linear-gradient(90deg,#f1f5f9 25%,#e8edf3 50%,#f1f5f9 75%)',backgroundSize:'200% 100%',animation:'wh-shimmer 1.5s ease-in-out infinite'}}/>
);

/* ── StatusBadge ──────────────────────────────────────────────── */
const StatusBadge = ({active}) => (
  <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 10px',borderRadius:8,fontSize:11,fontWeight:700,background:active?C.greenL:C.redL,color:active?C.green:C.red,border:`1px solid ${active?'rgba(5,150,105,0.25)':'rgba(220,38,38,0.25)'}`}}>
    {active?<CheckCircle size={11} weight="fill"/>:<XCircle size={11} weight="fill"/>}
    {active?'Hoạt động':'Ngừng'}
  </span>
);

/* ── Field atoms ──────────────────────────────────────────────── */
const Field = ({label,value,onChange,placeholder,disabled,focusColor='pink'}) => (
  <div style={{display:'flex',flexDirection:'column',gap:5}}>
    <label style={{fontSize:11.5,fontWeight:700,color:C.text2,textTransform:'uppercase',letterSpacing:'0.5px'}}>{label}</label>
    <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
      style={inSx(false,disabled)}
      onFocus={focusColor==='sky'?fs:fp} onBlur={br}/>
  </div>
);

const SelectField = ({label,value,onChange,options,focusColor='pink'}) => (
  <div style={{display:'flex',flexDirection:'column',gap:5}}>
    <label style={{fontSize:11.5,fontWeight:700,color:C.text2,textTransform:'uppercase',letterSpacing:'0.5px'}}>{label}</label>
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{...inSx(),appearance:'none',cursor:'pointer'}}
      onFocus={focusColor==='sky'?fs:fp} onBlur={br}>
      {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

/* ── ActBtn ───────────────────────────────────────────────────── */
const ActBtn = ({children,onClick,color=C.text3,hoverColor=C.pink,hoverBg=C.pinkL,border=C.border,title}) => (
  <button title={title} onClick={onClick}
    style={{width:30,height:30,borderRadius:8,border:`1.5px solid ${border}`,background:C.surface,color,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.18s'}}
    onMouseEnter={e=>{e.currentTarget.style.color=hoverColor;e.currentTarget.style.background=hoverBg;e.currentTarget.style.borderColor=hoverColor;}}
    onMouseLeave={e=>{e.currentTarget.style.color=color;e.currentTarget.style.background=C.surface;e.currentTarget.style.borderColor=border;}}>
    {children}
  </button>
);

/* ── WarehouseModal ───────────────────────────────────────────── */
function WarehouseModal({open, item, onClose, onSaved}) {
  const [form,setForm] = useState(emptyWarehouse);
  const [saving,setSaving] = useState(false);
  const [err,setErr]   = useState('');

  useEffect(()=>{
    if(!open) return;
    setForm(item ? {
      name:       item.name||item.warehouse_name||'',
      code:       item.code||item.warehouse_code||'',
      address:    typeof item.address==='string'?item.address:(item.address?.full||''),
      type:       item.type||'main',
      status:     item.status||'active',
      is_default: item.is_default||false,
    } : emptyWarehouse);
    setErr('');
  },[open,item]);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSave = async()=>{
    if(!form.name.trim()) return setErr('Nhập tên kho');
    if(!form.code.trim()) return setErr('Nhập mã kho');
    setSaving(true); setErr('');
    try {
      if(item) await api.put(`/warehouses/${item._id}`,form);
      else     await api.post('/warehouses',form);
      onSaved();
    } catch(e) { setErr(e.response?.data?.message||e.message||'Lỗi server'); }
    finally { setSaving(false); }
  };

  if(!open) return null;
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.52)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,backdropFilter:'blur(7px)',animation:'wh-fadein 0.2s ease'}}>
      <div style={{background:C.surface,borderRadius:24,width:520,boxShadow:'0 24px 64px rgba(0,0,0,0.16)',border:`1px solid ${C.border}`,overflow:'hidden',animation:'wh-scalein 0.3s cubic-bezier(0.16,1,0.3,1)'}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 22px',background:'linear-gradient(135deg,#fdf2f8,#fce7f3)',borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:'flex',alignItems:'center',gap:11}}>
            <div style={{width:42,height:42,borderRadius:13,background:`linear-gradient(135deg,${C.pink},${C.pinkD})`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 12px rgba(190,24,93,0.28)'}}>
              <Buildings size={21} color="#fff" weight="duotone"/>
            </div>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:C.text1}}>{item?'Chỉnh sửa kho hàng':'Thêm kho hàng mới'}</div>
              <div style={{fontSize:12,color:C.pink,marginTop:1}}>{item?`Đang sửa: ${item.name||item.warehouse_name}`:''} </div>
            </div>
          </div>
          <button onClick={onClose}
            style={{width:32,height:32,border:`1.5px solid ${C.border}`,background:C.surface,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:C.text3,transition:'all 0.18s'}}
            onMouseEnter={e=>{e.currentTarget.style.background=C.redL;e.currentTarget.style.color=C.red;}}
            onMouseLeave={e=>{e.currentTarget.style.background=C.surface;e.currentTarget.style.color=C.text3;}}>
            <X size={14}/>
          </button>
        </div>

        <div style={{padding:'20px 22px',display:'flex',flexDirection:'column',gap:14}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <Field label="Tên kho *" value={form.name} onChange={v=>set('name',v)} placeholder="VD: Kho Chính"/>
            <Field label="Mã kho *"  value={form.code} onChange={v=>set('code',v.toUpperCase())} placeholder="VD: KHO-01" disabled={!!item}/>
          </div>
          <Field label="Địa chỉ" value={form.address} onChange={v=>set('address',v)} placeholder="Địa chỉ kho hàng"/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <SelectField label="Loại kho" value={form.type} onChange={v=>set('type',v)}
              options={[{value:'main',label:'Kho chính'},{value:'transit',label:'Kho trung chuyển'},{value:'returns',label:'Kho trả hàng'}]}/>
            <SelectField label="Trạng thái" value={form.status} onChange={v=>set('status',v)}
              options={[{value:'active',label:'Hoạt động'},{value:'inactive',label:'Ngừng'}]}/>
          </div>

          {/* Default checkbox */}
          <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',padding:'10px 14px',borderRadius:11,border:`1.5px solid ${form.is_default?'rgba(124,58,237,0.3)':C.border}`,background:form.is_default?C.purpleL:C.surface,transition:'all 0.2s'}}>
            <input type="checkbox" checked={form.is_default} onChange={e=>set('is_default',e.target.checked)}
              style={{width:16,height:16,accentColor:C.purple,cursor:'pointer'}}/>
            <div>
              <div style={{fontSize:13.5,fontWeight:600,color:form.is_default?C.purple:C.text1}}>Đặt làm kho mặc định</div>
              <div style={{fontSize:11.5,color:C.text3,marginTop:1}}>Kho này sẽ được chọn mặc định khi tạo phiếu</div>
            </div>
          </label>

          {err&&<div style={{padding:'10px 14px',background:C.redL,borderRadius:10,color:C.red,fontSize:13,border:`1px solid rgba(220,38,38,0.25)`,display:'flex',alignItems:'center',gap:7}}><Warning size={14} weight="fill"/>{err}</div>}

          <div style={{display:'flex',gap:10,justifyContent:'flex-end',paddingTop:4,borderTop:`1px solid ${C.border}`}}>
            <button onClick={onClose}
              style={{padding:'9px 18px',borderRadius:10,border:`1.5px solid ${C.border}`,background:C.surface,color:C.text2,cursor:'pointer',fontWeight:600,fontSize:13.5,fontFamily:'Outfit,sans-serif',transition:'all 0.18s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.pink;e.currentTarget.style.color=C.pink;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.text2;}}>
              Huỷ
            </button>
            <button onClick={handleSave} disabled={saving}
              style={{display:'inline-flex',alignItems:'center',gap:7,padding:'9px 20px',border:'none',background:`linear-gradient(135deg,${C.pink},${C.pinkD})`,borderRadius:10,color:'white',fontFamily:'Outfit,sans-serif',fontSize:13.5,fontWeight:700,cursor:saving?'not-allowed':'pointer',opacity:saving?0.75:1,boxShadow:'0 2px 12px rgba(190,24,93,0.28)',transition:'all 0.2s'}}
              onMouseEnter={e=>{if(!saving){e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 4px 18px rgba(190,24,93,0.40)';}}}
              onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 2px 12px rgba(190,24,93,0.28)';}}>
              {saving?<ArrowsClockwise size={14} style={{animation:'wh-spin 0.8s linear infinite'}}/>:<FloppyDisk size={14} weight="bold"/>}
              {saving?'Đang lưu...':'Lưu kho'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── LocationModal ────────────────────────────────────────────── */
function LocationModal({open, warehouseId, item, onClose, onSaved}) {
  const [form,setForm] = useState(emptyLocation);
  const [saving,setSaving] = useState(false);
  const [err,setErr]   = useState('');

  useEffect(()=>{
    if(!open) return;
    setForm(item?{location_code:item.location_code||'',name:item.name||'',zone:item.zone||'',aisle:item.aisle||'',rack:item.rack||'',bin:item.bin||''}:emptyLocation);
    setErr('');
  },[open,item]);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSave = async()=>{
    if(!form.location_code.trim()) return setErr('Nhập mã vị trí');
    setSaving(true); setErr('');
    try {
      if(item) await api.put(`/warehouses/${warehouseId}/locations/${item._id}`,form);
      else     await api.post(`/warehouses/${warehouseId}/locations`,form);
      onSaved();
    } catch(e) { setErr(e.response?.data?.message||e.message||'Lỗi server'); }
    finally { setSaving(false); }
  };

  if(!open) return null;
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.52)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1100,backdropFilter:'blur(7px)',animation:'wh-fadein 0.2s ease'}}>
      <div style={{background:C.surface,borderRadius:24,width:480,boxShadow:'0 24px 64px rgba(0,0,0,0.16)',border:`1px solid ${C.border}`,overflow:'hidden',animation:'wh-scalein 0.3s cubic-bezier(0.16,1,0.3,1)'}}>

        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 22px',background:'linear-gradient(135deg,#f0f9ff,#e0f2fe)',borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:'flex',alignItems:'center',gap:11}}>
            <div style={{width:40,height:40,borderRadius:12,background:`linear-gradient(135deg,${C.skyD},${C.sky})`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 12px rgba(2,132,199,0.28)'}}>
              <MapPin size={20} color="#fff" weight="duotone"/>
            </div>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:C.text1}}>{item?'Chỉnh sửa vị trí':'Thêm vị trí mới'}</div>
              <div style={{fontSize:12,color:C.sky,marginTop:1}}>Vị trí lưu trữ trong kho</div>
            </div>
          </div>
          <button onClick={onClose}
            style={{width:32,height:32,border:`1.5px solid ${C.border}`,background:C.surface,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:C.text3,transition:'all 0.18s'}}
            onMouseEnter={e=>{e.currentTarget.style.background=C.redL;e.currentTarget.style.color=C.red;}}
            onMouseLeave={e=>{e.currentTarget.style.background=C.surface;e.currentTarget.style.color=C.text3;}}>
            <X size={14}/>
          </button>
        </div>

        <div style={{padding:'20px 22px',display:'flex',flexDirection:'column',gap:14}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <Field label="Mã vị trí *" value={form.location_code} onChange={v=>set('location_code',v.toUpperCase())} placeholder="VD: A1-01" focusColor="sky"/>
            <Field label="Tên vị trí"  value={form.name}          onChange={v=>set('name',v)}                        placeholder="VD: Kệ A hàng 1" focusColor="sky"/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <Field label="Khu (Zone)"    value={form.zone}  onChange={v=>set('zone',v)}  placeholder="VD: A"  focusColor="sky"/>
            <Field label="Lối đi (Aisle)" value={form.aisle} onChange={v=>set('aisle',v)} placeholder="VD: 01" focusColor="sky"/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <Field label="Kệ (Rack)" value={form.rack} onChange={v=>set('rack',v)} placeholder="VD: R1" focusColor="sky"/>
            <Field label="Ngăn (Bin)" value={form.bin}  onChange={v=>set('bin',v)}  placeholder="VD: B2" focusColor="sky"/>
          </div>

          {err&&<div style={{padding:'10px 14px',background:C.redL,borderRadius:10,color:C.red,fontSize:13,border:`1px solid rgba(220,38,38,0.25)`,display:'flex',alignItems:'center',gap:7}}><Warning size={14} weight="fill"/>{err}</div>}

          <div style={{display:'flex',gap:10,justifyContent:'flex-end',paddingTop:4,borderTop:`1px solid ${C.border}`}}>
            <button onClick={onClose}
              style={{padding:'9px 18px',borderRadius:10,border:`1.5px solid ${C.border}`,background:C.surface,color:C.text2,cursor:'pointer',fontWeight:600,fontSize:13.5,fontFamily:'Outfit,sans-serif',transition:'all 0.18s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.sky;e.currentTarget.style.color=C.sky;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.text2;}}>
              Huỷ
            </button>
            <button onClick={handleSave} disabled={saving}
              style={{display:'inline-flex',alignItems:'center',gap:7,padding:'9px 20px',border:'none',background:`linear-gradient(135deg,${C.skyD},${C.sky})`,borderRadius:10,color:'white',fontFamily:'Outfit,sans-serif',fontSize:13.5,fontWeight:700,cursor:saving?'not-allowed':'pointer',opacity:saving?0.75:1,boxShadow:'0 2px 12px rgba(2,132,199,0.28)',transition:'all 0.2s'}}
              onMouseEnter={e=>{if(!saving){e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 4px 18px rgba(2,132,199,0.38)';}}}
              onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 2px 12px rgba(2,132,199,0.28)';}}>
              {saving?<ArrowsClockwise size={14} style={{animation:'wh-spin 0.8s linear infinite'}}/>:<FloppyDisk size={14} weight="bold"/>}
              {saving?'Đang lưu...':'Lưu vị trí'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── ConfirmDialog ────────────────────────────────────────────── */
function ConfirmDialog({open, message, onConfirm, onCancel, loading}) {
  if(!open) return null;
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.55)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1200,backdropFilter:'blur(6px)',animation:'wh-fadein 0.2s ease'}}>
      <div style={{background:C.surface,borderRadius:20,padding:'28px 32px',width:380,boxShadow:'0 20px 60px rgba(0,0,0,0.16)',border:`1px solid ${C.border}`,animation:'wh-scalein 0.25s cubic-bezier(0.16,1,0.3,1)'}}>
        <div style={{width:48,height:48,borderRadius:13,background:C.redL,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',border:`1px solid rgba(220,38,38,0.2)`}}>
          <Warning size={24} color={C.red} weight="duotone"/>
        </div>
        <div style={{fontWeight:800,fontSize:16,color:C.text1,marginBottom:8,textAlign:'center'}}>Xác nhận xoá</div>
        <div style={{color:C.text2,fontSize:13.5,marginBottom:24,lineHeight:1.6,textAlign:'center'}}>{message}</div>
        <div style={{display:'flex',gap:10,justifyContent:'center'}}>
          <button onClick={onCancel}
            style={{padding:'9px 22px',borderRadius:10,border:`1.5px solid ${C.border}`,background:C.surface,color:C.text2,cursor:'pointer',fontWeight:600,fontSize:13.5,fontFamily:'Outfit,sans-serif',transition:'all 0.18s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.pink;e.currentTarget.style.color=C.pink;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.text2;}}>
            Huỷ
          </button>
          <button onClick={onConfirm} disabled={loading}
            style={{padding:'9px 22px',borderRadius:10,border:'none',background:`linear-gradient(135deg,${C.red},#b91c1c)`,color:'white',cursor:loading?'not-allowed':'pointer',fontWeight:700,fontSize:13.5,fontFamily:'Outfit,sans-serif',opacity:loading?0.7:1,boxShadow:'0 2px 10px rgba(220,38,38,0.25)',transition:'all 0.2s'}}
            onMouseEnter={e=>{if(!loading){e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 4px 14px rgba(220,38,38,0.35)';}}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 2px 10px rgba(220,38,38,0.25)';}}>
            {loading?'Đang xoá...':'Xác nhận xoá'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── LocationRow ──────────────────────────────────────────────── */
const LocationRow = ({loc, onEdit, onDelete}) => (
  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 14px',borderRadius:10,background:'#f8fafc',border:`1px solid ${C.border}`,marginBottom:7,transition:'all 0.18s',animation:'wh-fadein 0.3s ease'}}
    onMouseEnter={e=>{e.currentTarget.style.background=C.skyL;e.currentTarget.style.borderColor='rgba(2,132,199,0.25)';}}
    onMouseLeave={e=>{e.currentTarget.style.background='#f8fafc';e.currentTarget.style.borderColor=C.border;}}>
    <div style={{display:'flex',alignItems:'center',gap:10}}>
      <div style={{width:28,height:28,borderRadius:8,background:C.skyL,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        <MapPin size={13} color={C.sky} weight="fill"/>
      </div>
      <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:12.5,fontWeight:700,color:C.sky}}>{loc.location_code}</span>
      {loc.name&&<span style={{fontSize:13,color:C.text2}}>— {loc.name}</span>}
      {loc.zone&&<span style={{fontSize:11,padding:'2px 8px',background:C.skyL,borderRadius:7,color:C.sky,fontWeight:700,border:`1px solid rgba(2,132,199,0.2)`}}>Zone {loc.zone}</span>}
      {loc.rack&&<span style={{fontSize:11,color:C.text3}}>Kệ {loc.rack}</span>}
    </div>
    <div style={{display:'flex',gap:5}}>
      <ActBtn onClick={onEdit} hoverColor={C.sky} hoverBg={C.skyL} title="Sửa vị trí"><PencilSimple size={13}/></ActBtn>
      <ActBtn onClick={onDelete} hoverColor={C.red} hoverBg={C.redL} title="Xoá vị trí"><Trash size={13}/></ActBtn>
    </div>
  </div>
);

/* ── WarehouseCard ────────────────────────────────────────────── */
function WarehouseCard({w, onEdit, onDelete, onAddLocation, onEditLocation, onDeleteLocation}) {
  const [expanded,setExpanded]   = useState(false);
  const [locations,setLocations] = useState([]);
  const [loadingLoc,setLoadingLoc] = useState(false);

  const loadLocations = useCallback(async()=>{
    setLoadingLoc(true);
    try {
      const res = await api.get(`/warehouses/${w._id}/locations`);
      const d = res?.data?.data??res?.data??res;
      setLocations(Array.isArray(d)?d:[]);
    } catch { setLocations([]); }
    finally { setLoadingLoc(false); }
  },[w._id]);

  const handleExpand = () => { if(!expanded) loadLocations(); setExpanded(e=>!e); };

  const typeLabel = {main:'Kho chính',transit:'Trung chuyển',returns:'Trả hàng'}[w.type]||w.type||'Kho chính';
  const isActive  = w.status==='active'||w.is_active;

  return (
    <div style={{background:C.surface,borderRadius:20,border:`1px solid ${C.border}`,overflow:'hidden',boxShadow:'0 2px 10px rgba(0,0,0,0.05)',transition:'all 0.25s cubic-bezier(0.16,1,0.3,1)',animation:'wh-fadeup 0.4s cubic-bezier(0.16,1,0.3,1)'}}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 8px 32px rgba(0,0,0,0.10)';e.currentTarget.style.borderColor='rgba(190,24,93,0.15)';}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 2px 10px rgba(0,0,0,0.05)';e.currentTarget.style.borderColor=C.border;}}>

      {/* Top accent */}
      <div style={{height:3,background:isActive?`linear-gradient(90deg,${C.pink},#f472b6)`:`linear-gradient(90deg,${C.text3},#cbd5e1)`}}/>

      {/* Card body */}
      <div style={{padding:'18px 22px',display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'flex-start',gap:14}}>
          <div style={{width:46,height:46,borderRadius:14,background:isActive?`linear-gradient(135deg,${C.pinkL},#fce4ef)`:'#f1f5f9',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:isActive?'0 4px 12px rgba(190,24,93,0.15)':'none'}}>
            <Buildings size={23} color={isActive?C.pink:C.text3} weight="duotone"/>
          </div>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:6,flexWrap:'wrap'}}>
              <span style={{fontWeight:800,fontSize:15.5,color:C.text1}}>{w.name||w.warehouse_name}</span>
              {w.is_default&&(
                <span style={{fontSize:10.5,padding:'2px 8px',background:C.purpleL,border:'1px solid rgba(124,58,237,0.3)',borderRadius:7,color:C.purple,fontWeight:700,letterSpacing:'0.3px'}}>MẶC ĐỊNH</span>
              )}
              <StatusBadge active={isActive}/>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
              <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,fontWeight:700,color:C.pink,background:C.pinkL,padding:'2px 9px',borderRadius:6}}>{w.code||w.warehouse_code}</span>
              <span style={{fontSize:12.5,color:C.text3,background:'#f8fafc',padding:'2px 9px',borderRadius:6,border:`1px solid ${C.border}`}}>{typeLabel}</span>
              {(w.address?.full||typeof w.address==='string')&&(
                <span style={{fontSize:12.5,color:C.text3,display:'flex',alignItems:'center',gap:4}}>
                  <MapPin size={12}/>{typeof w.address==='string'?w.address:w.address?.full}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{display:'flex',alignItems:'center',gap:7,flexShrink:0}}>
          <button onClick={()=>onEdit(w)}
            style={{display:'inline-flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:9,border:`1.5px solid ${C.border}`,background:C.surface,color:C.text2,cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:'Outfit,sans-serif',transition:'all 0.18s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.pink;e.currentTarget.style.color=C.pink;e.currentTarget.style.background=C.pinkL;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.text2;e.currentTarget.style.background=C.surface;}}>
            <PencilSimple size={13}/> Sửa
          </button>
          <ActBtn onClick={()=>onDelete(w)} hoverColor={C.red} hoverBg={C.redL} title="Xoá kho"><Trash size={14}/></ActBtn>
        </div>
      </div>

      {/* Locations section */}
      <div style={{borderTop:`1px solid ${C.border2}`}}>
        <button onClick={handleExpand}
          style={{width:'100%',padding:'11px 22px',background:expanded?'#f0f9ff':'transparent',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:9,color:expanded?C.sky:C.text2,fontSize:13.5,fontWeight:600,fontFamily:'Outfit,sans-serif',textAlign:'left',transition:'all 0.18s'}}
          onMouseEnter={e=>{if(!expanded){e.currentTarget.style.background='#f8fafc';}}}
          onMouseLeave={e=>{if(!expanded){e.currentTarget.style.background='transparent';}}}>
          <div style={{width:22,height:22,borderRadius:6,background:expanded?C.skyL:'#f1f5f9',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s'}}>
            {expanded?<CaretDown size={12} color={C.sky} weight="bold"/>:<CaretRight size={12} color={C.text3} weight="bold"/>}
          </div>
          <MapPin size={14} color={expanded?C.sky:C.text3}/>
          <span>Vị trí trong kho</span>
          {locations.length>0&&(
            <span style={{fontSize:11.5,padding:'2px 9px',background:C.skyL,borderRadius:20,color:C.sky,fontWeight:700,border:`1px solid rgba(2,132,199,0.2)`}}>{locations.length} vị trí</span>
          )}
        </button>

        {expanded&&(
          <div style={{padding:'4px 22px 18px',background:'#f8fafc',borderTop:`1px dashed ${C.border}`}}>
            {loadingLoc ? (
              <div style={{padding:'12px 0',display:'flex',flexDirection:'column',gap:8}}>
                {[1,2].map(i=><Skel key={i} h={40} r={10}/>)}
              </div>
            ) : (
              <>
                {locations.length===0&&(
                  <div style={{textAlign:'center',padding:'16px 0',color:C.text3,fontSize:13,background:C.surface,borderRadius:10,border:`1.5px dashed ${C.border}`,margin:'8px 0'}}>
                    Chưa có vị trí nào trong kho này
                  </div>
                )}
                <div style={{paddingTop:8}}>
                  {locations.map(loc=>(
                    <LocationRow key={loc._id} loc={loc}
                      onEdit={()=>onEditLocation(w,loc,()=>loadLocations())}
                      onDelete={()=>onDeleteLocation(w,loc,()=>loadLocations())}/>
                  ))}
                </div>
                <button onClick={()=>onAddLocation(w,()=>loadLocations())}
                  style={{display:'inline-flex',alignItems:'center',gap:7,marginTop:4,padding:'8px 16px',borderRadius:10,border:`1.5px dashed rgba(2,132,199,0.35)`,background:C.skyL,color:C.sky,cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:'Outfit,sans-serif',transition:'all 0.18s'}}
                  onMouseEnter={e=>{e.currentTarget.style.background='#bae6fd';e.currentTarget.style.borderColor=C.sky;}}
                  onMouseLeave={e=>{e.currentTarget.style.background=C.skyL;e.currentTarget.style.borderColor='rgba(2,132,199,0.35)';}}>
                  <Plus size={14} weight="bold"/> Thêm vị trí
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────── */
export default function Warehouses() {
  const [warehouses,setWarehouses] = useState([]);
  const [loading,setLoading]       = useState(true);
  const [search,setSearch]         = useState('');
  const [whModal,setWhModal]       = useState({open:false,item:null});
  const [locModal,setLocModal]     = useState({open:false,warehouseId:null,item:null,onSaved:null});
  const [confirm,setConfirm]       = useState({open:false,message:'',onConfirm:null,loading:false});

  const load = useCallback(async()=>{
    setLoading(true);
    try {
      const res = await api.get('/warehouses');
      const d = res?.data?.data??res?.data??res;
      setWarehouses(Array.isArray(d)?d:[]);
    } catch { setWarehouses([]); }
    finally { setLoading(false); }
  },[]);

  useEffect(()=>{load();},[load]);

  const filtered = warehouses.filter(w=>{
    const q=search.toLowerCase();
    return !q||(w.name||w.warehouse_name||'').toLowerCase().includes(q)||(w.code||w.warehouse_code||'').toLowerCase().includes(q);
  });

  const handleDeleteWarehouse = (w)=>{
    setConfirm({
      open:true,
      message:`Xoá kho "${w.name||w.warehouse_name}"? Hành động này không thể hoàn tác.`,
      loading:false,
      onConfirm:async()=>{
        setConfirm(c=>({...c,loading:true}));
        try { await api.delete(`/warehouses/${w._id}`); setConfirm({open:false}); load(); }
        catch { setConfirm(c=>({...c,loading:false})); }
      },
    });
  };
  const handleAddLocation    = (w,cb)  => setLocModal({open:true,warehouseId:w._id,item:null,onSaved:cb});
  const handleEditLocation   = (w,loc,cb)=> setLocModal({open:true,warehouseId:w._id,item:loc,onSaved:cb});
  const handleDeleteLocation = (w,loc,cb)=>{
    setConfirm({
      open:true, message:`Xoá vị trí "${loc.location_code}"?`, loading:false,
      onConfirm:async()=>{
        setConfirm(c=>({...c,loading:true}));
        try { await api.delete(`/warehouses/${w._id}/locations/${loc._id}`); setConfirm({open:false}); cb(); }
        catch { setConfirm(c=>({...c,loading:false})); }
      },
    });
  };

  const activeCount = warehouses.filter(w=>w.status==='active'||w.is_active).length;
  const STATS = [
    {label:'Tổng kho',       value:warehouses.length,             color:C.pink,  bg:C.pinkL,  top:`linear-gradient(90deg,${C.pink},#f472b6)`},
    {label:'Đang hoạt động', value:activeCount,                   color:C.green, bg:C.greenL, top:`linear-gradient(90deg,${C.green},#34d399)`},
    {label:'Tạm ngưng',      value:warehouses.length-activeCount, color:C.red,   bg:C.redL,   top:`linear-gradient(90deg,${C.red},#f87171)`},
  ];

  return (
    <div style={{minHeight:'100vh',background:C.bg,fontFamily:'Outfit,sans-serif',padding:'28px 32px 56px'}}>

      {/* ══ HEADER ══ */}
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:22}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div style={{width:48,height:48,borderRadius:15,background:`linear-gradient(135deg,${C.pinkL},#fce4ef)`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 16px rgba(190,24,93,0.20)',flexShrink:0}}>
            <Warehouse size={24} color={C.pink} weight="duotone"/>
          </div>
          <div>
            <h1 style={{fontSize:22,fontWeight:800,color:C.text1,margin:0,letterSpacing:'-0.5px'}}>Kho Hàng</h1>
            <div style={{fontSize:13,color:C.text3,marginTop:3}}>Quản lý kho & vị trí lưu trữ</div>
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={load}
            style={{width:40,height:40,border:`1.5px solid ${C.border}`,background:C.surface,borderRadius:11,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:C.text3,transition:'all 0.2s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.pink;e.currentTarget.style.color=C.pink;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.text3;}}>
            <ArrowsClockwise size={16} weight="bold"/>
          </button>
          <button onClick={()=>setWhModal({open:true,item:null})}
            style={{display:'inline-flex',alignItems:'center',gap:7,padding:'10px 20px',background:`linear-gradient(135deg,${C.pink},${C.pinkD})`,border:'none',borderRadius:12,color:'white',fontFamily:'Outfit,sans-serif',fontSize:14,fontWeight:700,cursor:'pointer',boxShadow:'0 2px 12px rgba(190,24,93,0.30)',transition:'all 0.22s'}}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 6px 20px rgba(190,24,93,0.40)';}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 2px 12px rgba(190,24,93,0.30)';}}>
            <Plus size={15} weight="bold"/> Thêm kho
          </button>
        </div>
      </div>

      {/* ══ STAT TABS ══ */}
      <div style={{display:'flex',gap:12,marginBottom:22}}>
        {STATS.map(s=>(
          <div key={s.label}
            style={{background:C.surface,borderRadius:16,padding:'14px 20px',border:`1px solid ${C.border}`,boxShadow:'0 2px 8px rgba(0,0,0,0.04)',display:'flex',alignItems:'center',gap:12,position:'relative',overflow:'hidden',animation:'wh-fadeup 0.4s cubic-bezier(0.16,1,0.3,1)'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:'3px',background:s.top}}/>
            <div style={{width:40,height:40,borderRadius:11,background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <Warehouse size={20} color={s.color} weight="duotone"/>
            </div>
            <div>
              <div style={{fontSize:26,fontWeight:800,color:C.text1,lineHeight:1,fontFamily:'JetBrains Mono,monospace'}}>{s.value}</div>
              <div style={{fontSize:12.5,fontWeight:600,color:s.color,marginTop:3}}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ══ SEARCH ══ */}
      <div style={{position:'relative',maxWidth:420,marginBottom:18}}>
        <MagnifyingGlass size={15} color={C.text3} style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm kho theo tên hoặc mã..."
          style={{...inSx(),paddingLeft:38}}
          onFocus={fp} onBlur={br}/>
      </div>

      {/* ══ LIST ══ */}
      {loading ? (
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {[1,2,3].map(i=>(
            <div key={i} style={{background:C.surface,borderRadius:20,border:`1px solid ${C.border}`,padding:'20px 22px',boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
              <div style={{display:'flex',gap:14,alignItems:'center'}}>
                <Skel h={46} w={46} r={14}/>
                <div style={{flex:1,display:'flex',flexDirection:'column',gap:8}}>
                  <Skel h={16} w="40%"/>
                  <Skel h={12} w="60%"/>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length===0 ? (
        <div style={{textAlign:'center',padding:'64px 20px',display:'flex',flexDirection:'column',alignItems:'center',gap:14}}>
          <div style={{width:72,height:72,background:C.pinkL,borderRadius:20,display:'flex',alignItems:'center',justifyContent:'center',border:`1.5px dashed rgba(190,24,93,0.3)`,animation:'wh-float 3s ease-in-out infinite'}}>
            <Buildings size={32} color={C.pink}/>
          </div>
          <div style={{fontSize:15,fontWeight:700,color:C.text2}}>{search?'Không tìm thấy kho phù hợp':'Chưa có kho nào'}</div>
          {!search&&(
            <button onClick={()=>setWhModal({open:true,item:null})}
              style={{display:'inline-flex',alignItems:'center',gap:7,padding:'10px 22px',border:'none',background:`linear-gradient(135deg,${C.pink},${C.pinkD})`,borderRadius:11,color:'white',fontFamily:'Outfit,sans-serif',fontSize:14,fontWeight:700,cursor:'pointer',boxShadow:'0 2px 12px rgba(190,24,93,0.28)'}}>
              <Plus size={15} weight="bold"/> Thêm kho đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {filtered.map(w=>(
            <WarehouseCard key={w._id} w={w}
              onEdit={item=>setWhModal({open:true,item})}
              onDelete={handleDeleteWarehouse}
              onAddLocation={handleAddLocation}
              onEditLocation={handleEditLocation}
              onDeleteLocation={handleDeleteLocation}/>
          ))}
        </div>
      )}

      <WarehouseModal open={whModal.open} item={whModal.item} onClose={()=>setWhModal({open:false,item:null})} onSaved={()=>{setWhModal({open:false,item:null});load();}}/>
      <LocationModal  open={locModal.open} warehouseId={locModal.warehouseId} item={locModal.item} onClose={()=>setLocModal({open:false,warehouseId:null,item:null,onSaved:null})} onSaved={()=>{setLocModal(l=>({...l,open:false}));locModal.onSaved?.();}}/>
      <ConfirmDialog  open={confirm.open} message={confirm.message} loading={confirm.loading} onConfirm={confirm.onConfirm} onCancel={()=>setConfirm({open:false})}/>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
        @keyframes wh-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes wh-fadeup{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes wh-fadein{from{opacity:0}to{opacity:1}}
        @keyframes wh-scalein{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
        @keyframes wh-spin{to{transform:rotate(360deg)}}
        @keyframes wh-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
      `}</style>
    </div>
  );
}