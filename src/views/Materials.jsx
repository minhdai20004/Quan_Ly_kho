// ================================================================
//  WMS — LUXURY MATERIALS VIEW  v3.1  (+ selling_price, purchase_price)
//  Paste to: src/views/Materials.jsx
// ================================================================
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Package, Plus, PencilSimple, Trash,
  MagnifyingGlass, Tag, X, Check, Warning,
  ArrowLeft, SortAscending, SortDescending,
  CaretLeft, CaretRight, CaretUpDown, Minus, Scales,
  FunnelSimple, ArrowsClockwise, CurrencyDollar,
} from '@phosphor-icons/react';
import api from '../services/api';
import MaterialGroupTree from '../components/MaterialGroupTree';

const PAGE_SIZE = 15;

/* ── Code gen ──────────────────────────────────────────────────── */
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function genCode(prefix = 'VT') {
  let rand = '';
  for (let i = 0; i < 4; i++) rand += CHARS[Math.floor(Math.random() * CHARS.length)];
  return `${prefix.toUpperCase()}-${rand}`;
}
function genUniqueCode(prefix = 'VT', existingCodes = new Set()) {
  for (let attempt = 0; attempt < 50; attempt++) {
    const code = genCode(prefix);
    if (!existingCodes.has(code)) return code;
  }
  return `${prefix.toUpperCase()}-${Date.now().toString(36).toUpperCase().slice(-4)}`;
}

/* ── Design tokens ─────────────────────────────────────────────── */
const C = {
  pink:'#be185d', pinkD:'#9d174d', pinkL:'#fce7f3',
  sky:'#0284c7',  skyL:'#e0f2fe',
  green:'#059669',greenL:'#d1fae5',
  red:'#dc2626',  redL:'#fee2e2',
  amber:'#d97706',amberL:'#fef3c7',
  purple:'#7c3aed',purpleL:'#ede9fe',
  bg:'#f0f4f8', surface:'#ffffff',
  border:'#e2e8f0', text1:'#1e293b', text2:'#64748b', text3:'#94a3b8',
};

const S = {
  card: { background:C.surface, borderRadius:20, border:`1px solid ${C.border}`, boxShadow:'0 4px 24px rgba(0,0,0,0.05)', overflow:'hidden' },
  input: { width:'100%', padding:'9px 13px', border:`1.5px solid ${C.border}`, borderRadius:11, background:C.surface, fontFamily:'Outfit, sans-serif', fontSize:13.5, color:C.text1, outline:'none', transition:'all 0.2s ease', boxSizing:'border-box' },
  btnPrimary: { display:'inline-flex', alignItems:'center', gap:7, padding:'9px 18px', background:`linear-gradient(135deg,${C.pink},${C.pinkD})`, border:'none', borderRadius:11, color:'white', fontFamily:'Outfit, sans-serif', fontSize:13.5, fontWeight:600, cursor:'pointer', boxShadow:'0 2px 12px rgba(190,24,93,0.30)', transition:'all 0.22s cubic-bezier(0.16,1,0.3,1)' },
  btnSecondary: { display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', background:C.surface, border:`1.5px solid ${C.border}`, borderRadius:10, color:C.text2, fontFamily:'Outfit, sans-serif', fontSize:13, fontWeight:500, cursor:'pointer', transition:'all 0.18s ease' },
};

/* ── Helpers ────────────────────────────────────────────────────── */
const fmt    = n => Number(n||0).toLocaleString('vi-VN');
const fmtCur = n => Number(n||0).toLocaleString('vi-VN',{style:'currency',currency:'VND'});

/* ── Shimmer ─────────────────────────────────────────────────────── */
const Skel = ({w='100%',h=13,r=6}) => (
  <div style={{width:w,height:h,borderRadius:r,background:'linear-gradient(90deg,#f1f5f9 25%,#e8edf3 50%,#f1f5f9 75%)',backgroundSize:'200% 100%',animation:'mat-shimmer 1.5s ease-in-out infinite'}}/>
);

/* ── UomEditor ─────────────────────────────────────────────────── */
function UomEditor({form,setForm}) {
  const [open,setOpen] = useState(false);
  const baseUnit   = form.units.find(u=>u.is_base);
  const otherUnits = form.units.filter(u=>!u.is_base&&u.name&&u.ratio>1);
  const summary    = baseUnit?.name ? (otherUnits.length ? `${baseUnit.name} · ${otherUnits.map(o=>`1 ${o.name} = ${o.ratio} ${baseUnit.name}`).join(', ')}` : baseUnit.name) : 'Chưa thiết lập';

  return (
    <div style={{border:`1.5px solid ${C.border}`,borderRadius:12,overflow:'hidden'}}>
      <button type="button" onClick={()=>setOpen(p=>!p)}
        style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',background:'linear-gradient(135deg,rgba(2,132,199,0.04),rgba(2,132,199,0.02))',border:'none',cursor:'pointer',fontFamily:'Outfit, sans-serif'}}>
        <div style={{display:'flex',alignItems:'center',gap:7}}>
          <div style={{width:26,height:26,borderRadius:7,background:C.skyL,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Scales size={13} color={C.sky}/>
          </div>
          <span style={{fontSize:13,fontWeight:600,color:C.text1}}>Đơn vị tính</span>
          <span style={{fontSize:11.5,color:C.text2,background:'rgba(2,132,199,0.08)',border:'1px solid rgba(2,132,199,0.15)',padding:'2px 8px',borderRadius:6,maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
            {summary}
          </span>
        </div>
        <CaretRight size={13} color={C.text3} style={{transform:open?'rotate(90deg)':'rotate(0deg)',transition:'transform 0.2s'}}/>
      </button>
      {open&&(
        <div style={{padding:'14px',display:'flex',flexDirection:'column',gap:10,borderTop:`1px solid ${C.border}`,background:'#fafbfc'}}>
          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <button type="button"
              onClick={()=>setForm(p=>({...p,units:[...p.units,{name:'',ratio:1,is_base:false}]}))}
              style={{...S.btnSecondary,fontSize:12,padding:'5px 11px'}}>
              <Plus size={11} weight="bold"/> Thêm đơn vị
            </button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 100px 72px 28px',gap:8,fontSize:11,color:C.text3,fontWeight:700,padding:'0 2px',letterSpacing:'0.3px',textTransform:'uppercase'}}>
            <span>Tên đơn vị</span><span>= bao nhiêu gốc</span><span style={{textAlign:'center'}}>Gốc</span><span/>
          </div>
          {form.units.map((u,i)=>(
            <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 100px 72px 28px',gap:8,alignItems:'center'}}>
              <input value={u.name}
                onChange={e=>setForm(p=>{const units=[...p.units];units[i]={...units[i],name:e.target.value};return{...p,units};})}
                placeholder={u.is_base?'cái, kg, gói...':'thùng, lốc...'}
                style={{...S.input,fontSize:13,padding:'7px 10px'}}
                onFocus={e=>e.target.style.borderColor=C.sky}
                onBlur={e=>e.target.style.borderColor=C.border}/>
              <input type="number" min={1} value={u.ratio} disabled={u.is_base}
                onChange={e=>setForm(p=>{const units=[...p.units];units[i]={...units[i],ratio:Number(e.target.value)||1};return{...p,units};})}
                style={{...S.input,fontSize:13,padding:'7px 10px',textAlign:'center',opacity:u.is_base?0.4:1}}
                onFocus={e=>e.target.style.borderColor=C.sky}
                onBlur={e=>e.target.style.borderColor=C.border}/>
              <div style={{display:'flex',justifyContent:'center'}}>
                <input type="radio" name="base_unit" checked={u.is_base}
                  onChange={()=>setForm(p=>({...p,units:p.units.map((uu,ii)=>({...uu,is_base:ii===i,ratio:ii===i?1:uu.ratio}))}))}
                  style={{accentColor:C.sky,cursor:'pointer',width:16,height:16}}/>
              </div>
              <button type="button" disabled={form.units.length<=1}
                onClick={()=>setForm(p=>{
                  const units=p.units.filter((_,ii)=>ii!==i);
                  if(!units.some(u=>u.is_base)&&units.length) units[0]={...units[0],is_base:true,ratio:1};
                  return{...p,units};
                })}
                style={{background:'none',border:'none',cursor:'pointer',color:'#f87171',opacity:form.units.length<=1?0.3:1,padding:4,display:'flex',alignItems:'center'}}>
                <Minus size={14} weight="bold"/>
              </button>
            </div>
          ))}
          {(()=>{
            const base=form.units.find(u=>u.is_base);
            const others=form.units.filter(u=>!u.is_base&&u.name.trim()&&u.ratio>1);
            if(!base?.name||!others.length) return null;
            return (
              <div style={{padding:'8px 12px',borderRadius:9,fontSize:12,background:'rgba(2,132,199,0.07)',border:'1px solid rgba(2,132,199,0.18)',color:C.text2,display:'flex',flexWrap:'wrap',gap:8}}>
                {others.map(o=><span key={o.name}>1 <strong style={{color:C.sky}}>{o.name}</strong>{' = '}{o.ratio} <strong style={{color:C.sky}}>{base.name}</strong></span>)}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

/* ── PriceInput ─────────────────────────────────────────────────── */
function PriceInput({label,value,onChange,color=C.pink,icon}) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:5}}>
      <label style={{fontSize:11.5,fontWeight:700,color:C.text2,textTransform:'uppercase',letterSpacing:'0.5px',display:'flex',alignItems:'center',gap:5}}>
        {icon}{label}
      </label>
      <div style={{position:'relative'}}>
        <input
          type="number" min={0} step={1000} value={value}
          onChange={e=>onChange(Number(e.target.value)||0)}
          style={{...S.input,paddingRight:32,fontFamily:'JetBrains Mono,monospace',fontSize:13}}
          onFocus={e=>{e.target.style.borderColor=color;e.target.style.boxShadow=`0 0 0 3px ${color}18`;}}
          onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow='none';}}
        />
        <span style={{position:'absolute',right:11,top:'50%',transform:'translateY(-50%)',fontSize:11,color:C.text3,fontWeight:700,pointerEvents:'none'}}>₫</span>
      </div>
      {value>0&&(
        <div style={{fontSize:11,color,fontWeight:600}}>{fmtCur(value)}</div>
      )}
    </div>
  );
}

/* ── FormField ──────────────────────────────────────────────────── */
function Field({label,required,error,children}) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:6}}>
      <label style={{fontSize:12,fontWeight:600,color:C.text2,letterSpacing:'0.1px'}}>
        {label}{required&&<span style={{color:C.pink,marginLeft:2}}>*</span>}
      </label>
      {children}
      {error&&<span style={{display:'flex',alignItems:'center',gap:4,fontSize:11.5,color:C.red,fontWeight:500}}><Warning size={11}/>{error}</span>}
    </div>
  );
}

/* ── MaterialModal ─────────────────────────────────────────────── */
function MaterialModal({mode,initial,groups,existingCodes,onSave,onClose}) {
  const flatGroups = useMemo(()=>{
    const result=[];
    function flatten(list,depth=0){list.forEach(g=>{result.push({...g,_depth:depth});const children=groups.filter(c=>String(c.parent_id?._id||c.parent_id)===String(g._id));if(children.length)flatten(children,depth+1);});}
    flatten(groups.filter(g=>!g.parent_id));
    return result;
  },[groups]);

  const getPrefixFromGroup=groupId=>{
    if(!groupId) return 'VT';
    const g=flatGroups.find(g=>g._id===groupId);
    return (g?.code||g?.prefix||'VT').toUpperCase();
  };

  const [form,setForm]=useState(()=>{
    const initGroupId=initial?.group_id?._id||initial?.group_id||initial?.category_id?._id||initial?.category_id||'';
    const existingCode=initial?.material_code||initial?.product_code||'';
    const initialCode=mode==='edit'?existingCode:genUniqueCode(getPrefixFromGroup(initGroupId),existingCodes);
    return {
      material_code:initialCode,
      material_name:initial?.material_name||initial?.product_name||'',
      group_id:initGroupId,
      unit:initial?.unit||'',
      units:initial?.units?.length?initial.units:[{name:'',ratio:1,is_base:true}],
      description:initial?.description||'',
      status:initial?.status||'active',
      selling_price:initial?.selling_price||0,
      purchase_price:initial?.purchase_price||0,
    };
  });

  const [errors,setErrors]=useState({});
  const [saving,setSaving]=useState(false);

  const handleGroupChange=groupId=>{
    const prefix=getPrefixFromGroup(groupId);
    const codesWithoutCurrent=new Set([...existingCodes].filter(c=>c!==form.material_code));
    setForm(p=>({...p,group_id:groupId,material_code:genUniqueCode(prefix,codesWithoutCurrent)}));
  };

  const regenCode=()=>{
    const prefix=getPrefixFromGroup(form.group_id);
    const codesWithoutCurrent=new Set([...existingCodes].filter(c=>c!==form.material_code));
    setForm(p=>({...p,material_code:genUniqueCode(prefix,codesWithoutCurrent)}));
  };

  const validate=()=>{
    const e={};
    if(!form.material_code.trim()) e.material_code='Mã không được trống';
    if(!form.material_name.trim()) e.material_name='Tên không được trống';
    const currentOriginalCode=initial?.material_code||initial?.product_code||'';
    if(form.material_code.trim()!==currentOriginalCode&&existingCodes.has(form.material_code.trim()))
      e.material_code=`Mã "${form.material_code}" đã tồn tại`;
    return e;
  };

  const handleSave=async()=>{
    const e=validate();
    if(Object.keys(e).length) return setErrors(e);
    setSaving(true);
    try{await onSave(form);}finally{setSaving(false);}
  };

  const currentPrefix=getPrefixFromGroup(form.group_id);
  const inputStyle=hasErr=>({...S.input,borderColor:hasErr?C.red:C.border,boxShadow:hasErr?`0 0 0 3px rgba(220,38,38,0.10)`:'none'});

  return (
    <div style={{position:'fixed',inset:0,zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(15,23,42,0.50)',backdropFilter:'blur(6px)',padding:20,animation:'mat-fadein 0.2s ease'}}>
      <div style={{width:'100%',maxWidth:520,background:C.surface,borderRadius:24,overflow:'hidden',boxShadow:'0 24px 64px rgba(0,0,0,0.18)',maxHeight:'90vh',display:'flex',flexDirection:'column',animation:'mat-scalein 0.3s cubic-bezier(0.16,1,0.3,1)',border:`1px solid rgba(226,232,240,0.8)`}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 22px',borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${C.pinkL},#fce4ef)`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(190,24,93,0.15)'}}>
              <Package size={18} color={C.pink} weight="duotone"/>
            </div>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:C.text1,letterSpacing:'-0.3px'}}>{mode==='add'?'Thêm Vật Tư Mới':'Chỉnh sửa Vật Tư'}</div>
              <div style={{fontSize:11.5,color:C.text3,marginTop:1}}>{mode==='add'?'Điền thông tin vật tư bên dưới':`Đang sửa: ${initial?.material_name||''}`}</div>
            </div>
          </div>
          <button onClick={onClose}
            style={{width:32,height:32,border:'none',background:'#f8fafc',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:C.text3,transition:'all 0.18s ease'}}
            onMouseEnter={e=>{e.currentTarget.style.background=C.redL;e.currentTarget.style.color=C.red;}}
            onMouseLeave={e=>{e.currentTarget.style.background='#f8fafc';e.currentTarget.style.color=C.text3;}}>
            <X size={15}/>
          </button>
        </div>

        {/* Body */}
        <div style={{overflowY:'auto',padding:'20px 22px',display:'flex',flexDirection:'column',gap:14}}>

          {/* Nhóm */}
          <Field label="Nhóm vật tư">
            <div style={{position:'relative',display:'flex',alignItems:'center',gap:8}}>
              <div style={{position:'relative',flex:1}}>
                <Tag size={14} color={C.text3} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
                <select value={form.group_id} onChange={e=>handleGroupChange(e.target.value)}
                  style={{...S.input,paddingLeft:34,appearance:'none',cursor:'pointer'}}
                  onFocus={e=>e.target.style.borderColor=C.pink}
                  onBlur={e=>e.target.style.borderColor=C.border}>
                  <option value="">— Chưa phân nhóm —</option>
                  {flatGroups.map(g=>(
                    <option key={g._id} value={g._id} disabled={g._depth===0} style={g._depth===0?{color:C.text3,fontWeight:700}:{}}>
                      {'　'.repeat(g._depth)}{g._depth>0?'└ ':''}{g.name}{g._depth===0?' ──':''}
                    </option>
                  ))}
                </select>
              </div>
              {form.group_id&&(
                <button type="button"
                  onClick={()=>setForm(p=>({...p,group_id:'',material_code:genUniqueCode('VT',existingCodes)}))}
                  style={{width:32,height:32,borderRadius:9,border:'1.5px solid rgba(248,113,113,0.35)',background:'rgba(248,113,113,0.08)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#f87171',flexShrink:0,transition:'all 0.15s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(248,113,113,0.2)'}
                  onMouseLeave={e=>e.currentTarget.style.background='rgba(248,113,113,0.08)'}>
                  <X size={12} weight="bold"/>
                </button>
              )}
            </div>
          </Field>

          {/* Mã */}
          <Field label="Mã vật tư" required error={errors.material_code}>
            <div style={{display:'flex',alignItems:'center',gap:8,justifyContent:'flex-end',marginBottom:4}}>
              {form.group_id&&(
                <span style={{fontSize:11,color:C.text3,background:'rgba(2,132,199,0.08)',border:'1px solid rgba(2,132,199,0.2)',borderRadius:5,padding:'2px 7px',fontFamily:'JetBrains Mono, monospace'}}>
                  prefix: <strong style={{color:C.sky}}>{currentPrefix}</strong>
                </span>
              )}
              <button type="button" onClick={regenCode}
                style={{display:'flex',alignItems:'center',gap:4,fontSize:11.5,color:C.pink,background:'none',border:'none',cursor:'pointer',padding:0,fontFamily:'Outfit, sans-serif',fontWeight:600}}>
                <ArrowsClockwise size={11} weight="bold"/> Sinh lại
              </button>
            </div>
            <input value={form.material_code}
              onChange={e=>setForm(p=>({...p,material_code:e.target.value.toUpperCase()}))}
              placeholder={`VD: ${currentPrefix}-AB3X`}
              style={{...inputStyle(errors.material_code),fontFamily:'JetBrains Mono, monospace',letterSpacing:'0.08em',fontSize:13}}
              onFocus={e=>e.target.style.borderColor=C.pink}
              onBlur={e=>{if(!errors.material_code)e.target.style.borderColor=C.border;}}/>
          </Field>

          {/* Tên */}
          <Field label="Tên vật tư" required error={errors.material_name}>
            <input value={form.material_name}
              onChange={e=>setForm(p=>({...p,material_name:e.target.value}))}
              placeholder="VD: Samsung Galaxy S24 Ultra"
              style={inputStyle(errors.material_name)}
              onFocus={e=>e.target.style.borderColor=C.pink}
              onBlur={e=>{if(!errors.material_name)e.target.style.borderColor=C.border;}}/>
          </Field>

          {/* ══ GIÁ ══ */}
          <div style={{padding:'14px 16px',borderRadius:14,background:'linear-gradient(135deg,rgba(190,24,93,0.04),rgba(124,58,237,0.04))',border:`1px solid rgba(190,24,93,0.12)`}}>
            <div style={{fontSize:11,fontWeight:800,color:C.pink,textTransform:'uppercase',letterSpacing:'1px',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
              <CurrencyDollar size={13}/> Thông tin giá
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <PriceInput
                label="Giá bán"
                value={form.selling_price}
                onChange={v=>setForm(p=>({...p,selling_price:v}))}
                color={C.pink}
                icon={<span style={{fontSize:10,background:C.pinkL,color:C.pink,padding:'1px 5px',borderRadius:4,fontWeight:800}}>BÁN</span>}
              />
              <PriceInput
                label="Giá mua tham khảo"
                value={form.purchase_price}
                onChange={v=>setForm(p=>({...p,purchase_price:v}))}
                color={C.purple}
                icon={<span style={{fontSize:10,background:C.purpleL,color:C.purple,padding:'1px 5px',borderRadius:4,fontWeight:800}}>MUA</span>}
              />
            </div>
            {form.selling_price>0&&form.purchase_price>0&&(
              <div style={{marginTop:10,padding:'7px 12px',borderRadius:9,background:'rgba(5,150,105,0.08)',border:'1px solid rgba(5,150,105,0.2)',fontSize:12,color:C.green,fontWeight:600,display:'flex',justifyContent:'space-between'}}>
                <span>Biên lợi nhuận</span>
                <span style={{fontFamily:'JetBrains Mono,monospace'}}>
                  +{fmtCur(form.selling_price-form.purchase_price)}
                  {' '}({Math.round((form.selling_price-form.purchase_price)/form.selling_price*100)}%)
                </span>
              </div>
            )}
          </div>

          {/* Đơn vị */}
          <UomEditor form={form} setForm={setForm}/>

          {/* Mô tả */}
          <Field label="Mô tả">
            <textarea value={form.description}
              onChange={e=>setForm(p=>({...p,description:e.target.value}))}
              placeholder="Mô tả vật tư..." rows={2}
              style={{...S.input,resize:'none',lineHeight:1.6}}
              onFocus={e=>e.target.style.borderColor=C.pink}
              onBlur={e=>e.target.style.borderColor=C.border}/>
          </Field>

          {/* Trạng thái */}
          <Field label="Trạng thái">
            <div style={{display:'flex',gap:8}}>
              {[{v:'active',label:'Hoạt động',color:C.green,bg:C.greenL},{v:'inactive',label:'Ngừng',color:C.red,bg:C.redL}].map(opt=>(
                <button key={opt.v} type="button" onClick={()=>setForm(p=>({...p,status:opt.v}))}
                  style={{flex:1,padding:'8px 14px',borderRadius:10,border:'1.5px solid',borderColor:form.status===opt.v?opt.color:C.border,background:form.status===opt.v?opt.bg:C.surface,color:form.status===opt.v?opt.color:C.text2,fontFamily:'Outfit, sans-serif',fontSize:13,fontWeight:600,cursor:'pointer',transition:'all 0.18s ease',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                  {form.status===opt.v&&<Check size={13} weight="bold"/>}{opt.label}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {/* Footer */}
        <div style={{display:'flex',justifyContent:'flex-end',gap:10,padding:'14px 22px 18px',borderTop:`1px solid ${C.border}`,flexShrink:0}}>
          <button onClick={onClose} style={{...S.btnSecondary,padding:'9px 18px'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=C.pink}
            onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>Huỷ</button>
          <button onClick={handleSave} disabled={saving}
            style={{...S.btnPrimary,opacity:saving?0.75:1}}
            onMouseEnter={e=>{if(!saving)e.currentTarget.style.transform='translateY(-1px)';}}
            onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
            {saving?<ArrowsClockwise size={14} style={{animation:'mat-spin 0.8s linear infinite'}}/>:<Check size={14} weight="bold"/>}
            {saving?'Đang lưu...':mode==='add'?'Tạo vật tư':'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Pagination ────────────────────────────────────────────────── */
function Pagination({page,totalPages,onChange}) {
  if(totalPages<=1) return null;
  const pages=[];
  for(let i=1;i<=totalPages;i++){if(i===1||i===totalPages||(i>=page-1&&i<=page+1))pages.push(i);else if(pages[pages.length-1]!=='...')pages.push('...');}
  const btnBase={width:34,height:34,borderRadius:9,border:`1.5px solid ${C.border}`,background:C.surface,cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:'JetBrains Mono, monospace',color:C.text2,transition:'all 0.18s ease',display:'flex',alignItems:'center',justifyContent:'center'};
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:4,padding:'16px 0 4px'}}>
      <button onClick={()=>onChange(page-1)} disabled={page===1} style={{...btnBase,opacity:page===1?0.35:1}}><CaretLeft size={13} weight="bold"/></button>
      {pages.map((p,i)=>p==='...'
        ?<span key={`e-${i}`} style={{padding:'0 4px',color:C.text3,fontSize:13}}>···</span>
        :<button key={p} onClick={()=>onChange(p)} style={{...btnBase,background:p===page?`linear-gradient(135deg,${C.pink},${C.pinkD})`:C.surface,borderColor:p===page?C.pink:C.border,color:p===page?'white':C.text2,boxShadow:p===page?'0 2px 10px rgba(190,24,93,0.25)':'none'}}>{p}</button>
      )}
      <button onClick={()=>onChange(page+1)} disabled={page===totalPages} style={{...btnBase,opacity:page===totalPages?0.35:1}}><CaretRight size={13} weight="bold"/></button>
    </div>
  );
}

/* ── SortDropdown ──────────────────────────────────────────────── */
const SORT_OPTIONS=[
  {value:'name_asc',label:'Tên A → Z',icon:<SortAscending size={13}/>},
  {value:'name_desc',label:'Tên Z → A',icon:<SortDescending size={13}/>},
  {value:'code_asc',label:'Mã A → Z',icon:<SortAscending size={13}/>},
  {value:'code_desc',label:'Mã Z → A',icon:<SortDescending size={13}/>},
  {value:'stock_asc',label:'Tồn kho ít nhất',icon:<SortAscending size={13}/>},
  {value:'stock_desc',label:'Tồn kho nhiều nhất',icon:<SortDescending size={13}/>},
  {value:'price_asc',label:'Giá bán thấp nhất',icon:<SortAscending size={13}/>},
  {value:'price_desc',label:'Giá bán cao nhất',icon:<SortDescending size={13}/>},
];

function SortDropdown({value,onChange}) {
  const [open,setOpen]=useState(false);
  const current=SORT_OPTIONS.find(o=>o.value===value)||SORT_OPTIONS[0];
  return (
    <div style={{position:'relative'}}>
      <button onClick={()=>setOpen(p=>!p)}
        style={{...S.btnSecondary,fontSize:13,height:38,paddingInline:13,gap:6}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=C.pink;e.currentTarget.style.color=C.pink;}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.text2;}}>
        <FunnelSimple size={14}/>{current.label}<CaretUpDown size={12} color={C.text3}/>
      </button>
      {open&&(
        <>
          <div onClick={()=>setOpen(false)} style={{position:'fixed',inset:0,zIndex:20}}/>
          <div style={{position:'absolute',top:'calc(100% + 6px)',right:0,zIndex:30,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:14,overflow:'hidden',minWidth:200,boxShadow:'0 12px 40px rgba(0,0,0,0.12)',animation:'mat-fadein 0.15s ease'}}>
            {SORT_OPTIONS.map(o=>(
              <button key={o.value} onClick={()=>{onChange(o.value);setOpen(false);}}
                style={{width:'100%',display:'flex',alignItems:'center',gap:8,padding:'9px 14px',border:'none',cursor:'pointer',background:o.value===value?C.pinkL:'transparent',color:o.value===value?C.pink:C.text2,fontSize:13,fontFamily:'Outfit, sans-serif',textAlign:'left',transition:'background 0.12s',fontWeight:o.value===value?600:400}}
                onMouseEnter={e=>{if(o.value!==value)e.currentTarget.style.background='#f8fafc';}}
                onMouseLeave={e=>{if(o.value!==value)e.currentTarget.style.background='transparent';}}>
                {o.icon}{o.label}
                {o.value===value&&<Check size={12} style={{marginLeft:'auto'}} weight="bold"/>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── StockCell ─────────────────────────────────────────────────── */
function StockCell({m}) {
  const stock=m.totalStock||m.total_stock||0;
  const units=m.units||[];
  const base=units.find(u=>u.is_base);
  const biggest=[...units].filter(u=>!u.is_base&&u.ratio>1).sort((a,b)=>b.ratio-a.ratio)[0];
  if(!units.length) return <span style={{fontFamily:'JetBrains Mono, monospace',fontWeight:700,color:stock?C.text1:C.text3,fontSize:14}}>{stock||'—'}</span>;
  const bigQty=biggest?Math.floor(stock/biggest.ratio):0;
  return (
    <div style={{display:'flex',flexDirection:'column',gap:2}}>
      <span style={{fontFamily:'JetBrains Mono, monospace',fontWeight:700,color:C.text1,fontSize:14}}>
        {biggest&&bigQty>0
          ?<>{bigQty} <span style={{color:C.sky,fontSize:12}}>{biggest.name}</span></>
          :<>{stock} <span style={{color:C.sky,fontSize:12}}>{base?.name||''}</span></>
        }
      </span>
      {biggest&&bigQty>0&&<span style={{fontSize:11,color:C.text3}}>= {stock} {base?.name}</span>}
    </div>
  );
}

/* ── PriceCell ─────────────────────────────────────────────────── */
function PriceCell({selling,purchase}) {
  if(!selling&&!purchase) return <span style={{color:C.text3,fontSize:13}}>—</span>;
  return (
    <div style={{display:'flex',flexDirection:'column',gap:2}}>
      {selling>0&&<span style={{fontFamily:'JetBrains Mono,monospace',fontWeight:700,color:C.pink,fontSize:12.5}}>{fmtCur(selling)}</span>}
      {purchase>0&&<span style={{fontFamily:'JetBrains Mono,monospace',fontSize:11,color:C.text3}}>{fmtCur(purchase)}</span>}
    </div>
  );
}

/* ── Main ──────────────────────────────────────────────────────── */
const Materials=({user})=>{
  const [materials,setMaterials]=useState([]);
  const [groups,setGroups]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState('');
  const [filterGroup,setFilterGroup]=useState('');
  const [filterGroupName,setFilterGroupName]=useState('');
  const [activeTab,setActiveTab]=useState('list');
  const [sortBy,setSortBy]=useState('name_asc');
  const [page,setPage]=useState(1);
  const [modal,setModal]=useState(null);
  const isAdmin=user?.role==='admin';

  const fetchData=useCallback(async()=>{
    setLoading(true);
    try {
      const [mRes,gRes]=await Promise.all([api.get('/materials'),api.get('/material-groups')]);
      setMaterials(mRes.data?.data||mRes.data||[]);
      setGroups(gRes.data?.data||gRes.data||[]);
    } catch(err){console.error(err);}
    finally{setLoading(false);}
  },[]);

  const fetchGroups=useCallback(async()=>{try{const r=await api.get('/material-groups');setGroups(r.data?.data||r.data||[]);}catch(err){console.error(err);}}, []);
  const fetchMaterials=useCallback(async()=>{try{const r=await api.get('/materials');setMaterials(r.data?.data||r.data||[]);}catch(err){console.error(err);}}, []);

  useEffect(()=>{fetchData();},[fetchData]);
  useEffect(()=>{setPage(1);},[search,filterGroup,sortBy]);

  const handleGroupClick=useCallback(group=>{setFilterGroup(group._id);setFilterGroupName(group.name);setActiveTab('list');setSearch('');setPage(1);},[]);
  const clearGroupFilter=()=>{setFilterGroup('');setFilterGroupName('');setPage(1);};

  const normalize=m=>({
    ...m,
    _name:m.material_name||m.product_name||'—',
    _code:m.material_code||m.product_code||'—',
    _group:m.group_id?.name||m.category_id?.name||m.group_name||'—',
    _groupId:m.group_id?._id||m.group_id||m.category_id?._id||m.category_id||'',
    _unit:m.unit||'—',
    _stock:m.totalStock||0,
    _sellPrice:m.selling_price||0,
    _buyPrice:m.purchase_price||0,
  });

  const flatGroupOptions=useMemo(()=>{
    const result=[];
    function flatten(list,depth=0){list.forEach(g=>{result.push({...g,_depth:depth});const children=groups.filter(c=>String(c.parent_id?._id||c.parent_id)===String(g._id));if(children.length)flatten(children,depth+1);});}
    flatten(groups.filter(g=>!g.parent_id));
    return result;
  },[groups]);

  const getDescendantIds=useCallback(groupId=>{
    const ids=new Set([String(groupId)]);
    const queue=[String(groupId)];
    while(queue.length){
      const current=queue.shift();
      groups.forEach(g=>{const pid=String(g.parent_id?._id||g.parent_id||'');if(pid===current){const sid=String(g._id);if(!ids.has(sid)){ids.add(sid);queue.push(sid);}}});
    }
    return ids;
  },[groups]);

  const existingCodes=useMemo(()=>{
    const codes=new Set();
    materials.forEach(m=>{const code=m.material_code||m.product_code;if(code)codes.add(code.trim().toUpperCase());});
    return codes;
  },[materials]);

  const allFiltered=useMemo(()=>{
    const normalized=materials.map(normalize);
    const q=search.toLowerCase();
    const descendantIds=filterGroup?getDescendantIds(filterGroup):null;
    const base=normalized.filter(m=>{
      const matchSearch=!search||m._name.toLowerCase().includes(q)||m._code.toLowerCase().includes(q);
      const matchGroup=!filterGroup||(m._groupId&&descendantIds.has(String(m._groupId)));
      return matchSearch&&matchGroup;
    });
    return [...base].sort((a,b)=>{
      switch(sortBy){
        case 'name_asc':   return a._name.localeCompare(b._name,'vi');
        case 'name_desc':  return b._name.localeCompare(a._name,'vi');
        case 'code_asc':   return a._code.localeCompare(b._code);
        case 'code_desc':  return b._code.localeCompare(a._code);
        case 'stock_asc':  return a._stock-b._stock;
        case 'stock_desc': return b._stock-a._stock;
        case 'price_asc':  return a._sellPrice-b._sellPrice;
        case 'price_desc': return b._sellPrice-a._sellPrice;
        default:return 0;
      }
    });
  },[materials,search,filterGroup,sortBy,getDescendantIds]);

  const totalPages=Math.max(1,Math.ceil(allFiltered.length/PAGE_SIZE));
  const paginated=allFiltered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);

  const matCountByGroup=useMemo(()=>{
    const directMap={};
    materials.map(normalize).forEach(m=>{if(m._groupId)directMap[String(m._groupId)]=(directMap[String(m._groupId)]||0)+1;});
    const totalMap={...directMap};
    groups.forEach(g=>{
      let current=g;
      const count=directMap[String(g._id)]||0;
      if(!count)return;
      const visited=new Set();
      while(current.parent_id){
        const parentId=String(current.parent_id?._id||current.parent_id);
        if(visited.has(parentId))break;
        visited.add(parentId);
        totalMap[parentId]=(totalMap[parentId]||0)+count;
        current=groups.find(g2=>String(g2._id)===parentId)||{};
        if(!current._id)break;
      }
    });
    return totalMap;
  },[materials,groups]);

  const groupsWithCount=useMemo(()=>groups.map(g=>({...g,material_count:matCountByGroup[String(g._id)]||0})),[groups,matCountByGroup]);

  const handleSaveMaterial=async form=>{
    try {
      const code=form.material_code.trim();
      const name=form.material_name.trim();
      const payload={
        material_code:code,material_name:name,
        product_code:code,product_name:name,
        unit:form.units.find(u=>u.is_base)?.name||form.unit||'',
        units:form.units.filter(u=>u.name.trim()),
        description:form.description,status:form.status,
        selling_price:form.selling_price||0,
        purchase_price:form.purchase_price||0,
        ...(form.group_id?{group_id:form.group_id,category_id:form.group_id}:{}),
      };
      if(modal.mode==='add') await api.post('/materials',payload);
      else await api.put(`/materials/${modal.initial._id}`,payload);
      setModal(null);fetchMaterials();
    } catch(err){alert(err.response?.data?.message||err.message);}
  };

  const handleDelete=async id=>{
    if(!window.confirm('Xóa vật tư này?'))return;
    try{await api.delete(`/materials/${id}`);setMaterials(p=>p.filter(m=>m._id!==id));}
    catch(err){alert(err.message);}
  };

  /* ── Render ── */
  return (
    <div style={{minHeight:'100vh',background:C.bg,fontFamily:'Outfit, sans-serif',padding:'28px 32px 56px'}}>

      {/* Header */}
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:24,gap:16}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div style={{width:48,height:48,borderRadius:15,background:`linear-gradient(135deg,${C.pinkL},#fce4ef)`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 16px rgba(190,24,93,0.18)',flexShrink:0}}>
            <Package size={24} color={C.pink} weight="duotone"/>
          </div>
          <div>
            <h1 style={{fontSize:22,fontWeight:800,color:C.text1,margin:0,letterSpacing:'-0.5px'}}>Vật Tư</h1>
            <div style={{fontSize:13,color:C.text3,marginTop:3}}>
              {activeTab==='list'
                ?<><span style={{fontFamily:'JetBrains Mono, monospace',color:C.pink,fontWeight:700}}>{allFiltered.length}</span> / <span style={{fontFamily:'JetBrains Mono, monospace',fontWeight:600}}>{materials.length}</span> vật tư</>
                :<><span style={{fontFamily:'JetBrains Mono, monospace',fontWeight:700}}>{groups.length}</span> nhóm vật tư</>
              }
            </div>
          </div>
        </div>
        {isAdmin&&(
          <button style={S.btnPrimary}
            onClick={()=>activeTab==='list'&&setModal({mode:'add'})}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 6px 20px rgba(190,24,93,0.40)';}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 2px 12px rgba(190,24,93,0.30)';}}>
            <Plus size={15} weight="bold"/>{activeTab==='list'?'Thêm Vật Tư':'Thêm Nhóm'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:3,background:'#f1f5f9',borderRadius:14,padding:4,width:'fit-content',marginBottom:22}}>
        {[{key:'list',label:'Danh Sách Vật Tư',icon:<Package size={14}/>},{key:'groups',label:'Nhóm Vật Tư',icon:<Tag size={14}/>}].map(t=>(
          <button key={t.key} onClick={()=>setActiveTab(t.key)}
            style={{display:'flex',alignItems:'center',gap:7,padding:'8px 18px',borderRadius:11,border:'none',cursor:'pointer',fontFamily:'Outfit, sans-serif',fontSize:13.5,fontWeight:activeTab===t.key?700:500,background:activeTab===t.key?C.surface:'transparent',color:activeTab===t.key?C.pink:C.text3,boxShadow:activeTab===t.key?'0 2px 8px rgba(0,0,0,0.08),0 0 0 1px rgba(190,24,93,0.10)':'none',transition:'all 0.22s cubic-bezier(0.16,1,0.3,1)'}}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* List Tab */}
      {activeTab==='list'&&(
        <>
          {/* Filter bar */}
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18,flexWrap:'wrap'}}>
            <div style={{position:'relative',flex:1,minWidth:220,maxWidth:460}}>
              <MagnifyingGlass size={15} color={C.text3} style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
              <input placeholder="Tìm tên hoặc mã vật tư..." value={search} onChange={e=>setSearch(e.target.value)}
                style={{...S.input,paddingLeft:38}}
                onFocus={e=>{e.target.style.borderColor=C.pink;e.target.style.boxShadow=`0 0 0 3px rgba(190,24,93,0.10)`;}}
                onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow='none';}}/>
              {search&&<button onClick={()=>setSearch('')} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:C.text3,display:'flex',alignItems:'center'}}><X size={14}/></button>}
            </div>
            {filterGroupName?(
              <div style={{display:'inline-flex',alignItems:'center',gap:7,padding:'7px 13px',borderRadius:10,background:'rgba(2,132,199,0.08)',border:'1.5px solid rgba(2,132,199,0.25)',fontSize:13,color:C.sky,fontWeight:600,flexShrink:0}}>
                <Tag size={13}/>{filterGroupName}
                <button onClick={clearGroupFilter} style={{background:'none',border:'none',cursor:'pointer',padding:0,color:C.sky,display:'flex',alignItems:'center',marginLeft:2}}><X size={13}/></button>
              </div>
            ):(
              <div style={{position:'relative',flexShrink:0}}>
                <Tag size={14} color={C.text3} style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
                <select value={filterGroup}
                  onChange={e=>{const g=flatGroupOptions.find(g=>g._id===e.target.value);setFilterGroup(e.target.value);setFilterGroupName(g?.name||'');}}
                  style={{...S.input,width:'auto',minWidth:180,paddingLeft:32,appearance:'none',cursor:'pointer',paddingRight:32}}
                  onFocus={e=>e.target.style.borderColor=C.pink}
                  onBlur={e=>e.target.style.borderColor=C.border}>
                  <option value="">Tất cả nhóm</option>
                  {flatGroupOptions.map(g=><option key={g._id} value={g._id}>{'　'.repeat(g._depth)}{g._depth>0?'└ ':''}{g.name}</option>)}
                </select>
              </div>
            )}
            <SortDropdown value={sortBy} onChange={setSortBy}/>
          </div>

          {filterGroupName&&(
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,fontSize:13,color:C.text3}}>
              <button onClick={()=>setActiveTab('groups')} style={{background:'none',border:'none',cursor:'pointer',color:C.pink,fontSize:13,padding:0,display:'flex',alignItems:'center',gap:4,fontFamily:'Outfit, sans-serif',fontWeight:600}}>
                <ArrowLeft size={13}/> Nhóm Vật Tư
              </button>
              <span style={{color:C.border}}>›</span>
              <strong style={{color:C.text1}}>{filterGroupName}</strong>
              <span style={{color:C.border}}>›</span>
              <span style={{fontFamily:'JetBrains Mono, monospace',color:C.pink,fontWeight:600}}>{allFiltered.length}</span>
              <span>vật tư</span>
            </div>
          )}

          {/* Table */}
          <div style={{...S.card,animation:'mat-fadeup 0.4s cubic-bezier(0.16,1,0.3,1)'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13.5}}>
              <thead>
                <tr style={{background:'#f8fafc',borderBottom:'1.5px solid #f1f5f9'}}>
                  {['MÃ','TÊN VẬT TƯ','NHÓM','GIÁ BÁN / MUA','SỐ LƯỢNG','TRẠNG THÁI',...(isAdmin?['THAO TÁC']:[])].map((h,i)=>(
                    <th key={h} style={{padding:'12px 16px',textAlign:i===6?'right':'left',fontSize:11,fontWeight:700,color:C.text3,letterSpacing:'0.8px',whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading?(
                  [...Array(8)].map((_,i)=>(
                    <tr key={i} style={{borderBottom:'1px solid #f8fafc'}}>
                      {[...Array(isAdmin?7:6)].map((_,j)=><td key={j} style={{padding:'14px 16px'}}><Skel h={13} w={j===1?'70%':'55%'}/></td>)}
                    </tr>
                  ))
                ):paginated.length===0?(
                  <tr>
                    <td colSpan={isAdmin?7:6} style={{padding:'56px 20px',textAlign:'center'}}>
                      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
                        <div style={{width:64,height:64,background:'#f8fafc',borderRadius:18,display:'flex',alignItems:'center',justifyContent:'center',border:`1.5px dashed ${C.border}`,color:C.text3}}>
                          <Package size={28}/>
                        </div>
                        <div style={{fontSize:14,fontWeight:600,color:C.text2}}>
                          {filterGroupName?`Nhóm "${filterGroupName}" chưa có vật tư`:search?'Không tìm thấy kết quả':'Chưa có vật tư nào'}
                        </div>
                      </div>
                    </td>
                  </tr>
                ):paginated.map((m,rowIdx)=>(
                  <tr key={m._id}
                    style={{borderBottom:'1px solid #f8fafc',transition:'background 0.15s ease',animation:`mat-fadeup 0.35s cubic-bezier(0.16,1,0.3,1) ${rowIdx*30}ms both`}}
                    onMouseEnter={e=>e.currentTarget.style.background='#fdfbfe'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{padding:'13px 16px'}}>
                      <span style={{fontFamily:'JetBrains Mono, monospace',fontSize:12,fontWeight:700,color:C.pink,background:C.pinkL,padding:'3px 8px',borderRadius:6,whiteSpace:'nowrap'}}>{m._code}</span>
                    </td>
                    <td style={{padding:'13px 16px',fontWeight:600,color:C.text1,maxWidth:280}}>
                      <div style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m._name}</div>
                    </td>
                    <td style={{padding:'13px 16px'}}>
                      {m._group!=='—'?(
                        <button
                          onClick={()=>{const g=groups.find(g=>String(g._id)===String(m._groupId));if(g)handleGroupClick(g);}}
                          style={{background:C.skyL,border:'1px solid rgba(2,132,199,0.25)',borderRadius:7,padding:'3px 10px',fontSize:12,color:C.sky,cursor:'pointer',fontFamily:'Outfit, sans-serif',fontWeight:600,transition:'all 0.15s',whiteSpace:'nowrap'}}
                          onMouseEnter={e=>{e.currentTarget.style.background='#bae6fd';e.currentTarget.style.borderColor=C.sky;}}
                          onMouseLeave={e=>{e.currentTarget.style.background=C.skyL;e.currentTarget.style.borderColor='rgba(2,132,199,0.25)';}}>
                          {m._group}
                        </button>
                      ):<span style={{color:C.text3,fontSize:13}}>—</span>}
                    </td>
                    <td style={{padding:'13px 16px'}}>
                      <PriceCell selling={m._sellPrice} purchase={m._buyPrice}/>
                    </td>
                    <td style={{padding:'13px 16px'}}><StockCell m={m}/></td>
                    <td style={{padding:'13px 16px'}}>
                      <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'4px 11px',borderRadius:8,fontSize:11.5,fontWeight:700,background:m.status==='active'?C.greenL:C.redL,color:m.status==='active'?C.green:C.red}}>
                        <span style={{width:6,height:6,borderRadius:'50%',background:'currentColor',display:'inline-block'}}/>
                        {m.status==='active'?'HOẠT ĐỘNG':'NGỪNG'}
                      </span>
                    </td>
                    {isAdmin&&(
                      <td style={{padding:'13px 16px',textAlign:'right'}}>
                        <div style={{display:'inline-flex',gap:5}}>
                          <button onClick={()=>setModal({mode:'edit',initial:m})}
                            style={{width:30,height:30,border:`1.5px solid ${C.border}`,background:C.surface,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:C.text3,transition:'all 0.18s ease'}}
                            onMouseEnter={e=>{e.currentTarget.style.borderColor='#93c5fd';e.currentTarget.style.background='#eff6ff';e.currentTarget.style.color='#2563eb';}}
                            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.surface;e.currentTarget.style.color=C.text3;}}>
                            <PencilSimple size={13}/>
                          </button>
                          <button onClick={()=>handleDelete(m._id)}
                            style={{width:30,height:30,border:`1.5px solid ${C.border}`,background:C.surface,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:C.text3,transition:'all 0.18s ease'}}
                            onMouseEnter={e=>{e.currentTarget.style.borderColor='#fca5a5';e.currentTarget.style.background=C.redL;e.currentTarget.style.color=C.red;}}
                            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.surface;e.currentTarget.style.color=C.text3;}}>
                            <Trash size={13}/>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading&&allFiltered.length>0&&(
              <div style={{padding:'0 20px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',borderTop:'1px solid #f8fafc'}}>
                <span style={{fontSize:12.5,color:C.text3,fontFamily:'JetBrains Mono, monospace'}}>
                  Trang <strong style={{color:C.text2}}>{page}</strong>/{totalPages} · <strong style={{color:C.pink}}>{allFiltered.length}</strong> kết quả
                </span>
                <Pagination page={page} totalPages={totalPages} onChange={setPage}/>
              </div>
            )}
          </div>
        </>
      )}

      {/* Groups Tab */}
      {activeTab==='groups'&&(
        <div style={{animation:'mat-fadeup 0.4s cubic-bezier(0.16,1,0.3,1)'}}>
          <MaterialGroupTree groups={groupsWithCount} isAdmin={isAdmin} onRefresh={fetchGroups} onGroupClick={handleGroupClick} api={api}/>
        </div>
      )}

      {/* Modal */}
      {modal&&(
        <MaterialModal mode={modal.mode} initial={modal.initial} groups={groups} existingCodes={existingCodes} onSave={handleSaveMaterial} onClose={()=>setModal(null)}/>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
        @keyframes mat-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes mat-fadeup{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes mat-fadein{from{opacity:0}to{opacity:1}}
        @keyframes mat-scalein{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
        @keyframes mat-spin{to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
};

export default Materials;