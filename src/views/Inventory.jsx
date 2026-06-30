// ================================================================
//  WMS — LUXURY INVENTORY  v3.1  (fixed total_value + editable min_stock)
//  Paste to: src/views/Inventory.jsx
// ================================================================
import { useState, useEffect, useCallback } from 'react';
import {
  ChartBar, MagnifyingGlass, ArrowsClockwise, Warning,
  Package, Warehouse, SlidersHorizontal, X, FloppyDisk,
  CheckCircle, Funnel, CurrencyDollar,
} from '@phosphor-icons/react';
import api from '../services/api';

/* ── Tokens ───────────────────────────────────────────────────── */
const C = {
  pink:'#be185d', pinkD:'#9d174d', pinkL:'#fce7f3',
  green:'#059669', greenL:'#d1fae5',
  red:'#dc2626',   redL:'#fee2e2',
  amber:'#d97706', amberL:'#fef3c7',
  sky:'#0284c7',   skyL:'#e0f2fe',
  bg:'#f0f4f8', surface:'#ffffff',
  border:'#e2e8f0', border2:'#f1f5f9',
  text1:'#1e293b', text2:'#475569', text3:'#94a3b8',
};

const fmt    = n => Number(n||0).toLocaleString('vi-VN');
const fmtCur = n => Number(n||0).toLocaleString('vi-VN',{style:'currency',currency:'VND'});

const inSx = () => ({
  width:'100%', padding:'9px 12px',
  border:`1.5px solid ${C.border}`, borderRadius:10,
  background:C.surface, fontFamily:'Outfit,sans-serif',
  fontSize:13.5, color:C.text1, outline:'none',
  transition:'border-color 0.2s, box-shadow 0.2s', boxSizing:'border-box',
});
const focusPink = e=>{e.target.style.borderColor=C.pink;e.target.style.boxShadow=`0 0 0 3px rgba(190,24,93,0.10)`;};
const blurReset = e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow='none';};

/* ── Stock Bar ────────────────────────────────────────────────── */
const StockBar = ({qty, min, max}) => {
  const safeMax = max || Math.max(qty*2, (min||0)*3, 10);
  const pct     = Math.min((qty/safeMax)*100, 100);
  const color   = qty===0 ? C.red : (min>0 && qty<min) ? C.amber : C.green;
  return (
    <div style={{display:'flex',alignItems:'center',gap:10}}>
      <div style={{flex:1,height:6,background:'#f1f5f9',borderRadius:10,overflow:'hidden'}}>
        <div style={{width:`${pct}%`,height:'100%',background:color,borderRadius:10,transition:'width 0.6s cubic-bezier(0.16,1,0.3,1)'}}/>
      </div>
      <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:13,fontWeight:700,color,minWidth:38,textAlign:'right'}}>{fmt(qty)}</span>
    </div>
  );
};

/* ── Stock Badge ──────────────────────────────────────────────── */
const StockBadge = ({qty, min}) => {
  if(qty===0)            return <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:8,fontSize:11,fontWeight:700,background:C.redL,color:C.red,border:'1px solid rgba(220,38,38,0.25)'}}><Warning size={11} weight="fill"/>Hết hàng</span>;
  if(min>0 && qty<min)   return <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:8,fontSize:11,fontWeight:700,background:C.amberL,color:C.amber,border:'1px solid rgba(217,119,6,0.25)'}}><Warning size={11} weight="fill"/>Sắp hết</span>;
  return <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:8,fontSize:11,fontWeight:700,background:C.greenL,color:C.green,border:'1px solid rgba(5,150,105,0.25)'}}><CheckCircle size={11} weight="fill"/>Đủ hàng</span>;
};

/* ── Shimmer ──────────────────────────────────────────────────── */
const Skel = ({w='100%',h=13,r=6}) => (
  <div style={{width:w,height:h,borderRadius:r,background:'linear-gradient(90deg,#f1f5f9 25%,#e8edf3 50%,#f1f5f9 75%)',backgroundSize:'200% 100%',animation:'inv-shimmer 1.5s ease-in-out infinite'}}/>
);

/* ── AdjustModal ──────────────────────────────────────────────── */
function AdjustModal({open, stock, warehouses, onClose, onSaved}) {
  const [warehouseId,setWarehouseId] = useState('');
  const [qty,setQty]         = useState(0);
  const [minStock,setMinSt]  = useState(0); // ✅ mức tồn thấp
  const [reason,setReason]   = useState('');
  const [saving,setSaving]   = useState(false);
  const [err,setErr]         = useState('');

  useEffect(()=>{
    if(!open) return;
    setWarehouseId(stock?.warehouse_id?._id||stock?.warehouse_id||'');
    setQty(stock?.quantity_on_hand??0);
    setMinSt(stock?.min_stock??0); // ✅ load mức tồn thấp hiện tại
    setReason(''); setErr('');
  },[open,stock]);

  const handleSave = async()=>{
    if(!warehouseId) return setErr('Chọn kho');
    if(qty<0)        return setErr('Số lượng không thể âm');
    if(minStock<0)   return setErr('Mức tồn thấp không thể âm');
    setSaving(true); setErr('');
    try {
      await api.post('/material-stock/adjust',{
        material_id:      stock.material_id?._id||stock.material_id,
        warehouse_id:     warehouseId,
        quantity_on_hand: Number(qty),
        min_stock:        Number(minStock), // ✅ gửi mức tồn thấp lên backend
        reason,
      });
      onSaved();
    } catch(e) { setErr(e.message||'Lỗi server'); }
    finally { setSaving(false); }
  };

  if(!open) return null;
  const matName = stock?.material_id?.product_name||stock?.material_id?.material_name||'—';
  const matCode = stock?.material_id?.product_code||stock?.material_id?.material_code||'';
  const diff    = Number(qty)-(stock?.quantity_on_hand||0);

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.52)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,backdropFilter:'blur(7px)',animation:'inv-fadein 0.2s ease'}}>
      <div style={{background:C.surface,borderRadius:24,padding:'0 0 24px',width:460,boxShadow:'0 24px 64px rgba(0,0,0,0.16)',border:`1px solid ${C.border}`,animation:'inv-scalein 0.3s cubic-bezier(0.16,1,0.3,1)',overflow:'hidden'}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 22px',background:'linear-gradient(135deg,#fdf2f8,#fce7f3)',borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:'flex',alignItems:'center',gap:11}}>
            <div style={{width:40,height:40,borderRadius:12,background:`linear-gradient(135deg,${C.pink},${C.pinkD})`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 12px rgba(190,24,93,0.28)'}}>
              <SlidersHorizontal size={20} color="#fff" weight="duotone"/>
            </div>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:C.text1}}>Điều chỉnh tồn kho</div>
              <div style={{fontSize:12,color:C.pink,marginTop:1}}>Cập nhật số lượng & ngưỡng cảnh báo</div>
            </div>
          </div>
          <button onClick={onClose}
            style={{width:32,height:32,border:`1.5px solid ${C.border}`,background:C.surface,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:C.text3,transition:'all 0.18s'}}
            onMouseEnter={e=>{e.currentTarget.style.background=C.redL;e.currentTarget.style.color=C.red;}}
            onMouseLeave={e=>{e.currentTarget.style.background=C.surface;e.currentTarget.style.color=C.text3;}}>
            <X size={14}/>
          </button>
        </div>

        <div style={{padding:'20px 22px',display:'flex',flexDirection:'column',gap:16}}>
          {/* Material info */}
          <div style={{padding:'12px 16px',background:'#f8fafc',borderRadius:12,border:`1px solid ${C.border}`}}>
            <div style={{fontWeight:700,fontSize:14.5,color:C.text1}}>{matName}</div>
            {matCode&&<div style={{fontSize:12,color:C.pink,fontFamily:'JetBrains Mono,monospace',marginTop:3,background:C.pinkL,display:'inline-block',padding:'1px 7px',borderRadius:5}}>{matCode}</div>}
            <div style={{display:'flex',gap:20,marginTop:10,fontSize:13,color:C.text2}}>
              <span>Tồn hiện tại: <strong style={{color:C.text1,fontFamily:'JetBrains Mono,monospace'}}>{fmt(stock?.quantity_on_hand)}</strong></span>
              <span>Khả dụng: <strong style={{color:C.text1,fontFamily:'JetBrains Mono,monospace'}}>{fmt(stock?.quantity_available)}</strong></span>
            </div>
          </div>

          {/* Warehouse */}
          <div style={{display:'flex',flexDirection:'column',gap:5}}>
            <label style={{fontSize:11.5,fontWeight:700,color:C.text2,textTransform:'uppercase',letterSpacing:'0.5px'}}>Kho <span style={{color:C.pink}}>*</span></label>
            <select value={warehouseId} onChange={e=>setWarehouseId(e.target.value)}
              style={{...inSx(),appearance:'none',cursor:'pointer'}}
              onFocus={focusPink} onBlur={blurReset}>
              <option value="">— Chọn kho —</option>
              {warehouses.map(w=><option key={w._id} value={w._id}>{w.name||w.warehouse_name}</option>)}
            </select>
          </div>

          {/* Qty + Min stock - side by side */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <div style={{display:'flex',flexDirection:'column',gap:5}}>
              <label style={{fontSize:11.5,fontWeight:700,color:C.text2,textTransform:'uppercase',letterSpacing:'0.5px'}}>Tồn mới <span style={{color:C.pink}}>*</span></label>
              <input type="number" min={0} value={qty} onChange={e=>setQty(e.target.value)}
                style={{...inSx(),fontSize:18,fontWeight:800,textAlign:'center',fontFamily:'JetBrains Mono,monospace'}}
                onFocus={focusPink} onBlur={blurReset}/>
            </div>
            {/* ✅ Mức tồn thấp - editable */}
            <div style={{display:'flex',flexDirection:'column',gap:5}}>
              <label style={{fontSize:11.5,fontWeight:700,color:C.amber,textTransform:'uppercase',letterSpacing:'0.5px',display:'flex',alignItems:'center',gap:4}}>
                <Warning size={11} weight="fill"/>Mức tồn thấp
              </label>
              <input type="number" min={0} value={minStock} onChange={e=>setMinSt(e.target.value)}
                placeholder="VD: 10"
                style={{...inSx(),fontSize:18,fontWeight:800,textAlign:'center',fontFamily:'JetBrains Mono,monospace',borderColor:'rgba(217,119,6,0.3)'}}
                onFocus={e=>{e.target.style.borderColor=C.amber;e.target.style.boxShadow=`0 0 0 3px rgba(217,119,6,0.12)`;}}
                onBlur={e=>{e.target.style.borderColor='rgba(217,119,6,0.3)';e.target.style.boxShadow='none';}}/>
            </div>
          </div>

          {diff!==0&&(
            <div style={{textAlign:'center',fontSize:13,fontWeight:700,color:diff>0?C.green:C.red,background:diff>0?C.greenL:C.redL,padding:'5px 12px',borderRadius:8,border:`1px solid ${diff>0?'rgba(5,150,105,0.2)':'rgba(220,38,38,0.2)'}`}}>
              {diff>0?`+${fmt(diff)}`:fmt(diff)} so với hiện tại
            </div>
          )}

          {/* Hint giải thích mức tồn thấp */}
          <div style={{padding:'9px 13px',background:C.amberL,borderRadius:10,fontSize:12,color:'#92400e',border:'1px solid rgba(217,119,6,0.2)',lineHeight:1.5}}>
            💡 Khi tồn kho giảm dưới mức này, hệ thống sẽ tự động cảnh báo "Sắp hết hàng".
          </div>

          {/* Reason */}
          <div style={{display:'flex',flexDirection:'column',gap:5}}>
            <label style={{fontSize:11.5,fontWeight:700,color:C.text2,textTransform:'uppercase',letterSpacing:'0.5px'}}>Lý do điều chỉnh</label>
            <input value={reason} onChange={e=>setReason(e.target.value)}
              placeholder="VD: Kiểm kê thực tế, nhập sai, hàng hỏng..."
              style={inSx()} onFocus={focusPink} onBlur={blurReset}/>
          </div>

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
              {saving?<ArrowsClockwise size={14} style={{animation:'inv-spin 0.8s linear infinite'}}/>:<FloppyDisk size={14} weight="bold"/>}
              {saving?'Đang lưu...':'Lưu điều chỉnh'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────── */
export default function Inventory() {
  const [stocks,setStocks]         = useState([]);
  const [loading,setLoading]       = useState(true);
  const [search,setSearch]         = useState('');
  const [warehouseFilter,setWfil]  = useState('');
  const [lowOnly,setLowOnly]       = useState(false);
  const [warehouses,setWarehouses] = useState([]);
  const [adjustModal,setAdjust]    = useState({open:false,stock:null});

  const load = useCallback(async()=>{
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if(warehouseFilter) params.set('warehouse_id',warehouseFilter);
      if(lowOnly)         params.set('low_stock_only','true');
      const res = await api.get(`/material-stock?${params}`);
      const d = res?.data?.data ?? res?.data ?? res;
      setStocks(Array.isArray(d)?d:[]);
    } catch { setStocks([]); }
    finally { setLoading(false); }
  },[warehouseFilter,lowOnly]);

  useEffect(()=>{load();},[load]);
  useEffect(()=>{
    api.get('/warehouses').then(r=>{
      const d=r?.data??r;
      setWarehouses(Array.isArray(d?.data)?d.data:Array.isArray(d)?d:[]);
    }).catch(()=>{});
  },[]);

  const filtered = stocks.filter(s=>{
    if(!search) return true;
    const q=search.toLowerCase();
    const name=(s.material_id?.product_name||s.material_id?.material_name||'').toLowerCase();
    const code=(s.material_id?.product_code||s.material_id?.material_code||'').toLowerCase();
    return name.includes(q)||code.includes(q);
  });

  // ✅ Giá trị tồn kho = Tồn thực tế × Giá bán (lấy từ Vật Tư, không dùng giá vốn nội bộ)
  const getValue = s => {
    const qty   = s.quantity_on_hand || 0;
    const price = s.material_id?.selling_price || 0;
    return qty * price;
  };

  const outOfStock = stocks.filter(s=>(s.quantity_on_hand||0)===0).length;
  const lowStock   = stocks.filter(s=>{
    const min = s.min_stock||0;
    const qty = s.quantity_on_hand||0;
    return min>0 && qty>0 && qty<min;
  }).length;
  const totalValue = stocks.reduce((sum,s)=>sum+getValue(s),0);

  const STATS = [
    {label:'Tổng vật tư',    value:stocks.length,      unit:'mặt hàng', color:C.pink,  bg:C.pinkL,  Icon:Package,        accentTop:`linear-gradient(90deg,${C.pink},#f472b6)`},
    {label:'Hết hàng',       value:outOfStock,          unit:'mặt hàng', color:C.red,   bg:C.redL,   Icon:Warning,        accentTop:`linear-gradient(90deg,${C.red},#f87171)`},
    {label:'Sắp hết',        value:lowStock,            unit:'mặt hàng', color:C.amber, bg:C.amberL, Icon:Warning,        accentTop:`linear-gradient(90deg,${C.amber},#fbbf24)`},
    {label:'Giá trị tồn kho',value:fmtCur(totalValue),  unit:'',         color:C.sky,   bg:C.skyL,   Icon:CurrencyDollar, accentTop:`linear-gradient(90deg,${C.sky},#38bdf8)`, big:true},
  ];

  return (
    <div style={{minHeight:'100vh',background:C.bg,fontFamily:'Outfit,sans-serif',padding:'28px 32px 56px'}}>

      {/* ══ PAGE HEADER ══ */}
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:22}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div style={{width:48,height:48,borderRadius:15,background:`linear-gradient(135deg,${C.pinkL},#fce4ef)`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 16px rgba(190,24,93,0.20)',flexShrink:0}}>
            <ChartBar size={24} color={C.pink} weight="duotone"/>
          </div>
          <div>
            <h1 style={{fontSize:22,fontWeight:800,color:C.text1,margin:0,letterSpacing:'-0.5px'}}>Tồn Kho</h1>
            <div style={{fontSize:13,color:C.text3,marginTop:3}}>Theo dõi số lượng & giá trị tồn kho</div>
          </div>
        </div>
        <button onClick={load}
          style={{width:40,height:40,border:`1.5px solid ${C.border}`,background:C.surface,borderRadius:11,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:C.text3,transition:'all 0.2s',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.pink;e.currentTarget.style.color=C.pink;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.text3;}}>
          <ArrowsClockwise size={16} weight="bold"/>
        </button>
      </div>

      {/* ══ STAT CARDS ══ */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:22}}>
        {STATS.map(s=>(
          <div key={s.label}
            style={{background:C.surface,borderRadius:20,padding:'20px 22px',border:`1px solid ${C.border}`,boxShadow:'0 4px 20px rgba(0,0,0,0.05)',position:'relative',overflow:'hidden',transition:'transform 0.25s, box-shadow 0.25s',cursor:'default',animation:'inv-fadeup 0.4s cubic-bezier(0.16,1,0.3,1)'}}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 12px 40px rgba(0,0,0,0.09)';}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,0.05)';}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:'3px',background:s.accentTop,borderRadius:'20px 20px 0 0'}}/>
            <div style={{position:'absolute',top:-30,right:-30,width:100,height:100,borderRadius:'50%',background:s.bg,opacity:0.6,pointerEvents:'none'}}/>
            <div style={{width:42,height:42,borderRadius:12,background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:14,boxShadow:`0 4px 12px ${s.color}20`}}>
              <s.Icon size={21} color={s.color} weight="duotone"/>
            </div>
            <div style={{fontSize:s.big?16:30,fontWeight:800,color:C.text1,letterSpacing:s.big?'-0.3px':'-1px',lineHeight:1,marginBottom:6,fontFamily:s.big?'Outfit,sans-serif':'JetBrains Mono,monospace'}}>{s.value}</div>
            <div style={{fontSize:12.5,fontWeight:600,color:s.color}}>{s.label}{s.unit?` (${s.unit})`:''}</div>
          </div>
        ))}
      </div>

      {/* ══ FILTERS ══ */}
      <div style={{display:'flex',gap:10,marginBottom:18,alignItems:'center',flexWrap:'wrap'}}>
        <div style={{position:'relative',flex:1,maxWidth:380}}>
          <MagnifyingGlass size={15} color={C.text3} style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm tên, mã vật tư..."
            style={{...inSx(),paddingLeft:38}}
            onFocus={focusPink} onBlur={blurReset}/>
        </div>

        <div style={{position:'relative',display:'flex',alignItems:'center',gap:0}}>
          <Warehouse size={15} color={C.text3} style={{position:'absolute',left:12,pointerEvents:'none',zIndex:1}}/>
          <select value={warehouseFilter} onChange={e=>setWfil(e.target.value)}
            style={{...inSx(),width:'auto',minWidth:180,paddingLeft:34,appearance:'none',cursor:'pointer'}}
            onFocus={focusPink} onBlur={blurReset}>
            <option value="">Tất cả kho</option>
            {warehouses.map(w=><option key={w._id} value={w._id}>{w.name||w.warehouse_name}</option>)}
          </select>
        </div>

        <button onClick={()=>setLowOnly(v=>!v)}
          style={{display:'inline-flex',alignItems:'center',gap:7,padding:'9px 16px',borderRadius:11,border:`1.5px solid ${lowOnly?C.amber:C.border}`,background:lowOnly?C.amberL:C.surface,color:lowOnly?C.amber:C.text2,cursor:'pointer',fontFamily:'Outfit,sans-serif',fontSize:13,fontWeight:lowOnly?700:500,transition:'all 0.2s',boxShadow:lowOnly?'0 2px 8px rgba(217,119,6,0.18)':'none'}}>
          <Funnel size={14} weight={lowOnly?'fill':'regular'}/>
          Chỉ sắp hết / hết hàng
        </button>
      </div>

      {/* ══ TABLE ══ */}
      <div style={{background:C.surface,borderRadius:20,border:`1px solid ${C.border}`,boxShadow:'0 4px 20px rgba(0,0,0,0.05)',overflow:'hidden',animation:'inv-fadeup 0.4s cubic-bezier(0.16,1,0.3,1)'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13.5}}>
          <thead>
            <tr style={{background:'#f8fafc',borderBottom:`1.5px solid ${C.border2}`}}>
              {['#','VẬT TƯ','KHO','TỒN THỰC TẾ','TỒN KHẢ DỤNG','MỨC TỒN THẤP','GIÁ TRỊ','TRẠNG THÁI','THAO TÁC'].map((h,i)=>(
                <th key={h} style={{padding:'12px 14px',textAlign:[3,4,5,6].includes(i)?'right':'left',fontSize:10.5,fontWeight:700,color:C.text3,letterSpacing:'0.8px',whiteSpace:'nowrap'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(8)].map((_,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${C.border2}`}}>
                  {[...Array(9)].map((_,j)=><td key={j} style={{padding:'14px 14px'}}><Skel h={13} w={j===1?'65%':'50%'}/></td>)}
                </tr>
              ))
            ) : filtered.length===0 ? (
              <tr>
                <td colSpan={9} style={{padding:'60px 20px',textAlign:'center'}}>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
                    <div style={{width:64,height:64,background:C.pinkL,borderRadius:18,display:'flex',alignItems:'center',justifyContent:'center',border:`1.5px dashed rgba(190,24,93,0.3)`,color:C.pink,animation:'inv-float 3s ease-in-out infinite'}}>
                      <Package size={28}/>
                    </div>
                    <div style={{fontSize:14,fontWeight:600,color:C.text2}}>
                      {search||warehouseFilter||lowOnly?'Không tìm thấy vật tư phù hợp':'Chưa có dữ liệu tồn kho'}
                    </div>
                    {(search||warehouseFilter||lowOnly)&&<div style={{fontSize:12.5,color:C.text3}}>Thử thay đổi bộ lọc</div>}
                  </div>
                </td>
              </tr>
            ) : filtered.map((s,i)=>{
              const name  = s.material_id?.product_name||s.material_id?.material_name||'—';
              const code  = s.material_id?.product_code||s.material_id?.material_code||'';
              const wName = s.warehouse_id?.name||s.warehouse_id?.warehouse_name||'—';
              const qty   = s.quantity_on_hand||0;
              const avail = s.quantity_available??qty;
              const minSt = s.min_stock||0; // ✅ field đúng: min_stock nằm trực tiếp trên MaterialStock
              const value = getValue(s);    // ✅ qty × selling_price
              return (
                <tr key={s._id}
                  style={{borderBottom:`1px solid ${C.border2}`,transition:'background 0.15s',animation:`inv-fadeup 0.35s cubic-bezier(0.16,1,0.3,1) ${i*20}ms both`}}
                  onMouseEnter={e=>e.currentTarget.style.background='#fdfbfe'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{padding:'13px 14px',color:C.text3,fontSize:12,fontFamily:'JetBrains Mono,monospace',fontWeight:700}}>{i+1}</td>
                  <td style={{padding:'13px 14px'}}>
                    <div style={{fontWeight:700,fontSize:14,color:C.text1}}>{name}</div>
                    {code&&<div style={{fontSize:11.5,color:C.pink,fontFamily:'JetBrains Mono,monospace',marginTop:2,display:'inline-block',background:C.pinkL,padding:'1px 6px',borderRadius:5}}>{code}</div>}
                  </td>
                  <td style={{padding:'13px 14px'}}>
                    <span style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:13,color:C.text2,background:'#f8fafc',padding:'3px 9px',borderRadius:7,border:`1px solid ${C.border}`}}>
                      <Warehouse size={12} color={C.text3}/>{wName}
                    </span>
                  </td>
                  <td style={{padding:'13px 14px',minWidth:160}}>
                    <StockBar qty={qty} min={minSt} max={s.max_stock}/>
                  </td>
                  <td style={{padding:'13px 14px',textAlign:'right'}}>
                    <span style={{fontFamily:'JetBrains Mono,monospace',fontWeight:800,fontSize:14,color:C.text1}}>{fmt(avail)}</span>
                  </td>
                  <td style={{padding:'13px 14px',textAlign:'right',fontSize:13,color:minSt>0?C.amber:C.text3,fontFamily:'JetBrains Mono,monospace',fontWeight:minSt>0?700:400}}>
                    {minSt>0?fmt(minSt):'Chưa đặt'}
                  </td>
                  <td style={{padding:'13px 14px',textAlign:'right'}}>
                    <span style={{fontFamily:'JetBrains Mono,monospace',fontWeight:700,fontSize:13,color:value>0?C.sky:C.text3}}>{value>0?fmtCur(value):'—'}</span>
                  </td>
                  <td style={{padding:'13px 14px'}}><StockBadge qty={qty} min={minSt}/></td>
                  <td style={{padding:'13px 14px'}}>
                    <button onClick={()=>setAdjust({open:true,stock:s})}
                      style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:8,border:`1.5px solid ${C.border}`,background:C.surface,color:C.text2,cursor:'pointer',fontSize:12.5,fontWeight:600,whiteSpace:'nowrap',transition:'all 0.18s',fontFamily:'Outfit,sans-serif'}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=C.pink;e.currentTarget.style.color=C.pink;e.currentTarget.style.background=C.pinkL;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.text2;e.currentTarget.style.background=C.surface;}}>
                      <SlidersHorizontal size={13}/> Điều chỉnh
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Footer */}
        {!loading&&filtered.length>0&&(
          <div style={{padding:'13px 18px',borderTop:`1px solid ${C.border2}`,fontSize:13,color:C.text3,background:'#fafbfc',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span>Hiển thị <strong style={{color:C.text2,fontFamily:'JetBrains Mono,monospace'}}>{filtered.length}</strong> / <strong style={{fontFamily:'JetBrains Mono,monospace'}}>{stocks.length}</strong> mặt hàng</span>
            <span>Tổng giá trị: <strong style={{color:C.sky,fontFamily:'JetBrains Mono,monospace'}}>{fmtCur(filtered.reduce((s,x)=>s+getValue(x),0))}</strong></span>
          </div>
        )}
      </div>

      <AdjustModal open={adjustModal.open} stock={adjustModal.stock} warehouses={warehouses}
        onClose={()=>setAdjust({open:false,stock:null})}
        onSaved={()=>{setAdjust({open:false,stock:null});load();}}/>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
        @keyframes inv-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes inv-fadeup{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes inv-fadein{from{opacity:0}to{opacity:1}}
        @keyframes inv-scalein{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
        @keyframes inv-spin{to{transform:rotate(360deg)}}
        @keyframes inv-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
      `}</style>
    </div>
  );
}