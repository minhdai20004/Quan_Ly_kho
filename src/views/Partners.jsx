// ================================================================
//  WMS — PARTNERS  v3.1  (fixed: real DB schema)
//  Paste to: src/views/Partners.jsx
// ================================================================
import { useState, useEffect, useCallback } from 'react';
import {
  Handshake, Plus, MagnifyingGlass, PencilSimple, Trash,
  X, FloppyDisk, ArrowsClockwise, Phone, Envelope,
  User, Truck, CheckCircle, XCircle,
  IdentificationCard, MapPin, Warning, Buildings,
} from '@phosphor-icons/react';
import api from '../services/api';

/* ── Tokens ───────────────────────────────────────────────────── */
const C = {
  pink:'#be185d', pinkD:'#9d174d', pinkL:'#fce7f3',
  sky:'#0284c7',  skyL:'#e0f2fe',
  green:'#059669',greenL:'#d1fae5',
  red:'#dc2626',  redL:'#fee2e2',
  amber:'#d97706',amberL:'#fef3c7',
  purple:'#7c3aed',purpleL:'#ede9fe',
  bg:'#f0f4f8', surface:'#ffffff',
  border:'#e2e8f0', border2:'#f1f5f9',
  text1:'#1e293b', text2:'#475569', text3:'#94a3b8',
};

// Actual supplier_type values from DB
const SUPPLIER_TYPES = [
  { value:'distributor', label:'Nhà phân phối' },
  { value:'manufacturer',label:'Nhà sản xuất' },
  { value:'retailer',    label:'Nhà bán lẻ' },
  { value:'service',     label:'Dịch vụ' },
  { value:'other',       label:'Khác' },
];

const SUPPLIER_TYPE_META = {
  distributor: { label:'Nhà phân phối', color:C.sky,    bg:C.skyL,    Icon:Truck },
  manufacturer:{ label:'Nhà sản xuất',  color:C.purple, bg:C.purpleL, Icon:Buildings },
  retailer:    { label:'Nhà bán lẻ',    color:C.amber,  bg:C.amberL,  Icon:Handshake },
  service:     { label:'Dịch vụ',       color:C.green,  bg:C.greenL,  Icon:IdentificationCard },
  other:       { label:'Khác',          color:C.text3,  bg:C.border2, Icon:User },
};

const emptyForm = {
  name: '', code: '', short_name: '',
  supplier_type: 'distributor',
  contact_name: '', contact_phone: '', contact_email: '', contact_position: '',
  address_full: '', tax_id: '',
  payment_terms: 'Net30', status: 'active', notes: '',
};

const inSx = (disabled=false) => ({
  width:'100%', padding:'9px 12px',
  border:`1.5px solid ${C.border}`, borderRadius:10,
  background:disabled?'#f8fafc':C.surface,
  fontFamily:'Outfit,sans-serif', fontSize:13.5,
  color:C.text1, outline:'none',
  transition:'border-color 0.2s, box-shadow 0.2s', boxSizing:'border-box',
});
const fp = e=>{e.target.style.borderColor=C.pink;e.target.style.boxShadow=`0 0 0 3px rgba(190,24,93,0.10)`;};
const br = e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow='none';};

/* ── Skel ─────────────────────────────────────────────────────── */
const Skel = ({w='100%',h=13,r=6}) => (
  <div style={{width:w,height:h,borderRadius:r,background:'linear-gradient(90deg,#f1f5f9 25%,#e8edf3 50%,#f1f5f9 75%)',backgroundSize:'200% 100%',animation:'pt-shimmer 1.5s ease-in-out infinite'}}/>
);

/* ── Badges ───────────────────────────────────────────────────── */
const StatusBadge = ({active}) => (
  <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:8,fontSize:11,fontWeight:700,background:active?C.greenL:C.redL,color:active?C.green:C.red,border:`1px solid ${active?'rgba(5,150,105,0.25)':'rgba(220,38,38,0.25)'}`}}>
    {active?<CheckCircle size={11} weight="fill"/>:<XCircle size={11} weight="fill"/>}
    {active?'Hoạt động':'Ngừng'}
  </span>
);

const TypeBadge = ({type}) => {
  const m = SUPPLIER_TYPE_META[type] || {label:type||'—',color:C.text3,bg:C.border2,Icon:User};
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:8,fontSize:11,fontWeight:700,background:m.bg,color:m.color,border:`1px solid ${m.color}30`}}>
      <m.Icon size={11} weight="fill"/>{m.label}
    </span>
  );
};

/* ── ActBtn ───────────────────────────────────────────────────── */
const ActBtn = ({children,onClick,hoverColor=C.pink,hoverBg=C.pinkL,title}) => (
  <button title={title} onClick={onClick}
    style={{width:30,height:30,border:`1.5px solid ${C.border}`,background:C.surface,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:C.text3,transition:'all 0.18s'}}
    onMouseEnter={e=>{e.currentTarget.style.color=hoverColor;e.currentTarget.style.background=hoverBg;e.currentTarget.style.borderColor=hoverColor;}}
    onMouseLeave={e=>{e.currentTarget.style.color=C.text3;e.currentTarget.style.background=C.surface;e.currentTarget.style.borderColor=C.border;}}>
    {children}
  </button>
);

/* ── Field atoms ──────────────────────────────────────────────── */
const Field = ({label,value,onChange,placeholder,disabled,type='text'}) => (
  <div style={{display:'flex',flexDirection:'column',gap:5}}>
    <label style={{fontSize:11.5,fontWeight:700,color:C.text2,textTransform:'uppercase',letterSpacing:'0.5px'}}>{label}</label>
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
      style={inSx(disabled)} onFocus={disabled?undefined:fp} onBlur={br}/>
  </div>
);

const SelectField = ({label,value,onChange,options}) => (
  <div style={{display:'flex',flexDirection:'column',gap:5}}>
    <label style={{fontSize:11.5,fontWeight:700,color:C.text2,textTransform:'uppercase',letterSpacing:'0.5px'}}>{label}</label>
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{...inSx(),appearance:'none',cursor:'pointer'}}
      onFocus={fp} onBlur={br}>
      {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

/* ── PartnerModal ─────────────────────────────────────────────── */
function PartnerModal({open, item, onClose, onSaved}) {
  const [form,setForm]     = useState(emptyForm);
  const [saving,setSaving] = useState(false);
  const [err,setErr]       = useState('');

  useEffect(()=>{
    if(!open) return;
    if(item){
      setForm({
        name:             item.name||'',
        code:             item.code||'',
        short_name:       item.short_name||'',
        supplier_type:    item.supplier_type||'distributor',
        contact_name:     item.contact?.name||'',
        contact_phone:    item.contact?.phone||'',
        contact_email:    item.contact?.email||'',
        contact_position: item.contact?.position||'',
        address_full:     item.address?.full_address||item.address?.street||'',
        tax_id:           item.business?.tax_id||'',
        payment_terms:    item.payment_terms||'Net30',
        status:           item.status||'active',
        notes:            item.business?.notes||'',
      });
    } else {
      setForm(emptyForm);
    }
    setErr('');
  },[open,item]);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSave = async()=>{
    if(!form.name.trim()) return setErr('Nhập tên đối tác');
    if(!form.code.trim()) return setErr('Nhập mã đối tác');
    setSaving(true); setErr('');
    try {
      // Build payload matching actual DB schema
      const payload = {
        name:          form.name,
        code:          form.code.toUpperCase(),
        short_name:    form.short_name,
        supplier_type: form.supplier_type,
        contact: {
          name:     form.contact_name,
          phone:    form.contact_phone,
          email:    form.contact_email,
          position: form.contact_position,
        },
        address: {
          full_address: form.address_full,
        },
        business: {
          tax_id: form.tax_id,
          notes:  form.notes,
        },
        payment_terms: form.payment_terms,
        status: form.status,
      };
      if(item) await api.put(`/partners/${item._id}`, payload);
      else     await api.post('/partners', payload);
      onSaved();
    } catch(e) { setErr(e.message||'Lỗi server'); }
    finally { setSaving(false); }
  };

  if(!open) return null;

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.52)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,backdropFilter:'blur(7px)',padding:'20px',animation:'pt-fadein 0.2s ease',overflowY:'auto'}}>
      <div style={{background:C.surface,borderRadius:24,width:'100%',maxWidth:600,maxHeight:'90vh',overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'0 24px 64px rgba(0,0,0,0.16)',border:`1px solid ${C.border}`,animation:'pt-scalein 0.3s cubic-bezier(0.16,1,0.3,1)'}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 22px',background:'linear-gradient(135deg,#fdf2f8,#fce7f3)',borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:11}}>
            <div style={{width:42,height:42,borderRadius:13,background:`linear-gradient(135deg,${C.pink},${C.pinkD})`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 12px rgba(190,24,93,0.28)'}}>
              <Handshake size={21} color="#fff" weight="duotone"/>
            </div>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:C.text1}}>{item?'Chỉnh sửa đối tác':'Thêm đối tác mới'}</div>
              <div style={{fontSize:12,color:C.pink,marginTop:1}}>{item?`Đang sửa: ${item.name}`:'Điền thông tin đối tác'}</div>
            </div>
          </div>
          <button onClick={onClose}
            style={{width:32,height:32,border:`1.5px solid ${C.border}`,background:C.surface,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:C.text3,transition:'all 0.18s'}}
            onMouseEnter={e=>{e.currentTarget.style.background=C.redL;e.currentTarget.style.color=C.red;}}
            onMouseLeave={e=>{e.currentTarget.style.background=C.surface;e.currentTarget.style.color=C.text3;}}>
            <X size={14}/>
          </button>
        </div>

        {/* Body */}
        <div style={{overflowY:'auto',padding:'20px 22px',display:'flex',flexDirection:'column',gap:14}}>

          {/* Thông tin cơ bản */}
          <div style={{fontSize:11.5,fontWeight:800,color:C.pink,textTransform:'uppercase',letterSpacing:'1px',paddingBottom:4,borderBottom:`1px solid ${C.pinkL}`}}>Thông tin cơ bản</div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <Field label="Mã đối tác *" value={form.code} onChange={v=>set('code',v.toUpperCase())} placeholder="VD: SUP-001" disabled={!!item}/>
            <SelectField label="Loại đối tác" value={form.supplier_type} onChange={v=>set('supplier_type',v)} options={SUPPLIER_TYPES}/>
          </div>

          <Field label="Tên đối tác *" value={form.name} onChange={v=>set('name',v)} placeholder="Tên công ty hoặc cá nhân"/>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <Field label="Tên viết tắt" value={form.short_name} onChange={v=>set('short_name',v)} placeholder="VD: Việt Xanh Food"/>
            <SelectField label="Điều khoản TT" value={form.payment_terms} onChange={v=>set('payment_terms',v)}
              options={['Net15','Net30','Net45','Net60','COD'].map(v=>({value:v,label:v}))}/>
          </div>

          {/* Liên hệ */}
          <div style={{fontSize:11.5,fontWeight:800,color:C.sky,textTransform:'uppercase',letterSpacing:'1px',paddingBottom:4,borderBottom:`1px solid ${C.skyL}`,marginTop:4}}>Thông tin liên hệ</div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <Field label="Người liên hệ" value={form.contact_name} onChange={v=>set('contact_name',v)} placeholder="Họ tên"/>
            <Field label="Chức vụ" value={form.contact_position} onChange={v=>set('contact_position',v)} placeholder="VD: Giám đốc kinh doanh"/>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <Field label="Số điện thoại" value={form.contact_phone} onChange={v=>set('contact_phone',v)} placeholder="0901 234 567" type="tel"/>
            <Field label="Email" value={form.contact_email} onChange={v=>set('contact_email',v)} placeholder="email@company.com" type="email"/>
          </div>

          {/* Địa chỉ & thuế */}
          <div style={{fontSize:11.5,fontWeight:800,color:C.purple,textTransform:'uppercase',letterSpacing:'1px',paddingBottom:4,borderBottom:`1px solid ${C.purpleL}`,marginTop:4}}>Địa chỉ & Pháp lý</div>

          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:14}}>
            <Field label="Địa chỉ đầy đủ" value={form.address_full} onChange={v=>set('address_full',v)} placeholder="Số nhà, đường, phường, quận, tỉnh"/>
            <Field label="Mã số thuế" value={form.tax_id} onChange={v=>set('tax_id',v)} placeholder="0301234567"/>
          </div>

          {/* Status */}
          <div style={{display:'flex',flexDirection:'column',gap:5}}>
            <label style={{fontSize:11.5,fontWeight:700,color:C.text2,textTransform:'uppercase',letterSpacing:'0.5px'}}>Trạng thái</label>
            <div style={{display:'flex',gap:8}}>
              {[{v:'active',label:'Hoạt động',color:C.green,bg:C.greenL},{v:'inactive',label:'Ngừng hợp tác',color:C.red,bg:C.redL}].map(opt=>(
                <button key={opt.v} type="button" onClick={()=>set('status',opt.v)}
                  style={{flex:1,padding:'8px 14px',borderRadius:10,border:`1.5px solid ${form.status===opt.v?opt.color:C.border}`,background:form.status===opt.v?opt.bg:C.surface,color:form.status===opt.v?opt.color:C.text2,fontFamily:'Outfit,sans-serif',fontSize:13,fontWeight:600,cursor:'pointer',transition:'all 0.18s',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                  {form.status===opt.v&&<CheckCircle size={13} weight="fill"/>}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div style={{display:'flex',flexDirection:'column',gap:5}}>
            <label style={{fontSize:11.5,fontWeight:700,color:C.text2,textTransform:'uppercase',letterSpacing:'0.5px'}}>Ghi chú</label>
            <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Ghi chú thêm..." rows={3}
              style={{...inSx(),resize:'none',lineHeight:1.6}}
              onFocus={fp} onBlur={br}/>
          </div>

          {err&&<div style={{padding:'10px 14px',background:C.redL,borderRadius:10,color:C.red,fontSize:13,border:`1px solid rgba(220,38,38,0.25)`,display:'flex',alignItems:'center',gap:7}}><Warning size={14} weight="fill"/>{err}</div>}
        </div>

        {/* Footer */}
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',padding:'14px 22px 18px',borderTop:`1px solid ${C.border}`,background:'#f8fafc',flexShrink:0}}>
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
            {saving?<ArrowsClockwise size={14} style={{animation:'pt-spin 0.8s linear infinite'}}/>:<FloppyDisk size={14} weight="bold"/>}
            {saving?'Đang lưu...':'Lưu đối tác'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── ConfirmDialog ────────────────────────────────────────────── */
function ConfirmDialog({open, message, onConfirm, onCancel, loading}) {
  if(!open) return null;
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.55)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1100,backdropFilter:'blur(6px)',animation:'pt-fadein 0.2s ease'}}>
      <div style={{background:C.surface,borderRadius:20,padding:'28px 32px',width:380,boxShadow:'0 20px 60px rgba(0,0,0,0.16)',border:`1px solid ${C.border}`,animation:'pt-scalein 0.25s cubic-bezier(0.16,1,0.3,1)'}}>
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
            style={{padding:'9px 22px',borderRadius:10,border:'none',background:`linear-gradient(135deg,${C.red},#b91c1c)`,color:'white',cursor:loading?'not-allowed':'pointer',fontWeight:700,fontSize:13.5,fontFamily:'Outfit,sans-serif',opacity:loading?0.7:1,boxShadow:'0 2px 10px rgba(220,38,38,0.25)',transition:'all 0.2s'}}>
            {loading?'Đang xoá...':'Xác nhận xoá'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────── */
export default function Partners() {
  const [partners,setPartners]     = useState([]);
  const [loading,setLoading]       = useState(true);
  const [search,setSearch]         = useState('');
  const [typeFilter,setTypeFilter] = useState('all');
  const [modal,setModal]           = useState({open:false,item:null});
  const [confirm,setConfirm]       = useState({open:false,message:'',onConfirm:null,loading:false});

  const load = useCallback(async()=>{
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if(typeFilter!=='all') params.set('supplier_type', typeFilter);
      if(search) params.set('search', search);
      const res = await api.get(`/partners?${params}`);
      // API returns { data: [...] }
      const d = res?.data ?? res;
      setPartners(Array.isArray(d) ? d : []);
    } catch { setPartners([]); }
    finally { setLoading(false); }
  },[typeFilter, search]);

  useEffect(()=>{ load(); },[load]);

  const handleDelete = (p)=>{
    setConfirm({
      open:true,
      message:`Xoá đối tác "${p.name}"? Hành động này không thể hoàn tác.`,
      loading:false,
      onConfirm:async()=>{
        setConfirm(c=>({...c,loading:true}));
        try { await api.delete(`/partners/${p._id}`); setConfirm({open:false}); load(); }
        catch { setConfirm(c=>({...c,loading:false})); }
      },
    });
  };

  // Stats by supplier_type
  const typeKeys = ['distributor','manufacturer','retailer','service','other'];
  const stats = {
    all: partners.length,
    ...Object.fromEntries(typeKeys.map(k=>[k, partners.filter(p=>p.supplier_type===k).length])),
  };

  const TAB_DEFS = [
    {key:'all',        label:'Tất cả',         color:C.pink,   bg:C.pinkL,   top:`linear-gradient(90deg,${C.pink},#f472b6)`,    Icon:Handshake},
    {key:'distributor',label:'Nhà phân phối',   color:C.sky,    bg:C.skyL,    top:`linear-gradient(90deg,${C.sky},#38bdf8)`,     Icon:Truck},
    {key:'manufacturer',label:'Nhà sản xuất',   color:C.purple, bg:C.purpleL, top:`linear-gradient(90deg,${C.purple},#a78bfa)`,  Icon:Buildings},
    {key:'retailer',   label:'Nhà bán lẻ',      color:C.amber,  bg:C.amberL,  top:`linear-gradient(90deg,${C.amber},#fbbf24)`,   Icon:Handshake},
    {key:'service',    label:'Dịch vụ',         color:C.green,  bg:C.greenL,  top:`linear-gradient(90deg,${C.green},#34d399)`,   Icon:IdentificationCard},
  ];

  return (
    <div style={{minHeight:'100vh',background:C.bg,fontFamily:'Outfit,sans-serif',padding:'28px 32px 56px'}}>

      {/* ══ HEADER ══ */}
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:22}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div style={{width:48,height:48,borderRadius:15,background:`linear-gradient(135deg,${C.pinkL},#fce4ef)`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 16px rgba(190,24,93,0.20)',flexShrink:0}}>
            <Handshake size={24} color={C.pink} weight="duotone"/>
          </div>
          <div>
            <h1 style={{fontSize:22,fontWeight:800,color:C.text1,margin:0,letterSpacing:'-0.5px'}}>Đối Tác</h1>
            <div style={{fontSize:13,color:C.text3,marginTop:3}}>Nhà cung cấp, khách hàng & nhân viên</div>
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={load}
            style={{width:40,height:40,border:`1.5px solid ${C.border}`,background:C.surface,borderRadius:11,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:C.text3,transition:'all 0.2s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.pink;e.currentTarget.style.color=C.pink;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.text3;}}>
            <ArrowsClockwise size={16} weight="bold"/>
          </button>
          <button onClick={()=>setModal({open:true,item:null})}
            style={{display:'inline-flex',alignItems:'center',gap:7,padding:'10px 20px',background:`linear-gradient(135deg,${C.pink},${C.pinkD})`,border:'none',borderRadius:12,color:'white',fontFamily:'Outfit,sans-serif',fontSize:14,fontWeight:700,cursor:'pointer',boxShadow:'0 2px 12px rgba(190,24,93,0.30)',transition:'all 0.22s'}}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 6px 20px rgba(190,24,93,0.40)';}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 2px 12px rgba(190,24,93,0.30)';}}>
            <Plus size={15} weight="bold"/> Thêm đối tác
          </button>
        </div>
      </div>

      {/* ══ STAT TABS ══ */}
      <div style={{display:'flex',gap:10,marginBottom:22,flexWrap:'wrap'}}>
        {TAB_DEFS.map(({key,label,color,bg,top,Icon})=>{
          const active = typeFilter===key;
          return (
            <button key={key} onClick={()=>setTypeFilter(key)}
              style={{display:'flex',alignItems:'center',gap:10,padding:'11px 16px',background:C.surface,borderRadius:16,border:`1.5px solid ${active?color:C.border}`,cursor:'pointer',transition:'all 0.22s',boxShadow:active?`0 2px 10px ${color}25`:'0 1px 4px rgba(0,0,0,0.04)',position:'relative',overflow:'hidden',fontFamily:'Outfit,sans-serif'}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:'3px',background:active?top:'transparent',transition:'background 0.2s'}}/>
              <div style={{width:36,height:36,borderRadius:10,background:bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <Icon size={17} color={color} weight="duotone"/>
              </div>
              <div style={{textAlign:'left'}}>
                <div style={{fontSize:20,fontWeight:800,color:active?color:C.text1,lineHeight:1,fontFamily:'JetBrains Mono,monospace'}}>{stats[key]??0}</div>
                <div style={{fontSize:11.5,fontWeight:600,color:active?color:C.text3,marginTop:2,whiteSpace:'nowrap'}}>{label}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ══ TOOLBAR ══ */}
      <div style={{display:'flex',gap:10,marginBottom:18,alignItems:'center',flexWrap:'wrap'}}>
        <div style={{position:'relative',flex:1,maxWidth:420}}>
          <MagnifyingGlass size={15} color={C.text3} style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm theo tên, mã, SĐT..."
            style={{...inSx(),paddingLeft:38}} onFocus={fp} onBlur={br}/>
        </div>
      </div>

      {/* ══ TABLE ══ */}
      <div style={{background:C.surface,borderRadius:20,border:`1px solid ${C.border}`,boxShadow:'0 4px 20px rgba(0,0,0,0.05)',overflow:'hidden',animation:'pt-fadeup 0.4s cubic-bezier(0.16,1,0.3,1)'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13.5}}>
          <thead>
            <tr style={{background:'#f8fafc',borderBottom:`1.5px solid ${C.border2}`}}>
              {['#','MÃ','TÊN ĐỐI TÁC','LOẠI','LIÊN HỆ','ĐỊA CHỈ','TRẠNG THÁI','THAO TÁC'].map((h,i)=>(
                <th key={h} style={{padding:'12px 16px',textAlign:i===7?'right':'left',fontSize:10.5,fontWeight:700,color:C.text3,letterSpacing:'0.8px',whiteSpace:'nowrap'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${C.border2}`}}>
                  {[...Array(8)].map((_,j)=><td key={j} style={{padding:'14px 16px'}}><Skel h={13} w={j===2?'65%':'50%'}/></td>)}
                </tr>
              ))
            ) : partners.length===0 ? (
              <tr>
                <td colSpan={8} style={{padding:'60px 20px',textAlign:'center'}}>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
                    <div style={{width:64,height:64,background:C.pinkL,borderRadius:18,display:'flex',alignItems:'center',justifyContent:'center',border:`1.5px dashed rgba(190,24,93,0.3)`,animation:'pt-float 3s ease-in-out infinite'}}>
                      <Handshake size={28} color={C.pink}/>
                    </div>
                    <div style={{fontSize:14,fontWeight:600,color:C.text2}}>
                      {search||typeFilter!=='all'?'Không tìm thấy đối tác phù hợp':'Chưa có đối tác nào'}
                    </div>
                    {!search&&typeFilter==='all'&&(
                      <button onClick={()=>setModal({open:true,item:null})}
                        style={{marginTop:4,display:'inline-flex',alignItems:'center',gap:7,padding:'9px 20px',border:'none',background:`linear-gradient(135deg,${C.pink},${C.pinkD})`,borderRadius:10,color:'white',fontFamily:'Outfit,sans-serif',fontSize:13.5,fontWeight:700,cursor:'pointer',boxShadow:'0 2px 10px rgba(190,24,93,0.28)'}}>
                        <Plus size={14} weight="bold"/> Thêm đối tác đầu tiên
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : partners.map((p,i)=>(
              <tr key={p._id}
                style={{borderBottom:`1px solid ${C.border2}`,transition:'background 0.15s',animation:`pt-fadeup 0.35s cubic-bezier(0.16,1,0.3,1) ${i*25}ms both`}}
                onMouseEnter={e=>e.currentTarget.style.background='#fdfbfe'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>

                {/* # */}
                <td style={{padding:'13px 16px',color:C.text3,fontSize:12,fontFamily:'JetBrains Mono,monospace',fontWeight:700}}>{i+1}</td>

                {/* Mã */}
                <td style={{padding:'13px 16px'}}>
                  <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,fontWeight:700,color:C.pink,background:C.pinkL,padding:'3px 9px',borderRadius:7}}>
                    {p.code||p.supplier_id||'—'}
                  </span>
                </td>

                {/* Tên */}
                <td style={{padding:'13px 16px'}}>
                  <div style={{fontWeight:700,fontSize:14,color:C.text1}}>{p.name||'—'}</div>
                  {p.short_name&&<div style={{fontSize:12,color:C.text3,marginTop:2}}>{p.short_name}</div>}
                  {p.contact?.name&&<div style={{fontSize:12,color:C.text3,marginTop:1}}>Liên hệ: {p.contact.name}</div>}
                </td>

                {/* Loại */}
                <td style={{padding:'13px 16px'}}><TypeBadge type={p.supplier_type}/></td>

                {/* Liên hệ */}
                <td style={{padding:'13px 16px'}}>
                  <div style={{display:'flex',flexDirection:'column',gap:4}}>
                    {p.contact?.phone&&(
                      <span style={{display:'flex',alignItems:'center',gap:6,fontSize:13,color:C.text2}}>
                        <Phone size={12} color={C.text3}/>{p.contact.phone}
                      </span>
                    )}
                    {p.contact?.email&&(
                      <span style={{display:'flex',alignItems:'center',gap:6,fontSize:12.5,color:C.text3}}>
                        <Envelope size={12}/>{p.contact.email}
                      </span>
                    )}
                    {!p.contact?.phone&&!p.contact?.email&&<span style={{color:C.text3,fontSize:13}}>—</span>}
                  </div>
                </td>

                {/* Địa chỉ */}
                <td style={{padding:'13px 16px',maxWidth:200}}>
                  {(p.address?.full_address||p.address?.street)
                    ? <span style={{display:'flex',alignItems:'flex-start',gap:5,fontSize:13,color:C.text2}}>
                        <MapPin size={13} color={C.text3} style={{marginTop:2,flexShrink:0}}/>
                        <span style={{overflow:'hidden',textOverflow:'ellipsis',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>
                          {p.address.full_address||p.address.street}
                        </span>
                      </span>
                    : <span style={{color:C.text3,fontSize:13}}>—</span>
                  }
                </td>

                {/* Trạng thái */}
                <td style={{padding:'13px 16px'}}><StatusBadge active={p.status==='active'}/></td>

                {/* Thao tác */}
                <td style={{padding:'13px 16px'}}>
                  <div style={{display:'flex',gap:5,justifyContent:'flex-end'}}>
                    <ActBtn onClick={()=>setModal({open:true,item:p})} hoverColor={C.sky} hoverBg={C.skyL} title="Sửa đối tác"><PencilSimple size={13}/></ActBtn>
                    <ActBtn onClick={()=>handleDelete(p)} hoverColor={C.red} hoverBg={C.redL} title="Xoá đối tác"><Trash size={13}/></ActBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading&&partners.length>0&&(
          <div style={{padding:'13px 20px',borderTop:`1px solid ${C.border2}`,fontSize:13,color:C.text3,background:'#fafbfc'}}>
            Hiển thị <strong style={{color:C.text2,fontFamily:'JetBrains Mono,monospace'}}>{partners.length}</strong> đối tác
          </div>
        )}
      </div>

      <PartnerModal
        open={modal.open} item={modal.item}
        onClose={()=>setModal({open:false,item:null})}
        onSaved={()=>{ setModal({open:false,item:null}); load(); }}
      />
      <ConfirmDialog
        open={confirm.open} message={confirm.message} loading={confirm.loading}
        onConfirm={confirm.onConfirm} onCancel={()=>setConfirm({open:false})}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
        @keyframes pt-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes pt-fadeup{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pt-fadein{from{opacity:0}to{opacity:1}}
        @keyframes pt-scalein{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
        @keyframes pt-spin{to{transform:rotate(360deg)}}
        @keyframes pt-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
      `}</style>
    </div>
  );
}