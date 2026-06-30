// ================================================================
//  WMS — OUTBOUND ISSUES  v3.2  (+ auto-fill selling_price)
//  Paste to: src/views/OutboundIssues.jsx
// ================================================================
import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowSquareOut, Plus, MagnifyingGlass, PencilSimple, Trash,
  X, FloppyDisk, ArrowsClockwise, CheckCircle, XCircle,
  ClockCounterClockwise, Warehouse, Handshake,
  CaretDown, Warning, Eye, Prohibit, Tag,
} from '@phosphor-icons/react';
import api from '../services/api';

/* ── Tokens ───────────────────────────────────────────────────── */
const C = {
  pink:'#be185d', pinkD:'#9d174d', pinkL:'#fce7f3',
  green:'#059669', greenL:'#d1fae5',
  red:'#dc2626',   redL:'#fee2e2',
  amber:'#d97706', amberL:'#fef3c7',
  sky:'#0284c7',   skyL:'#e0f2fe',
  purple:'#7c3aed',purpleL:'#ede9fe',
  bg:'#f0f4f8', surface:'#ffffff',
  border:'#e2e8f0', border2:'#f1f5f9',
  text1:'#1e293b', text2:'#475569', text3:'#94a3b8',
};

const STATUS_META = {
  draft:     { label:'Nháp',       color:C.amber, bg:C.amberL, Icon:ClockCounterClockwise },
  confirmed: { label:'Hoàn thành', color:C.green, bg:C.greenL, Icon:CheckCircle },
  cancelled: { label:'Đã huỷ',     color:C.red,   bg:C.redL,   Icon:XCircle },
};

const emptyItem = { material_id:'', material_name:'', material_code:'', quantity:1, unit_cost:0, total_cost:0, note:'' };
const emptyForm = { warehouse_id:'', partner_id:'', issue_date:new Date().toISOString().slice(0,10), note:'', items:[] };

const fmt    = n => Number(n||0).toLocaleString('vi-VN');
const fmtCur = n => Number(n||0).toLocaleString('vi-VN',{style:'currency',currency:'VND'});
const fmtDate = d => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
const parseList = raw => Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];

/* ── Input helpers ────────────────────────────────────────────── */
const inSx = (err=false) => ({
  width:'100%', padding:'9px 12px',
  border:`1.5px solid ${err?C.red:C.border}`, borderRadius:10,
  background:C.surface, fontFamily:'Outfit, sans-serif', fontSize:13.5,
  color:C.text1, outline:'none',
  transition:'border-color 0.2s, box-shadow 0.2s', boxSizing:'border-box',
  boxShadow: err?`0 0 0 3px rgba(220,38,38,0.10)`:'none',
});
const fp = e=>{e.target.style.borderColor=C.pink;e.target.style.boxShadow=`0 0 0 3px rgba(190,24,93,0.10)`;};
const br = e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow='none';};

/* ── Shimmer ──────────────────────────────────────────────────── */
const Skel = ({w='100%',h=13,r=6}) => (
  <div style={{width:w,height:h,borderRadius:r,background:'linear-gradient(90deg,#f1f5f9 25%,#e8edf3 50%,#f1f5f9 75%)',backgroundSize:'200% 100%',animation:'ob-shimmer 1.5s ease-in-out infinite'}}/>
);

/* ── Status Badge ─────────────────────────────────────────────── */
const StatusBadge = ({status}) => {
  const m = STATUS_META[status]||{label:status,color:C.text3,bg:C.border2,Icon:ClockCounterClockwise};
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:8,fontSize:11,fontWeight:700,background:m.bg,color:m.color,border:`1px solid ${m.color}30`}}>
      <m.Icon size={11} weight="bold"/>{m.label}
    </span>
  );
};

/* ── ActBtn ───────────────────────────────────────────────────── */
function ActBtn({title,onClick,hoverColor=C.sky,hoverBg=C.skyL,children}) {
  return (
    <button title={title} onClick={onClick}
      style={{width:30,height:30,border:`1.5px solid ${C.border}`,background:C.surface,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:C.text3,transition:'all 0.18s'}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=hoverColor;e.currentTarget.style.background=hoverBg;e.currentTarget.style.color=hoverColor;}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.surface;e.currentTarget.style.color=C.text3;}}>
      {children}
    </button>
  );
}

/* ── MaterialSelect (Portal) ──────────────────────────────────── */
function MaterialSelect({value, onChange, materials}) {
  const [open,setOpen]   = useState(false);
  const [q,setQ]         = useState('');
  const triggerRef       = useRef();
  const dropdownRef      = useRef();
  const [pos,setPos]     = useState({top:0,left:0,width:0});

  const getName = m => m.material_name||m.product_name||m.name||'';
  const getCode = m => m.material_code||m.product_code||'';
  const selected = materials.find(m=>m._id===value);

  const filtered = materials.filter(m=>
    !q||getName(m).toLowerCase().includes(q.toLowerCase())||getCode(m).toLowerCase().includes(q.toLowerCase())
  ).slice(0,50);

  const openDropdown = () => {
    if(triggerRef.current){
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({top:rect.bottom+window.scrollY+4,left:rect.left+window.scrollX,width:Math.max(rect.width,340)});
    }
    setOpen(true);
  };

  useEffect(()=>{
    if(!open) return;
    const h = e=>{
      if(triggerRef.current?.contains(e.target)) return;
      if(dropdownRef.current?.contains(e.target)) return;
      setOpen(false); setQ('');
    };
    document.addEventListener('mousedown',h);
    return ()=>document.removeEventListener('mousedown',h);
  },[open]);

  const dropdown = open && createPortal(
    <div ref={dropdownRef}
      style={{position:'absolute',top:pos.top,left:pos.left,width:pos.width,zIndex:99999,background:'#fff',border:'1.5px solid rgba(190,24,93,0.2)',borderRadius:14,boxShadow:'0 12px 40px rgba(0,0,0,0.15)',maxHeight:320,overflow:'hidden',display:'flex',flexDirection:'column'}}>
      <div style={{padding:'9px 12px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',gap:8,background:'#fdf8fc',flexShrink:0}}>
        <MagnifyingGlass size={13} color={C.text3}/>
        <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Tìm vật tư..."
          style={{border:'none',outline:'none',fontSize:13,color:C.text1,background:'transparent',flex:1,fontFamily:'Outfit,sans-serif'}}/>
        {q&&<button onClick={()=>setQ('')} style={{border:'none',background:'none',cursor:'pointer',color:C.text3,padding:0,display:'flex'}}><X size={12}/></button>}
      </div>
      <div style={{overflowY:'auto',flex:1}}>
        {filtered.length===0
          ?<div style={{padding:'20px',color:C.text3,fontSize:13,textAlign:'center'}}>Không tìm thấy vật tư</div>
          :filtered.map(m=>(
            <div key={m._id}
              onClick={()=>{onChange(m);setOpen(false);setQ('');}}
              style={{padding:'9px 13px',cursor:'pointer',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',gap:9,transition:'background 0.1s',background:m._id===value?C.pinkL:'transparent'}}
              onMouseEnter={e=>{if(m._id!==value)e.currentTarget.style.background='#f8fafc';}}
              onMouseLeave={e=>{if(m._id!==value)e.currentTarget.style.background='transparent';}}>
              <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:11,fontWeight:700,color:C.pink,background:C.pinkL,padding:'2px 7px',borderRadius:5,flexShrink:0}}>{getCode(m)}</span>
              <span style={{fontWeight:500,color:C.text1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1,fontSize:13}}>{getName(m)}</span>
              {/* Show selling price in dropdown */}
              <div style={{textAlign:'right',flexShrink:0}}>
                {(m.selling_price||0)>0
                  ? <span style={{fontSize:11,color:C.pink,fontFamily:'JetBrains Mono,monospace',fontWeight:700,whiteSpace:'nowrap'}}>{fmtCur(m.selling_price)}</span>
                  : <span style={{fontSize:11,color:C.text3}}>—</span>
                }
              </div>
            </div>
          ))
        }
      </div>
    </div>,
    document.body
  );

  return (
    <div ref={triggerRef} style={{position:'relative',minWidth:220}}>
      <div onClick={open?()=>{setOpen(false);setQ('')}:openDropdown}
        style={{padding:'8px 11px',borderRadius:10,border:`1.5px solid ${open?C.pink:selected?'rgba(190,24,93,0.35)':C.border}`,background:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:13,color:selected?C.text1:C.text3,transition:'all 0.2s',boxShadow:open?`0 0 0 3px rgba(190,24,93,0.10)`:'none',userSelect:'none'}}>
        {selected?(
          <span style={{display:'flex',alignItems:'center',gap:7,overflow:'hidden',minWidth:0}}>
            <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:11,fontWeight:700,color:C.pink,background:C.pinkL,padding:'1px 6px',borderRadius:5,flexShrink:0}}>{getCode(selected)}</span>
            <span style={{fontSize:13,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{getName(selected)}</span>
          </span>
        ):<span>Chọn vật tư...</span>}
        <CaretDown size={13} color={C.text3} style={{flexShrink:0,marginLeft:6,transition:'transform 0.2s',transform:open?'rotate(180deg)':'rotate(0)'}}/>
      </div>
      {dropdown}
    </div>
  );
}

/* ── Field ────────────────────────────────────────────────────── */
function Field({label,required,error,children}) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:5}}>
      <label style={{fontSize:11.5,fontWeight:700,color:C.text2,textTransform:'uppercase',letterSpacing:'0.5px'}}>
        {label}{required&&<span style={{color:C.pink,marginLeft:2}}>*</span>}
      </label>
      {children}
      {error&&<span style={{fontSize:11,color:C.red,display:'flex',alignItems:'center',gap:3}}><Warning size={10}/>{error}</span>}
    </div>
  );
}

/* ── IssueModal ───────────────────────────────────────────────── */
function IssueModal({open,item,warehouses,partners,materials,onClose,onSaved}) {
  const [form,setForm]     = useState(emptyForm);
  const [saving,setSaving] = useState(false);
  const [err,setErr]       = useState('');

  useEffect(()=>{
    if(!open) return;
    if(item){
      setForm({
        warehouse_id: item.warehouse_id?._id||item.warehouse_id||'',
        partner_id:   item.partner_id?._id||item.partner_id||'',
        issue_date:   item.issue_date?.slice(0,10)||new Date().toISOString().slice(0,10),
        note:         item.note||'',
        items:(item.items||[]).map(it=>({
          material_id:  it.material_id?._id||it.material_id||'',
          material_name:it.material_id?.product_name||it.material_id?.material_name||'',
          material_code:it.material_id?.product_code||it.material_id?.material_code||'',
          quantity:     it.quantity||1,
          unit_cost:    it.unit_cost||0,
          total_cost:   it.total_cost||0,
          note:         it.note||'',
        })),
      });
    } else {
      setForm({...emptyForm, issue_date:new Date().toISOString().slice(0,10)});
    }
    setErr('');
  },[open,item]);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const addItem = () => setForm(f=>({...f,items:[...f.items,{...emptyItem}]}));

  const removeItem = i => setForm(f=>({...f,items:f.items.filter((_,idx)=>idx!==i)}));

  const updateItem = (i,k,v) => setForm(f=>{
    const items=[...f.items];
    items[i]={...items[i],[k]:v};
    // Recalc total whenever qty or price changes
    if(k==='quantity'||k==='unit_cost'){
      const q = k==='quantity'?Number(v)||0:Number(items[i].quantity)||0;
      const p = k==='unit_cost'?Number(v)||0:Number(items[i].unit_cost)||0;
      items[i].total_cost = q*p;
    }
    return{...f,items};
  });

  // ✅ KEY: auto-fill unit_cost from material.selling_price
  const setMaterial = (i,m) => setForm(f=>{
    const items=[...f.items];
    const sellingPrice = m.selling_price||0;
    const qty = Number(items[i].quantity)||1;
    items[i]={
      ...items[i],
      material_id:   m._id,
      material_name: m.material_name||m.product_name||'',
      material_code: m.material_code||m.product_code||'',
      unit_cost:     sellingPrice,
      total_cost:    sellingPrice * qty,
    };
    return{...f,items};
  });

  const totalAmount = form.items.reduce((s,it)=>s+(it.total_cost||0),0);
  const totalQty    = form.items.reduce((s,it)=>s+Number(it.quantity||0),0);

  const handleSave = async()=>{
    if(!form.warehouse_id) return setErr('Chọn kho xuất');
    if(!form.items.length) return setErr('Thêm ít nhất 1 dòng hàng');
    if(form.items.some(it=>!it.material_id)) return setErr('Chưa chọn vật tư ở một số dòng');
    if(form.items.some(it=>!it.quantity||it.quantity<1)) return setErr('Số lượng phải ≥ 1');
    setSaving(true); setErr('');
    try {
      const payload = {
        ...form,
        total_quantity: totalQty,
        total_cost: totalAmount,
      };
      if(item) await api.put(`/outbound-issues/${item._id}`,payload);
      else     await api.post('/outbound-issues',payload);
      onSaved();
    } catch(e){ setErr(e.message||'Lỗi server'); }
    finally { setSaving(false); }
  };

  if(!open) return null;

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.52)',display:'flex',alignItems:'flex-start',justifyContent:'center',zIndex:1000,overflowY:'auto',padding:'20px 16px',backdropFilter:'blur(7px)',animation:'ob-fadein 0.2s ease'}}>
      <div style={{background:C.surface,borderRadius:24,width:'100%',maxWidth:860,boxShadow:'0 24px 64px rgba(0,0,0,0.16)',marginBottom:24,border:`1px solid ${C.border}`,animation:'ob-scalein 0.3s cubic-bezier(0.16,1,0.3,1)'}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 24px',borderBottom:`1px solid ${C.border}`,background:'linear-gradient(135deg,#fdf2f8,#fce7f3)',borderRadius:'24px 24px 0 0'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:44,height:44,borderRadius:13,background:`linear-gradient(135deg,${C.pink},${C.pinkD})`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 14px rgba(190,24,93,0.30)'}}>
              <ArrowSquareOut size={22} color="#fff" weight="duotone"/>
            </div>
            <div>
              <div style={{fontSize:16,fontWeight:800,color:C.text1}}>{item?`Sửa phiếu ${item.issue_code}`:'Tạo Phiếu Xuất Kho'}</div>
              <div style={{fontSize:12,color:C.pink,marginTop:2}}>Giá tự động điền từ giá bán vật tư — có thể sửa tay</div>
            </div>
          </div>
          <button onClick={onClose}
            style={{width:34,height:34,border:`1.5px solid ${C.border}`,background:C.surface,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:C.text3,transition:'all 0.18s'}}
            onMouseEnter={e=>{e.currentTarget.style.background=C.redL;e.currentTarget.style.color=C.red;e.currentTarget.style.borderColor='rgba(220,38,38,0.3)';}}
            onMouseLeave={e=>{e.currentTarget.style.background=C.surface;e.currentTarget.style.color=C.text3;e.currentTarget.style.borderColor=C.border;}}>
            <X size={15}/>
          </button>
        </div>

        <div style={{padding:'20px 24px',display:'flex',flexDirection:'column',gap:18}}>

          {/* Info grid */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,padding:'16px 18px',borderRadius:16,background:'#f8fafc',border:`1px solid ${C.border}`}}>
            <Field label="Kho xuất" required>
              <select value={form.warehouse_id} onChange={e=>set('warehouse_id',e.target.value)}
                style={{...inSx(!form.warehouse_id&&!!err),appearance:'none',cursor:'pointer'}}
                onFocus={fp} onBlur={br}>
                <option value="">— Chọn kho —</option>
                {warehouses.map(w=><option key={w._id} value={w._id}>{w.name||w.warehouse_name}</option>)}
              </select>
            </Field>
            <Field label="Đối tác">
              <select value={form.partner_id} onChange={e=>set('partner_id',e.target.value)}
                style={{...inSx(),appearance:'none',cursor:'pointer'}}
                onFocus={fp} onBlur={br}>
                <option value="">— Không có —</option>
                {partners.map(p=><option key={p._id} value={p._id}>{p.name||p.object_name}</option>)}
              </select>
            </Field>
            <Field label="Ngày xuất">
              <input type="date" value={form.issue_date} onChange={e=>set('issue_date',e.target.value)}
                style={inSx()} onFocus={fp} onBlur={br}/>
            </Field>
          </div>

          {/* Items */}
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:9}}>
                <div style={{width:32,height:32,borderRadius:9,background:C.pinkL,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <ArrowSquareOut size={16} color={C.pink}/>
                </div>
                <span style={{fontSize:14,fontWeight:800,color:C.text1}}>Danh sách hàng xuất</span>
                {form.items.length>0&&<span style={{background:C.pinkL,color:C.pink,borderRadius:20,padding:'2px 10px',fontSize:12,fontWeight:700,border:`1px solid rgba(190,24,93,0.2)`}}>{form.items.length}</span>}
              </div>
              <button onClick={addItem}
                style={{display:'inline-flex',alignItems:'center',gap:7,padding:'7px 15px',background:`linear-gradient(135deg,${C.pink},${C.pinkD})`,border:'none',borderRadius:10,color:'white',fontFamily:'Outfit,sans-serif',fontSize:13,fontWeight:600,cursor:'pointer',boxShadow:'0 2px 10px rgba(190,24,93,0.28)',transition:'all 0.2s'}}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 4px 16px rgba(190,24,93,0.38)';}}
                onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 2px 10px rgba(190,24,93,0.28)';}}>
                <Plus size={13} weight="bold"/> Thêm dòng
              </button>
            </div>

            {form.items.length===0?(
              <div style={{padding:'36px 20px',textAlign:'center',border:`2px dashed ${C.border}`,borderRadius:16,background:'#f8fafc'}}>
                <div style={{width:52,height:52,borderRadius:15,background:C.pinkL,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px',border:'1.5px dashed rgba(190,24,93,0.3)'}}>
                  <ArrowSquareOut size={24} color={C.pink}/>
                </div>
                <div style={{fontSize:14,fontWeight:600,color:C.text2,marginBottom:4}}>Chưa có dòng hàng</div>
                <div style={{fontSize:12.5,color:C.text3}}>Nhấn "+ Thêm dòng" để bắt đầu</div>
              </div>
            ):(
              <div style={{borderRadius:16,border:`1px solid ${C.border}`,overflow:'visible'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                  <thead>
                    <tr style={{background:'linear-gradient(135deg,#fdf2f8,#fce7f3)',borderBottom:'1.5px solid rgba(190,24,93,0.15)'}}>
                      {['#','Vật tư','Số lượng','Đơn giá (₫)','Thành tiền','Ghi chú',''].map((h,i)=>(
                        <th key={i} style={{padding:'10px 12px',fontSize:10.5,fontWeight:700,color:C.pink,textAlign:i>=2&&i<=4?'right':'left',whiteSpace:'nowrap',textTransform:'uppercase',letterSpacing:'0.5px'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.map((it,i)=>(
                      <tr key={i} style={{borderBottom:`1px solid ${C.border2}`,background:i%2===0?C.surface:'#fafbfc'}}>
                        <td style={{padding:'9px 12px',color:C.text3,fontSize:12,fontFamily:'JetBrains Mono,monospace',fontWeight:700,width:30}}>{i+1}</td>
                        <td style={{padding:'9px 12px',minWidth:220}}>
                          <MaterialSelect value={it.material_id} onChange={m=>setMaterial(i,m)} materials={materials}/>
                          {/* Show auto-fill hint */}
                          {it.material_id&&it.unit_cost>0&&(
                            <div style={{fontSize:10.5,color:C.pink,marginTop:3,display:'flex',alignItems:'center',gap:3}}>
                              <Tag size={9}/> Giá bán: {fmtCur(it.unit_cost)}
                            </div>
                          )}
                        </td>
                        <td style={{padding:'9px 10px',width:90}}>
                          <input type="number" min={1} value={it.quantity}
                            onChange={e=>updateItem(i,'quantity',e.target.value)}
                            style={{...inSx(),textAlign:'center',fontSize:13,padding:'7px 8px'}}
                            onFocus={fp} onBlur={br}/>
                        </td>
                        <td style={{padding:'9px 10px',width:140}}>
                          <input type="number" min={0} step={1000} value={it.unit_cost}
                            onChange={e=>updateItem(i,'unit_cost',e.target.value)}
                            style={{...inSx(),textAlign:'right',fontSize:13,padding:'7px 8px',fontFamily:'JetBrains Mono,monospace'}}
                            onFocus={fp} onBlur={br}/>
                        </td>
                        <td style={{padding:'9px 12px',textAlign:'right',width:140}}>
                          <span style={{fontFamily:'JetBrains Mono,monospace',fontWeight:800,fontSize:13.5,color:it.total_cost>0?C.pink:C.text3}}>
                            {it.total_cost>0?fmtCur(it.total_cost):'—'}
                          </span>
                        </td>
                        <td style={{padding:'9px 10px',minWidth:110}}>
                          <input value={it.note} onChange={e=>updateItem(i,'note',e.target.value)}
                            placeholder="Ghi chú..."
                            style={{...inSx(),fontSize:12.5,padding:'7px 8px'}}
                            onFocus={fp} onBlur={br}/>
                        </td>
                        <td style={{padding:'9px 10px',width:36}}>
                          <button onClick={()=>removeItem(i)}
                            style={{width:28,height:28,borderRadius:8,border:`1.5px solid ${C.border}`,background:C.surface,color:C.text3,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s'}}
                            onMouseEnter={e=>{e.currentTarget.style.borderColor='#fca5a5';e.currentTarget.style.background=C.redL;e.currentTarget.style.color=C.red;}}
                            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.surface;e.currentTarget.style.color=C.text3;}}>
                            <X size={12}/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Footer summary */}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 18px',background:'linear-gradient(135deg,#fdf2f8,#fce7f3)',borderTop:'1.5px solid rgba(190,24,93,0.15)'}}>
                  <span style={{fontSize:13,color:C.text2,fontWeight:500}}>{totalQty} sản phẩm / {form.items.length} dòng</span>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:11,color:C.text3,marginBottom:2}}>Tổng tiền xuất</div>
                    <div style={{fontSize:18,fontWeight:800,color:C.pink,fontFamily:'JetBrains Mono,monospace',letterSpacing:'-0.5px'}}>{fmtCur(totalAmount)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Note */}
          <Field label="Ghi chú phiếu">
            <textarea value={form.note} onChange={e=>set('note',e.target.value)}
              placeholder="Ghi chú thêm..." rows={2}
              style={{...inSx(),resize:'none',lineHeight:1.6}}
              onFocus={fp} onBlur={br}/>
          </Field>

          {err&&(
            <div style={{padding:'10px 14px',background:C.redL,borderRadius:10,color:C.red,fontSize:13,display:'flex',alignItems:'center',gap:8,border:'1px solid rgba(220,38,38,0.25)'}}>
              <Warning size={16} weight="fill"/>{err}
            </div>
          )}

          {/* Footer */}
          <div style={{display:'flex',gap:10,justifyContent:'flex-end',paddingTop:4,borderTop:`1px solid ${C.border}`}}>
            <button onClick={onClose}
              style={{display:'inline-flex',alignItems:'center',gap:7,padding:'9px 18px',border:`1.5px solid ${C.border}`,background:C.surface,borderRadius:10,color:C.text2,fontFamily:'Outfit,sans-serif',fontSize:13.5,fontWeight:500,cursor:'pointer',transition:'all 0.18s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.pink;e.currentTarget.style.color=C.pink;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.text2;}}>
              Huỷ
            </button>
            <button onClick={handleSave} disabled={saving}
              style={{display:'inline-flex',alignItems:'center',gap:7,padding:'9px 20px',border:'none',background:`linear-gradient(135deg,${C.pink},${C.pinkD})`,borderRadius:10,color:'white',fontFamily:'Outfit,sans-serif',fontSize:13.5,fontWeight:700,cursor:saving?'not-allowed':'pointer',opacity:saving?0.75:1,boxShadow:'0 2px 12px rgba(190,24,93,0.30)',transition:'all 0.2s'}}
              onMouseEnter={e=>{if(!saving){e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 4px 18px rgba(190,24,93,0.40)';}}}
              onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 2px 12px rgba(190,24,93,0.30)';}}>
              {saving?<ArrowsClockwise size={14} style={{animation:'ob-spin 0.8s linear infinite'}}/>:<FloppyDisk size={14} weight="bold"/>}
              {saving?'Đang lưu...':item?'Cập nhật':'Tạo phiếu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── DetailModal ──────────────────────────────────────────────── */
function DetailModal({open,item,onClose,onConfirm,onCancel,confirming,cancelling}) {
  if(!open||!item) return null;
  const total = item.items?.reduce((s,it)=>s+(it.total_cost||0),0)||item.total_cost||0;
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.50)',display:'flex',alignItems:'flex-start',justifyContent:'center',zIndex:1050,overflowY:'auto',padding:'20px 16px',backdropFilter:'blur(7px)',animation:'ob-fadein 0.2s ease'}}>
      <div style={{background:C.surface,borderRadius:24,width:'100%',maxWidth:760,boxShadow:'0 24px 64px rgba(0,0,0,0.14)',marginBottom:24,border:`1px solid ${C.border}`,animation:'ob-scalein 0.3s cubic-bezier(0.16,1,0.3,1)'}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',padding:'18px 22px',borderBottom:`1px solid ${C.border}`,background:'linear-gradient(135deg,#fdf2f8,#fce7f3)',borderRadius:'24px 24px 0 0'}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:5}}>
              <span style={{fontWeight:800,fontSize:18,color:C.text1,fontFamily:'JetBrains Mono,monospace'}}>{item.issue_code}</span>
              <StatusBadge status={item.status}/>
            </div>
            <div style={{fontSize:12.5,color:C.text3}}>
              Ngày xuất: <strong style={{color:C.text2}}>{fmtDate(item.issue_date)}</strong>
              {item.created_by&&<span> · Tạo bởi: <strong style={{color:C.text2}}>{item.created_by}</strong></span>}
            </div>
          </div>
          <button onClick={onClose}
            style={{width:32,height:32,border:`1.5px solid ${C.border}`,background:C.surface,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:C.text3,transition:'all 0.18s'}}
            onMouseEnter={e=>{e.currentTarget.style.background=C.redL;e.currentTarget.style.color=C.red;}}
            onMouseLeave={e=>{e.currentTarget.style.background=C.surface;e.currentTarget.style.color=C.text3;}}>
            <X size={15}/>
          </button>
        </div>

        <div style={{padding:'18px 22px',display:'flex',flexDirection:'column',gap:16}}>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            {[
              {Icon:Warehouse,label:'Kho xuất',value:item.warehouse_id?.name||item.warehouse_id?.warehouse_name||'—'},
              {Icon:Handshake,label:'Đối tác', value:item.partner_id?.name||item.partner_id?.object_name||'—'},
            ].map(c=>(
              <div key={c.label} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 16px',background:'#f8fafc',borderRadius:12,border:`1px solid ${C.border}`}}>
                <div style={{width:32,height:32,borderRadius:9,background:C.pinkL,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <c.Icon size={15} color={C.pink}/>
                </div>
                <div>
                  <div style={{fontSize:10,color:C.text3,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:2}}>{c.label}</div>
                  <div style={{fontSize:13.5,fontWeight:700,color:C.text1}}>{c.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{borderRadius:16,border:`1px solid ${C.border}`,overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13.5}}>
              <thead>
                <tr style={{background:'#f8fafc',borderBottom:`1.5px solid ${C.border2}`}}>
                  {['#','Vật tư','SL','Đơn giá','Thành tiền'].map((h,i)=>(
                    <th key={i} style={{padding:'10px 14px',fontSize:10.5,fontWeight:700,color:C.text3,textAlign:i>=2?'right':'left',textTransform:'uppercase',letterSpacing:'0.6px'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(item.items||[]).map((it,i)=>(
                  <tr key={i} style={{borderBottom:`1px solid ${C.border2}`,transition:'background 0.15s'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#fdfbfe'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{padding:'11px 14px',color:C.text3,fontFamily:'JetBrains Mono,monospace',fontSize:12,fontWeight:700}}>{i+1}</td>
                    <td style={{padding:'11px 14px'}}>
                      <div style={{fontWeight:600,color:C.text1}}>{it.material_id?.product_name||it.material_id?.material_name||'—'}</div>
                      <div style={{fontSize:11.5,color:C.pink,fontFamily:'JetBrains Mono,monospace',marginTop:1}}>{it.material_id?.product_code||it.material_id?.material_code||''}</div>
                    </td>
                    <td style={{padding:'11px 14px',textAlign:'right',fontFamily:'JetBrains Mono,monospace',fontWeight:700,fontSize:14,color:C.text1}}>{fmt(it.quantity)}</td>
                    <td style={{padding:'11px 14px',textAlign:'right',fontSize:13,color:C.text2,fontFamily:'JetBrains Mono,monospace'}}>{fmtCur(it.unit_cost)}</td>
                    <td style={{padding:'11px 14px',textAlign:'right',fontFamily:'JetBrains Mono,monospace',fontWeight:800,fontSize:14,color:C.pink}}>{fmtCur(it.total_cost)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{background:'linear-gradient(135deg,#fdf2f8,#fce7f3)',borderTop:'1.5px solid rgba(190,24,93,0.15)'}}>
                  <td colSpan={4} style={{padding:'12px 14px',fontSize:13,color:C.text2,fontWeight:700,textAlign:'right'}}>Tổng cộng</td>
                  <td style={{padding:'12px 14px',textAlign:'right',fontWeight:800,fontSize:17,color:C.pink,fontFamily:'JetBrains Mono,monospace'}}>{fmtCur(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {item.note&&(
            <div style={{padding:'11px 15px',background:C.amberL,borderRadius:11,border:'1px solid rgba(217,119,6,0.25)',fontSize:13,color:'#92400e'}}>
              <strong>Ghi chú:</strong> {item.note}
            </div>
          )}

          {item.status==='draft'&&(
            <div style={{display:'flex',gap:10,justifyContent:'flex-end',paddingTop:4,borderTop:`1px solid ${C.border}`}}>
              <button onClick={()=>onCancel(item)} disabled={cancelling}
                style={{display:'inline-flex',alignItems:'center',gap:7,padding:'9px 18px',border:'1.5px solid rgba(220,38,38,0.3)',background:C.redL,borderRadius:10,color:C.red,fontFamily:'Outfit,sans-serif',fontSize:13.5,fontWeight:700,cursor:cancelling?'not-allowed':'pointer',opacity:cancelling?0.7:1,transition:'all 0.2s'}}
                onMouseEnter={e=>{if(!cancelling)e.currentTarget.style.background='#fecaca';}}
                onMouseLeave={e=>e.currentTarget.style.background=C.redL}>
                <Prohibit size={15} weight="bold"/>{cancelling?'Đang huỷ...':'Huỷ phiếu'}
              </button>
              <button onClick={()=>onConfirm(item)} disabled={confirming}
                style={{display:'inline-flex',alignItems:'center',gap:7,padding:'9px 22px',border:'none',background:'linear-gradient(135deg,#059669,#047857)',borderRadius:10,color:'white',fontFamily:'Outfit,sans-serif',fontSize:13.5,fontWeight:700,cursor:confirming?'not-allowed':'pointer',opacity:confirming?0.7:1,boxShadow:'0 2px 12px rgba(5,150,105,0.28)',transition:'all 0.2s'}}
                onMouseEnter={e=>{if(!confirming){e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 4px 18px rgba(5,150,105,0.38)';}}}
                onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 2px 12px rgba(5,150,105,0.28)';}}>
                {confirming?<ArrowsClockwise size={14} style={{animation:'ob-spin 0.8s linear infinite'}}/>:<CheckCircle size={15} weight="fill"/>}
                {confirming?'Đang xác nhận...':'Xác nhận xuất kho'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── ConfirmDialog ────────────────────────────────────────────── */
function ConfirmDialog({open,message,onConfirm,onCancel,loading}) {
  if(!open) return null;
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.55)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1200,backdropFilter:'blur(6px)',animation:'ob-fadein 0.2s ease'}}>
      <div style={{background:C.surface,borderRadius:20,padding:'28px 32px',width:380,boxShadow:'0 20px 60px rgba(0,0,0,0.16)',border:`1px solid ${C.border}`,animation:'ob-scalein 0.25s cubic-bezier(0.16,1,0.3,1)'}}>
        <div style={{width:48,height:48,borderRadius:13,background:C.redL,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',border:'1px solid rgba(220,38,38,0.2)'}}>
          <Warning size={24} color={C.red} weight="duotone"/>
        </div>
        <div style={{fontWeight:800,fontSize:16,color:C.text1,marginBottom:8,textAlign:'center'}}>Xác nhận hành động</div>
        <div style={{color:C.text2,fontSize:13.5,marginBottom:24,lineHeight:1.6,textAlign:'center'}}>{message}</div>
        <div style={{display:'flex',gap:10,justifyContent:'center'}}>
          <button onClick={onCancel}
            style={{padding:'9px 22px',borderRadius:10,border:`1.5px solid ${C.border}`,background:C.surface,color:C.text2,cursor:'pointer',fontWeight:600,fontSize:13.5,fontFamily:'Outfit,sans-serif',transition:'all 0.18s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.pink;e.currentTarget.style.color=C.pink;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.text2;}}>
            Không
          </button>
          <button onClick={onConfirm} disabled={loading}
            style={{padding:'9px 22px',borderRadius:10,border:'none',background:`linear-gradient(135deg,${C.red},#b91c1c)`,color:'white',cursor:loading?'not-allowed':'pointer',fontWeight:700,fontSize:13.5,fontFamily:'Outfit,sans-serif',opacity:loading?0.7:1,transition:'all 0.2s'}}>
            {loading?'Đang xử lý...':'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────── */
export default function OutboundIssues() {
  const [issues,setIssues]           = useState([]);
  const [loading,setLoading]         = useState(true);
  const [search,setSearch]           = useState('');
  const [statusFilter,setStatus]     = useState('all');
  const [page,setPage]               = useState(1);
  const [pagination,setPagination]   = useState({total:0,pages:1});
  const [warehouses,setWarehouses]   = useState([]);
  const [partners,setPartners]       = useState([]);
  const [materials,setMaterials]     = useState([]);
  const [formModal,setFormModal]     = useState({open:false,item:null});
  const [detailModal,setDetailModal] = useState({open:false,item:null});
  const [confirm,setConfirm]         = useState({open:false});
  const [confirming,setConfirming]   = useState(false);
  const [cancelling,setCancelling]   = useState(false);

  const loadIssues = useCallback(async()=>{
    setLoading(true);
    try {
      const params = new URLSearchParams({page,limit:20});
      if(statusFilter!=='all') params.set('status',statusFilter);
      if(search) params.set('search',search);
      const res = await api.get(`/outbound-issues?${params}`);
      setIssues(parseList(res));
      setPagination(res?.pagination||res?.data?.pagination||{total:0,pages:1});
    } catch { setIssues([]); }
    finally { setLoading(false); }
  },[page,statusFilter,search]);

  const loadMeta = useCallback(async()=>{
    const [wRes,pRes,mRes] = await Promise.allSettled([
      api.get('/warehouses'),
      api.get('/partners'),
      api.get('/materials?limit=500'),
    ]);
    const unwrap = r => {
      if(r.status!=='fulfilled') return [];
      const v=r.value; const d=v?.data?.data??v?.data??v;
      return Array.isArray(d)?d:[];
    };
    setWarehouses(unwrap(wRes));
    setPartners(unwrap(pRes));
    setMaterials(unwrap(mRes));
  },[]);

  useEffect(()=>{loadIssues();},[loadIssues]);
  useEffect(()=>{loadMeta();},[loadMeta]);
  useEffect(()=>{setPage(1);},[search,statusFilter]);

  const handleConfirm = async issue=>{
    setConfirming(true);
    try { await api.patch(`/outbound-issues/${issue._id}/confirm`); setDetailModal({open:false,item:null}); loadIssues(); }
    catch(e){ alert(e.message||'Lỗi xác nhận'); }
    finally { setConfirming(false); }
  };

  const handleCancel = issue=>{
    setConfirm({
      open:true,
      message:`Huỷ phiếu xuất ${issue.issue_code}? Không thể hoàn tác.`,
      loading:false,
      onConfirm:async()=>{
        setConfirm(c=>({...c,loading:true})); setCancelling(true);
        try { await api.patch(`/outbound-issues/${issue._id}/cancel`); setConfirm({open:false}); setDetailModal({open:false,item:null}); loadIssues(); }
        catch { setConfirm(c=>({...c,loading:false})); }
        finally { setCancelling(false); }
      },
    });
  };

  const handleDelete = issue=>{
    setConfirm({
      open:true,
      message:`Xoá phiếu ${issue.issue_code}? Không thể hoàn tác.`,
      loading:false,
      onConfirm:async()=>{
        setConfirm(c=>({...c,loading:true}));
        try { await api.delete(`/outbound-issues/${issue._id}`); setConfirm({open:false}); loadIssues(); }
        catch { setConfirm(c=>({...c,loading:false})); }
      },
    });
  };

  const TABS = [
    {key:'all',       label:'Tất cả',     color:C.pink,  bg:C.pinkL},
    {key:'draft',     label:'Nháp',       color:C.amber, bg:C.amberL},
    {key:'confirmed', label:'Hoàn thành', color:C.green, bg:C.greenL},
    {key:'cancelled', label:'Đã huỷ',     color:C.red,   bg:C.redL},
  ];

  const counts = {
    all:       issues.length,
    draft:     issues.filter(i=>i.status==='draft').length,
    confirmed: issues.filter(i=>i.status==='confirmed').length,
    cancelled: issues.filter(i=>i.status==='cancelled').length,
  };

  return (
    <div style={{minHeight:'100vh',background:C.bg,fontFamily:'Outfit, sans-serif',padding:'28px 32px 56px'}}>

      {/* Header */}
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:22,gap:16}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div style={{width:48,height:48,borderRadius:15,background:`linear-gradient(135deg,${C.pinkL},#fce4ef)`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 16px rgba(190,24,93,0.20)',flexShrink:0}}>
            <ArrowSquareOut size={24} color={C.pink} weight="duotone"/>
          </div>
          <div>
            <h1 style={{fontSize:22,fontWeight:800,color:C.text1,margin:0,letterSpacing:'-0.5px'}}>Xuất Kho</h1>
            <div style={{fontSize:13,color:C.text3,marginTop:3}}>
              <span style={{fontFamily:'JetBrains Mono,monospace',color:C.pink,fontWeight:700}}>{pagination.total||issues.length}</span> phiếu xuất
            </div>
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={loadIssues}
            style={{width:40,height:40,border:`1.5px solid ${C.border}`,background:C.surface,borderRadius:11,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:C.text3,transition:'all 0.2s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.pink;e.currentTarget.style.color=C.pink;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.text3;}}>
            <ArrowsClockwise size={16} weight="bold"/>
          </button>
          <button onClick={()=>setFormModal({open:true,item:null})}
            style={{display:'inline-flex',alignItems:'center',gap:7,padding:'10px 20px',background:`linear-gradient(135deg,${C.pink},${C.pinkD})`,border:'none',borderRadius:12,color:'white',fontFamily:'Outfit,sans-serif',fontSize:14,fontWeight:700,cursor:'pointer',boxShadow:'0 2px 12px rgba(190,24,93,0.30)',transition:'all 0.22s'}}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 6px 20px rgba(190,24,93,0.40)';}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 2px 12px rgba(190,24,93,0.30)';}}>
            <Plus size={15} weight="bold"/> Tạo phiếu xuất
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap'}}>
        {TABS.map(s=>{
          const active=statusFilter===s.key;
          return (
            <button key={s.key} onClick={()=>{setStatus(s.key);setPage(1);}}
              style={{display:'flex',alignItems:'center',gap:8,padding:'8px 16px',background:active?s.bg:C.surface,borderRadius:11,border:`1.5px solid ${active?s.color:C.border}`,cursor:'pointer',transition:'all 0.2s',boxShadow:active?`0 2px 8px ${s.color}25`:'0 1px 3px rgba(0,0,0,0.04)'}}>
              <span style={{fontSize:20,fontWeight:800,color:s.color,fontFamily:'JetBrains Mono,monospace',lineHeight:1}}>{counts[s.key]}</span>
              <span style={{fontSize:13,color:active?s.color:C.text2,fontWeight:active?700:500}}>{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div style={{position:'relative',maxWidth:420,marginBottom:18}}>
        <MagnifyingGlass size={15} color={C.text3} style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Tìm mã phiếu..."
          style={{...inSx(),paddingLeft:38}} onFocus={fp} onBlur={br}/>
      </div>

      {/* Table */}
      <div style={{background:C.surface,borderRadius:20,border:`1px solid ${C.border}`,boxShadow:'0 4px 20px rgba(0,0,0,0.05)',overflow:'hidden',animation:'ob-fadeup 0.4s cubic-bezier(0.16,1,0.3,1)'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13.5}}>
          <thead>
            <tr style={{background:'#f8fafc',borderBottom:`1.5px solid ${C.border2}`}}>
              {['MÃ PHIẾU','NGÀY XUẤT','KHO','ĐỐI TÁC','TỔNG TIỀN','TRẠNG THÁI','THAO TÁC'].map((h,i)=>(
                <th key={h} style={{padding:'12px 16px',textAlign:h==='TỔNG TIỀN'?'right':h==='THAO TÁC'?'right':'left',fontSize:10.5,fontWeight:700,color:C.text3,letterSpacing:'0.8px',whiteSpace:'nowrap'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading?(
              [...Array(6)].map((_,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${C.border2}`}}>
                  {[...Array(7)].map((_,j)=><td key={j} style={{padding:'14px 16px'}}><Skel h={13} w={j===1?'60%':'50%'}/></td>)}
                </tr>
              ))
            ):issues.length===0?(
              <tr>
                <td colSpan={7} style={{padding:'60px 20px',textAlign:'center'}}>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
                    <div style={{width:64,height:64,background:C.pinkL,borderRadius:18,display:'flex',alignItems:'center',justifyContent:'center',border:'1.5px dashed rgba(190,24,93,0.3)',color:C.pink}}>
                      <ArrowSquareOut size={28}/>
                    </div>
                    <div style={{fontSize:14,fontWeight:600,color:C.text2}}>
                      {search||statusFilter!=='all'?'Không tìm thấy phiếu phù hợp':'Chưa có phiếu xuất nào'}
                    </div>
                    {!search&&statusFilter==='all'&&(
                      <button onClick={()=>setFormModal({open:true,item:null})}
                        style={{marginTop:4,display:'inline-flex',alignItems:'center',gap:7,padding:'9px 20px',border:'none',background:`linear-gradient(135deg,${C.pink},${C.pinkD})`,borderRadius:10,color:'white',fontFamily:'Outfit,sans-serif',fontSize:13.5,fontWeight:700,cursor:'pointer',boxShadow:'0 2px 10px rgba(190,24,93,0.28)'}}>
                        <Plus size={14} weight="bold"/> Tạo phiếu đầu tiên
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ):issues.map((issue,idx)=>(
              <tr key={issue._id}
                style={{borderBottom:`1px solid ${C.border2}`,transition:'background 0.15s',cursor:'pointer',animation:`ob-fadeup 0.35s cubic-bezier(0.16,1,0.3,1) ${idx*25}ms both`}}
                onMouseEnter={e=>e.currentTarget.style.background='#fdfbfe'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                onClick={async()=>{
                  try{const res=await api.get(`/outbound-issues/${issue._id}`);setDetailModal({open:true,item:res?.data||res});}
                  catch{setDetailModal({open:true,item:issue});}
                }}>
                <td style={{padding:'13px 16px'}}>
                  <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:12.5,fontWeight:700,color:C.pink,background:C.pinkL,padding:'3px 9px',borderRadius:7,whiteSpace:'nowrap'}}>{issue.issue_code}</span>
                </td>
                <td style={{padding:'13px 16px',fontSize:13,color:C.text2,whiteSpace:'nowrap'}}>{fmtDate(issue.issue_date||issue.created_at)}</td>
                <td style={{padding:'13px 16px',fontSize:13,color:C.text2}}>{issue.warehouse_id?.name||issue.warehouse_id?.warehouse_name||'—'}</td>
                <td style={{padding:'13px 16px',fontSize:13,color:C.text2}}>{issue.partner_id?.name||issue.partner_id?.object_name||'—'}</td>
                <td style={{padding:'13px 16px',textAlign:'right'}}>
                  <span style={{fontFamily:'JetBrains Mono,monospace',fontWeight:800,fontSize:13.5,color:C.pink}}>{fmtCur(issue.total_cost||issue.total_amount)}</span>
                </td>
                <td style={{padding:'13px 16px'}}><StatusBadge status={issue.status}/></td>
                <td style={{padding:'13px 16px'}} onClick={e=>e.stopPropagation()}>
                  <div style={{display:'flex',gap:5,justifyContent:'flex-end'}}>
                    <ActBtn title="Xem chi tiết" hoverColor={C.sky} hoverBg={C.skyL}
                      onClick={async()=>{try{const res=await api.get(`/outbound-issues/${issue._id}`);setDetailModal({open:true,item:res?.data||res});}catch{setDetailModal({open:true,item:issue});}}}>
                      <Eye size={13}/>
                    </ActBtn>
                    {issue.status==='draft'&&(
                      <>
                        <ActBtn title="Sửa phiếu" hoverColor={C.sky} hoverBg={C.skyL} onClick={()=>setFormModal({open:true,item:issue})}><PencilSimple size={13}/></ActBtn>
                        <ActBtn title="Xoá phiếu" hoverColor={C.red} hoverBg={C.redL} onClick={()=>handleDelete(issue)}><Trash size={13}/></ActBtn>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading&&pagination.pages>1&&(
          <div style={{padding:'14px 20px',borderTop:`1px solid ${C.border2}`,display:'flex',alignItems:'center',justifyContent:'space-between',background:'#fafbfc'}}>
            <span style={{fontSize:12.5,color:C.text3,fontFamily:'JetBrains Mono,monospace'}}>
              Tổng <strong style={{color:C.text2}}>{pagination.total}</strong> phiếu
            </span>
            <div style={{display:'flex',gap:4}}>
              {[...Array(Math.min(pagination.pages,10))].map((_,i)=>{
                const p=i+1;
                return (
                  <button key={p} onClick={()=>setPage(p)}
                    style={{width:34,height:34,borderRadius:9,border:`1.5px solid ${page===p?C.pink:C.border}`,background:page===p?`linear-gradient(135deg,${C.pink},${C.pinkD})`:C.surface,color:page===p?'white':C.text2,cursor:'pointer',fontFamily:'JetBrains Mono,monospace',fontSize:13,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:page===p?'0 2px 10px rgba(190,24,93,0.25)':'none',transition:'all 0.18s'}}>
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <IssueModal open={formModal.open} item={formModal.item} warehouses={warehouses} partners={partners} materials={materials} onClose={()=>setFormModal({open:false,item:null})} onSaved={()=>{setFormModal({open:false,item:null});loadIssues();}}/>
      <DetailModal open={detailModal.open} item={detailModal.item} onClose={()=>setDetailModal({open:false,item:null})} onConfirm={handleConfirm} onCancel={handleCancel} confirming={confirming} cancelling={cancelling}/>
      <ConfirmDialog open={confirm.open} message={confirm.message} loading={confirm.loading} onConfirm={confirm.onConfirm} onCancel={()=>setConfirm({open:false})}/>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
        @keyframes ob-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes ob-fadeup{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ob-fadein{from{opacity:0}to{opacity:1}}
        @keyframes ob-scalein{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
        @keyframes ob-spin{to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
}