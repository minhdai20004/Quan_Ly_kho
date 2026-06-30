// ================================================================
//  WMS — REPORTS  v3.1  (fixed: no dashboard API, real field names)
//  Paste to: src/views/Reports.jsx
// ================================================================
import { useState, useEffect, useCallback } from 'react';
import {
  ChartBar, ArrowSquareIn, ArrowSquareOut, Package,
  Warning, TrendUp, TrendDown, ArrowClockwise,
} from '@phosphor-icons/react';
import api from '../services/api';

/* ── Helpers ──────────────────────────────────────────────────── */
const fmt    = n => Number(n||0).toLocaleString('vi-VN');
const fmtCur = n => Number(n||0).toLocaleString('vi-VN',{style:'currency',currency:'VND'});
const fmtDate= s => s ? new Date(s).toLocaleDateString('vi-VN') : '—';

/* ── Shimmer ──────────────────────────────────────────────────── */
const Shimmer = ({w='100%',h=16,r=8,style={}}) => (
  <div style={{width:w,height:h,borderRadius:r,background:'linear-gradient(90deg,#f1f5f9 25%,#e8edf2 50%,#f1f5f9 75%)',backgroundSize:'400% 100%',animation:'shimmer 1.6s ease-in-out infinite',...style}}/>
);

/* ── KPI Card ─────────────────────────────────────────────────── */
const KPICard = ({icon,label,value,accent,loading,sub}) => (
  <div style={{background:'#fff',borderRadius:16,padding:'20px 22px',border:'1px solid #e2e8f0',boxShadow:'0 4px 24px -8px rgba(0,0,0,.06)',transition:'box-shadow .2s,transform .2s',cursor:'default'}}
    onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 8px 32px -8px rgba(0,0,0,.12)';e.currentTarget.style.transform='translateY(-2px)';}}
    onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 4px 24px -8px rgba(0,0,0,.06)';e.currentTarget.style.transform='translateY(0)';}}>
    <div style={{width:40,height:40,borderRadius:11,background:`${accent}18`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:14}}>
      {icon}
    </div>
    {loading
      ? <><Shimmer h={28} w="60%" r={6} style={{marginBottom:8}}/><Shimmer h={13} w="80%" r={5}/></>
      : <>
          <div style={{fontSize:26,fontWeight:800,color:'#1e293b',lineHeight:1,letterSpacing:'-1px'}}>{value}</div>
          <div style={{fontSize:13,color:'#64748b',marginTop:6,fontWeight:500}}>{label}</div>
          {sub&&<div style={{fontSize:11,color:'#94a3b8',marginTop:3}}>{sub}</div>}
        </>
    }
  </div>
);

/* ── Status Pill ──────────────────────────────────────────────── */
const StatusPill = ({status}) => {
  const map = {
    confirmed: {label:'Đã xác nhận', color:'#16a34a', bg:'#dcfce7'},
    draft:     {label:'Nháp',        color:'#d97706', bg:'#fef3c7'},
    cancelled: {label:'Đã huỷ',      color:'#dc2626', bg:'#fee2e2'},
    completed: {label:'Hoàn thành',  color:'#16a34a', bg:'#dcfce7'},
  };
  const m = map[status]||{label:status||'—',color:'#64748b',bg:'#f1f5f9'};
  return <span style={{fontSize:11,padding:'2px 9px',borderRadius:20,fontWeight:700,background:m.bg,color:m.color,whiteSpace:'nowrap'}}>{m.label}</span>;
};

/* ── Empty Slate ──────────────────────────────────────────────── */
const EmptySlate = ({text}) => (
  <div style={{textAlign:'center',padding:'40px 20px',color:'#cbd5e1'}}>
    <ChartBar size={36} style={{marginBottom:10,opacity:.4}}/>
    <div style={{fontSize:13,fontWeight:600}}>{text}</div>
  </div>
);

/* ── SVG Line Chart ───────────────────────────────────────────── */
const LineChart = ({data,keys,colors,labels}) => {
  const W=700,H=200,padX=56,padY=16;
  const innerW=W-padX*2, innerH=H-padY*2;
  if(!data?.length) return (
    <div style={{height:H,display:'flex',alignItems:'center',justifyContent:'center',color:'#cbd5e1',fontSize:13}}>
      Chưa có dữ liệu trong khoảng thời gian này
    </div>
  );
  const maxVal = Math.max(...data.flatMap(d=>keys.map(k=>d[k]||0)),1);
  const xStep  = innerW/Math.max(data.length-1,1);
  const yScale = v => padY+innerH-((v/maxVal)*innerH);
  const xAt    = i => padX+i*xStep;
  const makePath = key => data.map((d,i)=>`${i===0?'M':'L'} ${xAt(i).toFixed(1)} ${yScale(d[key]||0).toFixed(1)}`).join(' ');
  const makeArea = key => {
    const line=makePath(key);
    return `${line} L ${xAt(data.length-1).toFixed(1)} ${(padY+innerH).toFixed(1)} L ${padX} ${(padY+innerH).toFixed(1)} Z`;
  };
  const yTicks=[0,0.25,0.5,0.75,1].map(p=>({v:Math.round(maxVal*p),y:yScale(maxVal*p)}));
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H+28}`} style={{width:'100%',height:'auto'}}>
        <defs>
          {keys.map((k,ki)=>(
            <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors[ki]} stopOpacity=".18"/>
              <stop offset="100%" stopColor={colors[ki]} stopOpacity=".01"/>
            </linearGradient>
          ))}
        </defs>
        {yTicks.map(t=>(
          <g key={t.v}>
            <line x1={padX} x2={W-padX} y1={t.y} y2={t.y} stroke="#f1f5f9" strokeWidth={1}/>
            <text x={padX-8} y={t.y+4} fontSize={9} fill="#cbd5e1" textAnchor="end">{fmt(t.v)}</text>
          </g>
        ))}
        {keys.map((k,ki)=>(
          <g key={k}>
            <path d={makeArea(k)} fill={`url(#grad-${k})`}/>
            <path d={makePath(k)} fill="none" stroke={colors[ki]} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
          </g>
        ))}
        {keys.map((k,ki)=>data.map((d,i)=>(
          <circle key={`${k}-${i}`} cx={xAt(i)} cy={yScale(d[k]||0)} r={3.5} fill="#fff" stroke={colors[ki]} strokeWidth={2.5}/>
        )))}
        {data.map((d,i)=>(
          i%Math.ceil(data.length/8)===0||i===data.length-1
            ? <text key={i} x={xAt(i)} y={H+18} textAnchor="middle" fontSize={10} fill="#94a3b8">{d.date}</text>
            : null
        ))}
      </svg>
      <div style={{display:'flex',gap:20,marginTop:8}}>
        {keys.map((k,ki)=>(
          <div key={k} style={{display:'flex',alignItems:'center',gap:6}}>
            <div style={{width:20,height:3,borderRadius:2,background:colors[ki]}}/>
            <span style={{fontSize:12,color:'#64748b',fontWeight:600}}>{labels[ki]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── HBar ─────────────────────────────────────────────────────── */
const HBar = ({label,code,value,maxVal,color,rank}) => {
  const pct = maxVal>0?(value/maxVal)*100:0;
  return (
    <div style={{display:'grid',gridTemplateColumns:'24px 1fr auto',gap:12,alignItems:'center',marginBottom:14}}>
      <span style={{width:24,height:24,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,background:rank===1?'linear-gradient(135deg,#f59e0b,#d97706)':rank===2?'#94a3b8':rank===3?'#b45309':'#e2e8f0',color:rank<=3?'#fff':'#64748b'}}>{rank}</span>
      <div>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
          <span style={{fontSize:13,fontWeight:600,color:'#1e293b'}}>{label}</span>
          {code&&<span style={{fontSize:11,fontFamily:'JetBrains Mono,monospace',color:'#be185d'}}>{code}</span>}
        </div>
        <div style={{height:7,background:'#f1f5f9',borderRadius:10,overflow:'hidden'}}>
          <div style={{height:'100%',width:`${pct}%`,borderRadius:10,background:color,transition:'width .6s cubic-bezier(.16,1,.3,1)'}}/>
        </div>
      </div>
      <span style={{fontSize:14,fontWeight:800,color:'#1e293b',minWidth:50,textAlign:'right'}}>{fmt(value)}</span>
    </div>
  );
};

/* ── Tabs & Periods ───────────────────────────────────────────── */
const TABS = [
  {key:'overview', label:'Tổng quan',  icon:<ChartBar size={15} weight="fill"/>},
  {key:'inbound',  label:'Nhập kho',   icon:<ArrowSquareIn size={15} weight="fill"/>},
  {key:'outbound', label:'Xuất kho',   icon:<ArrowSquareOut size={15} weight="fill"/>},
  {key:'inventory',label:'Tồn kho',    icon:<Package size={15} weight="fill"/>},
];
const PERIODS = [{key:7,label:'7 ngày'},{key:14,label:'14 ngày'},{key:30,label:'30 ngày'}];

/* ── Main ─────────────────────────────────────────────────────── */
export default function Reports() {
  const [tab,setTab]     = useState('overview');
  const [days,setDays]   = useState(7);
  const [loading,setLoading] = useState(true);
  const [inbounds,setIn]     = useState([]);
  const [outbounds,setOut]   = useState([]);
  const [stocks,setStocks]   = useState([]);

  const load = useCallback(async()=>{
    setLoading(true);
    const [iRes,oRes,stRes] = await Promise.allSettled([
      api.get('/inbound-receipts?limit=500'),
      api.get('/outbound-issues?limit=500'),
      api.get('/material-stock'),
    ]);
    const unwrap = r => {
      if(r.status!=='fulfilled') return [];
      const v = r.value;
      const d = v?.data?.data ?? v?.data ?? v;
      return Array.isArray(d)?d:[];
    };
    setIn(unwrap(iRes));
    setOut(unwrap(oRes));
    setStocks(unwrap(stRes));
    setLoading(false);
  },[]);

  useEffect(()=>{load();},[load]);

  /* ── Computed ─────────────────────────────────────────────── */
  // Inbound: status 'confirmed' = done
  const inDone      = inbounds.filter(r=>r.status==='confirmed'||r.status==='completed');
  const inDraft     = inbounds.filter(r=>r.status==='draft').length;
  const inConfirmed = inDone.length;
  const inCancelled = inbounds.filter(r=>r.status==='cancelled').length;
  const totalInVal  = inDone.reduce((s,r)=>s+(r.total_cost||r.total_amount||0),0);
  const totalInQty  = inDone.reduce((s,r)=>s+(r.total_quantity||0),0);

  // Outbound
  const outDone      = outbounds.filter(r=>r.status==='confirmed'||r.status==='completed');
  const outDraft     = outbounds.filter(r=>r.status==='draft').length;
  const outConfirmed = outDone.length;
  const outCancelled = outbounds.filter(r=>r.status==='cancelled').length;
  const totalOutVal  = outDone.reduce((s,r)=>s+(r.total_cost||r.total_amount||0),0);
  const totalOutQty  = outDone.reduce((s,r)=>s+(r.total_quantity||0),0);

  // Stock: field is total_value (not total_cost)
  const validStocks  = stocks.filter(s=>s.material_id);
  const totalStockVal= stocks.reduce((s,st)=>s+(st.total_value||st.total_cost||0),0);
  const outOfStock   = stocks.filter(s=>s.out_of_stock||(s.quantity_on_hand||0)===0).length;
  const lowStockList = stocks
    .filter(s=>s.material_id&&(s.low_stock_alert||(s.quantity_on_hand<(s.min_stock||5)&&s.quantity_on_hand>0)))
    .sort((a,b)=>(a.quantity_on_hand||0)-(b.quantity_on_hand||0))
    .slice(0,10);
  const topMatList   = [...validStocks]
    .sort((a,b)=>(b.quantity_on_hand||0)-(a.quantity_on_hand||0))
    .slice(0,8);
  const maxTopQty = Math.max(...topMatList.map(s=>s.quantity_on_hand||0),1);
  const maxLowQty = Math.max(...lowStockList.map(s=>s.quantity_on_hand||0),1);

  // Chart: group inbound + outbound by date within `days` window
  const chartData = (() => {
    const now = new Date();
    const map = {};
    for(let i=days-1;i>=0;i--){
      const d = new Date(now); d.setDate(d.getDate()-i);
      const key = d.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'});
      map[key] = {date:key, nhap:0, xuat:0};
    }
    inDone.forEach(r=>{
      const d = r.receipt_date||r.createdAt;
      if(!d) return;
      const key = new Date(d).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'});
      if(map[key]) map[key].nhap += r.total_quantity||0;
    });
    outDone.forEach(r=>{
      const d = r.issue_date||r.createdAt;
      if(!d) return;
      const key = new Date(d).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'});
      if(map[key]) map[key].xuat += r.total_quantity||0;
    });
    return Object.values(map);
  })();

  const hasChartData = chartData.some(d=>d.nhap>0||d.xuat>0);

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div style={{minHeight:'100vh',background:'#f8fafc',fontFamily:'Outfit,sans-serif'}}>

      {/* Header */}
      <div style={{background:'#fff',borderBottom:'1px solid #e2e8f0'}}>
        <div style={{padding:'22px 32px'}}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:20}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                <div style={{width:10,height:10,borderRadius:'50%',background:'linear-gradient(135deg,#be185d,#9d174d)',boxShadow:'0 0 0 3px #fdf2f8',animation:'pulse-dot 2s infinite'}}/>
                <span style={{fontSize:11,fontWeight:700,color:'#be185d',textTransform:'uppercase',letterSpacing:'1.5px'}}>Live Report</span>
              </div>
              <h1 style={{margin:0,fontSize:28,fontWeight:800,color:'#0f172a',letterSpacing:'-1px'}}>Báo Cáo</h1>
              <p style={{margin:'4px 0 0',fontSize:13,color:'#94a3b8'}}>Phân tích dữ liệu kho hàng theo thời gian thực</p>
            </div>
            <div style={{display:'flex',gap:8}}>
              <div style={{display:'flex',background:'#f1f5f9',borderRadius:10,padding:3,gap:2}}>
                {PERIODS.map(p=>(
                  <button key={p.key} onClick={()=>setDays(p.key)}
                    style={{padding:'6px 14px',borderRadius:8,border:'none',cursor:'pointer',fontSize:13,fontWeight:600,background:days===p.key?'#fff':'transparent',color:days===p.key?'#be185d':'#64748b',boxShadow:days===p.key?'0 1px 4px rgba(0,0,0,.08)':'none',transition:'all .2s'}}>
                    {p.label}
                  </button>
                ))}
              </div>
              <button onClick={load}
                style={{width:38,height:38,borderRadius:9,border:'1.5px solid #e2e8f0',background:'#fff',color:'#64748b',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s'}}
                onMouseEnter={e=>e.currentTarget.style.borderColor='#be185d'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='#e2e8f0'}>
                <ArrowClockwise size={16} style={{animation:loading?'spin 1s linear infinite':'none'}}/>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{display:'flex',gap:4}}>
            {TABS.map(t=>(
              <button key={t.key} onClick={()=>setTab(t.key)}
                style={{display:'flex',alignItems:'center',gap:7,padding:'8px 16px',borderRadius:10,border:'none',cursor:'pointer',fontSize:13,fontWeight:600,background:tab===t.key?'#fdf2f8':'transparent',color:tab===t.key?'#be185d':'#64748b',borderBottom:tab===t.key?'2px solid #be185d':'2px solid transparent',transition:'all .2s'}}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{padding:'28px 32px'}}>

        {/* ── OVERVIEW ── */}
        {tab==='overview'&&(
          <div style={{animation:'fadeUp .35s ease'}}>
            {/* KPI */}
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:16,marginBottom:24}}>
              <KPICard loading={loading}
                icon={<ChartBar size={20} color="#be185d" weight="fill"/>}
                label="Giá trị tồn kho hiện tại"
                value={fmtCur(totalStockVal)} accent="#be185d"
                sub={`${fmt(validStocks.length)} mặt hàng đang theo dõi`}/>
              <KPICard loading={loading}
                icon={<ArrowSquareIn size={20} color="#16a34a" weight="fill"/>}
                label="Giá trị nhập kho"
                value={fmtCur(totalInVal)} accent="#16a34a"
                sub={`${inConfirmed} phiếu hoàn thành`}/>
              <KPICard loading={loading}
                icon={<ArrowSquareOut size={20} color="#0ea5e9" weight="fill"/>}
                label="Giá trị xuất kho"
                value={fmtCur(totalOutVal)} accent="#0ea5e9"
                sub={`${outConfirmed} phiếu hoàn thành`}/>
              <KPICard loading={loading}
                icon={<Warning size={20} color="#f59e0b" weight="fill"/>}
                label="Mặt hàng cảnh báo"
                value={fmt(lowStockList.length)}
                accent="#f59e0b"
                sub={`${fmt(outOfStock)} hết hàng hoàn toàn`}/>
            </div>

            {/* Chart + Top */}
            <div style={{display:'grid',gridTemplateColumns:'3fr 2fr',gap:20,marginBottom:20}}>
              <div style={{background:'#fff',borderRadius:20,padding:'22px 24px',border:'1px solid #e2e8f0',boxShadow:'0 4px 24px -8px rgba(0,0,0,.06)'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
                  <div>
                    <div style={{fontSize:15,fontWeight:800,color:'#0f172a'}}>Biến động nhập / xuất</div>
                    <div style={{fontSize:12,color:'#94a3b8',marginTop:2}}>{days} ngày gần nhất</div>
                  </div>
                  <TrendUp size={18} color="#be185d" weight="fill"/>
                </div>
                {loading
                  ? <Shimmer h={200} r={12}/>
                  : <LineChart data={hasChartData?chartData:[]} keys={['nhap','xuat']} colors={['#be185d','#0ea5e9']} labels={['Nhập kho','Xuất kho']}/>
                }
              </div>

              <div style={{background:'#fff',borderRadius:20,padding:'22px 24px',border:'1px solid #e2e8f0',boxShadow:'0 4px 24px -8px rgba(0,0,0,.06)'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
                  <div>
                    <div style={{fontSize:15,fontWeight:800,color:'#0f172a'}}>Top vật tư tồn nhiều</div>
                    <div style={{fontSize:12,color:'#94a3b8',marginTop:2}}>Theo số lượng hiện tại</div>
                  </div>
                  <Package size={18} color="#0ea5e9" weight="fill"/>
                </div>
                {loading
                  ? [...Array(5)].map((_,i)=><Shimmer key={i} h={32} r={8} style={{marginBottom:12}}/>)
                  : topMatList.length===0
                    ? <EmptySlate text="Chưa có dữ liệu tồn kho"/>
                    : topMatList.map((s,i)=>(
                        <HBar key={s._id} rank={i+1}
                          label={s.material_id?.product_name||s.material_id?.material_name||'—'}
                          code={s.material_id?.product_code||s.material_id?.material_code}
                          value={s.quantity_on_hand||0} maxVal={maxTopQty}
                          color="linear-gradient(90deg,#0ea5e9,#38bdf8)"/>
                      ))
                }
              </div>
            </div>

            {/* Low stock */}
            <div style={{background:'#fff',borderRadius:20,padding:'22px 24px',border:'1px solid #e2e8f0',boxShadow:'0 4px 24px -8px rgba(0,0,0,.06)'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
                <div>
                  <div style={{fontSize:15,fontWeight:800,color:'#0f172a'}}>Sắp hết hàng</div>
                  <div style={{fontSize:12,color:'#94a3b8',marginTop:2}}>Xếp theo số lượng tồn tăng dần</div>
                </div>
                {!loading&&lowStockList.length>0&&(
                  <span style={{fontSize:12,padding:'3px 10px',borderRadius:20,background:'#fef3c7',color:'#d97706',fontWeight:700}}>
                    {lowStockList.length} mặt hàng
                  </span>
                )}
              </div>
              {loading
                ? <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>{[...Array(6)].map((_,i)=><Shimmer key={i} h={36} r={8}/>)}</div>
                : lowStockList.length===0
                  ? <EmptySlate text="Tất cả vật tư đều còn đủ hàng ✓"/>
                  : <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 32px'}}>
                      {lowStockList.map((s,i)=>(
                        <HBar key={s._id} rank={i+1}
                          label={s.material_id?.product_name||s.material_id?.material_name||'—'}
                          code={s.material_id?.product_code||s.material_id?.material_code}
                          value={s.quantity_on_hand||0} maxVal={maxLowQty}
                          color="linear-gradient(90deg,#f59e0b,#fbbf24)"/>
                      ))}
                    </div>
              }
            </div>
          </div>
        )}

        {/* ── INBOUND TAB ── */}
        {tab==='inbound'&&(
          <div style={{animation:'fadeUp .35s ease'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:24}}>
              <KPICard loading={loading} icon={<ArrowSquareIn size={20} color="#16a34a" weight="fill"/>}
                label="Tổng phiếu nhập" value={fmt(inbounds.length)} accent="#16a34a" sub="Tất cả trạng thái"/>
              <KPICard loading={loading} icon={<TrendUp size={20} color="#be185d" weight="fill"/>}
                label="Giá trị đã nhập" value={fmtCur(totalInVal)} accent="#be185d" sub={`${fmt(totalInQty)} đơn vị`}/>
              <KPICard loading={loading} icon={<ChartBar size={20} color="#8b5cf6" weight="fill"/>}
                label="Tỉ lệ hoàn thành"
                value={inbounds.length?`${Math.round(inConfirmed/inbounds.length*100)}%`:'—'} accent="#8b5cf6"
                sub={`${inConfirmed} xác nhận · ${inDraft} nháp · ${inCancelled} huỷ`}/>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'3fr 2fr',gap:20}}>
              <div style={{background:'#fff',borderRadius:20,padding:'22px 24px',border:'1px solid #e2e8f0',boxShadow:'0 4px 24px -8px rgba(0,0,0,.06)'}}>
                <div style={{fontSize:15,fontWeight:800,color:'#0f172a',marginBottom:20}}>Danh sách phiếu nhập gần đây</div>
                {loading
                  ? [...Array(6)].map((_,i)=><Shimmer key={i} h={44} r={8} style={{marginBottom:10}}/>)
                  : inbounds.length===0
                    ? <EmptySlate text="Chưa có phiếu nhập nào"/>
                    : <table style={{width:'100%',borderCollapse:'collapse'}}>
                        <thead>
                          <tr style={{borderBottom:'2px solid #f1f5f9'}}>
                            {['Mã phiếu','Đối tác','Ngày nhập','Giá trị','Trạng thái'].map(h=>(
                              <th key={h} style={{padding:'8px 12px',fontSize:11,fontWeight:700,color:'#94a3b8',textAlign:'left',textTransform:'uppercase',letterSpacing:'.5px'}}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {inbounds.slice(0,15).map(r=>(
                            <tr key={r._id} style={{borderBottom:'1px solid #f8fafc'}}
                              onMouseEnter={e=>e.currentTarget.style.background='#fafbfc'}
                              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                              <td style={{padding:'11px 12px'}}>
                                <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,fontWeight:700,color:'#be185d',background:'#fdf2f8',padding:'2px 8px',borderRadius:5}}>{r.receipt_code}</span>
                              </td>
                              <td style={{padding:'11px 12px',fontSize:13,color:'#374151'}}>{r.partner_id?.name||r.partner_id?.object_name||'—'}</td>
                              <td style={{padding:'11px 12px',fontSize:12,color:'#94a3b8'}}>{fmtDate(r.receipt_date||r.createdAt)}</td>
                              <td style={{padding:'11px 12px',fontSize:13,fontWeight:700,color:'#16a34a'}}>{fmtCur(r.total_cost||r.total_amount)}</td>
                              <td style={{padding:'11px 12px'}}><StatusPill status={r.status}/></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                }
              </div>

              <div style={{background:'#fff',borderRadius:20,padding:'22px 24px',border:'1px solid #e2e8f0',boxShadow:'0 4px 24px -8px rgba(0,0,0,.06)'}}>
                <div style={{fontSize:15,fontWeight:800,color:'#0f172a',marginBottom:20}}>Phân bố trạng thái</div>
                {loading
                  ? [...Array(3)].map((_,i)=><Shimmer key={i} h={56} r={10} style={{marginBottom:12}}/>)
                  : [{label:'Đã xác nhận',count:inConfirmed,color:'#16a34a',bg:'#dcfce7'},
                     {label:'Nháp',        count:inDraft,     color:'#d97706',bg:'#fef3c7'},
                     {label:'Đã huỷ',      count:inCancelled, color:'#dc2626',bg:'#fee2e2'},
                    ].map(s=>(
                      <div key={s.label} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',background:s.bg,borderRadius:12,marginBottom:10}}>
                        <span style={{fontSize:14,fontWeight:600,color:s.color}}>{s.label}</span>
                        <span style={{fontSize:24,fontWeight:800,color:s.color}}>{s.count}</span>
                      </div>
                    ))
                }
              </div>
            </div>
          </div>
        )}

        {/* ── OUTBOUND TAB ── */}
        {tab==='outbound'&&(
          <div style={{animation:'fadeUp .35s ease'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:24}}>
              <KPICard loading={loading} icon={<ArrowSquareOut size={20} color="#0ea5e9" weight="fill"/>}
                label="Tổng phiếu xuất" value={fmt(outbounds.length)} accent="#0ea5e9" sub="Tất cả trạng thái"/>
              <KPICard loading={loading} icon={<TrendDown size={20} color="#be185d" weight="fill"/>}
                label="Giá trị đã xuất" value={fmtCur(totalOutVal)} accent="#be185d" sub={`${fmt(totalOutQty)} đơn vị`}/>
              <KPICard loading={loading} icon={<ChartBar size={20} color="#8b5cf6" weight="fill"/>}
                label="Tỉ lệ hoàn thành"
                value={outbounds.length?`${Math.round(outConfirmed/outbounds.length*100)}%`:'—'} accent="#8b5cf6"
                sub={`${outConfirmed} xác nhận · ${outDraft} nháp · ${outCancelled} huỷ`}/>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'3fr 2fr',gap:20}}>
              <div style={{background:'#fff',borderRadius:20,padding:'22px 24px',border:'1px solid #e2e8f0',boxShadow:'0 4px 24px -8px rgba(0,0,0,.06)'}}>
                <div style={{fontSize:15,fontWeight:800,color:'#0f172a',marginBottom:20}}>Danh sách phiếu xuất gần đây</div>
                {loading
                  ? [...Array(6)].map((_,i)=><Shimmer key={i} h={44} r={8} style={{marginBottom:10}}/>)
                  : outbounds.length===0
                    ? <EmptySlate text="Chưa có phiếu xuất nào"/>
                    : <table style={{width:'100%',borderCollapse:'collapse'}}>
                        <thead>
                          <tr style={{borderBottom:'2px solid #f1f5f9'}}>
                            {['Mã phiếu','Đối tác','Ngày xuất','Giá trị','Trạng thái'].map(h=>(
                              <th key={h} style={{padding:'8px 12px',fontSize:11,fontWeight:700,color:'#94a3b8',textAlign:'left',textTransform:'uppercase',letterSpacing:'.5px'}}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {outbounds.slice(0,15).map(r=>(
                            <tr key={r._id} style={{borderBottom:'1px solid #f8fafc'}}
                              onMouseEnter={e=>e.currentTarget.style.background='#fafbfc'}
                              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                              <td style={{padding:'11px 12px'}}>
                                <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,fontWeight:700,color:'#0ea5e9',background:'#e0f2fe',padding:'2px 8px',borderRadius:5}}>{r.issue_code}</span>
                              </td>
                              <td style={{padding:'11px 12px',fontSize:13,color:'#374151'}}>{r.partner_id?.name||r.partner_id?.object_name||r.customer_id?.name||'—'}</td>
                              <td style={{padding:'11px 12px',fontSize:12,color:'#94a3b8'}}>{fmtDate(r.issue_date||r.createdAt)}</td>
                              <td style={{padding:'11px 12px',fontSize:13,fontWeight:700,color:'#0ea5e9'}}>{fmtCur(r.total_cost||r.total_amount)}</td>
                              <td style={{padding:'11px 12px'}}><StatusPill status={r.status}/></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                }
              </div>

              <div style={{background:'#fff',borderRadius:20,padding:'22px 24px',border:'1px solid #e2e8f0',boxShadow:'0 4px 24px -8px rgba(0,0,0,.06)'}}>
                <div style={{fontSize:15,fontWeight:800,color:'#0f172a',marginBottom:20}}>Phân bố trạng thái</div>
                {loading
                  ? [...Array(3)].map((_,i)=><Shimmer key={i} h={56} r={10} style={{marginBottom:12}}/>)
                  : [{label:'Đã xác nhận',count:outConfirmed,color:'#16a34a',bg:'#dcfce7'},
                     {label:'Nháp',        count:outDraft,    color:'#d97706',bg:'#fef3c7'},
                     {label:'Đã huỷ',      count:outCancelled,color:'#dc2626',bg:'#fee2e2'},
                    ].map(s=>(
                      <div key={s.label} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',background:s.bg,borderRadius:12,marginBottom:10}}>
                        <span style={{fontSize:14,fontWeight:600,color:s.color}}>{s.label}</span>
                        <span style={{fontSize:24,fontWeight:800,color:s.color}}>{s.count}</span>
                      </div>
                    ))
                }
              </div>
            </div>
          </div>
        )}

        {/* ── INVENTORY TAB ── */}
        {tab==='inventory'&&(
          <div style={{animation:'fadeUp .35s ease'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:16,marginBottom:24}}>
              <KPICard loading={loading} icon={<Package size={20} color="#be185d" weight="fill"/>}
                label="Tổng mặt hàng" value={fmt(stocks.length)} accent="#be185d"/>
              <KPICard loading={loading} icon={<ChartBar size={20} color="#0ea5e9" weight="fill"/>}
                label="Giá trị tồn kho" value={fmtCur(totalStockVal)} accent="#0ea5e9"/>
              <KPICard loading={loading} icon={<Warning size={20} color="#f59e0b" weight="fill"/>}
                label="Sắp hết hàng" value={fmt(lowStockList.length)} accent="#f59e0b"/>
              <KPICard loading={loading} icon={<Warning size={20} color="#dc2626" weight="fill"/>}
                label="Hết hàng" value={fmt(outOfStock)} accent="#dc2626"/>
            </div>

            <div style={{background:'#fff',borderRadius:20,padding:'22px 24px',border:'1px solid #e2e8f0',boxShadow:'0 4px 24px -8px rgba(0,0,0,.06)'}}>
              <div style={{fontSize:15,fontWeight:800,color:'#0f172a',marginBottom:20}}>Chi tiết tồn kho</div>
              {loading
                ? [...Array(8)].map((_,i)=><Shimmer key={i} h={40} r={8} style={{marginBottom:10}}/>)
                : stocks.length===0
                  ? <EmptySlate text="Chưa có dữ liệu tồn kho"/>
                  : <table style={{width:'100%',borderCollapse:'collapse'}}>
                      <thead>
                        <tr style={{borderBottom:'2px solid #f1f5f9'}}>
                          {['#','Vật tư','Kho','Tồn thực','Khả dụng','Đơn giá','Giá trị','Trạng thái'].map((h,i)=>(
                            <th key={h} style={{padding:'9px 12px',fontSize:11,fontWeight:700,color:'#94a3b8',textAlign:i>=3?'right':'left',textTransform:'uppercase',letterSpacing:'.5px'}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {stocks.map((s,i)=>{
                          const qty   = s.quantity_on_hand||0;
                          const avail = s.quantity_available??qty;
                          const val   = s.total_value||s.total_cost||0;
                          const min   = s.min_stock||0;
                          const oos   = s.out_of_stock||qty===0;
                          const low   = !oos&&s.low_stock_alert;
                          const status= oos  ? {label:'Hết hàng',color:'#dc2626',bg:'#fee2e2'}
                                      : low  ? {label:'Sắp hết', color:'#d97706',bg:'#fef3c7'}
                                      : {label:'Đủ hàng', color:'#16a34a',bg:'#dcfce7'};
                          return (
                            <tr key={s._id} style={{borderBottom:'1px solid #f8fafc'}}
                              onMouseEnter={e=>e.currentTarget.style.background='#fafbfc'}
                              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                              <td style={{padding:'11px 12px',color:'#94a3b8',fontSize:12}}>{i+1}</td>
                              <td style={{padding:'11px 12px'}}>
                                <div style={{fontSize:13,fontWeight:600,color:'#1e293b'}}>
                                  {s.material_id?.product_name||s.material_id?.material_name||<span style={{color:'#cbd5e1',fontStyle:'italic'}}>Không xác định</span>}
                                </div>
                                {s.material_id&&<div style={{fontSize:11,fontFamily:'JetBrains Mono,monospace',color:'#be185d',marginTop:2}}>{s.material_id?.product_code||s.material_id?.material_code||''}</div>}
                              </td>
                              <td style={{padding:'11px 12px',fontSize:13,color:'#64748b'}}>{s.warehouse_id?.name||s.warehouse_id?.warehouse_name||'—'}</td>
                              <td style={{padding:'11px 12px',textAlign:'right',fontWeight:700,fontSize:14,color:'#1e293b'}}>{fmt(qty)}</td>
                              <td style={{padding:'11px 12px',textAlign:'right',fontSize:13,color:'#64748b'}}>{fmt(avail)}</td>
                              <td style={{padding:'11px 12px',textAlign:'right',fontSize:13,color:'#64748b'}}>{s.unit_cost>0?fmtCur(s.unit_cost):'—'}</td>
                              <td style={{padding:'11px 12px',textAlign:'right',fontSize:13,fontWeight:600,color:'#0ea5e9'}}>{val>0?fmtCur(val):'—'}</td>
                              <td style={{padding:'11px 12px',textAlign:'right'}}>
                                <span style={{fontSize:11,padding:'3px 9px',borderRadius:20,fontWeight:700,background:status.bg,color:status.color}}>{status.label}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
              }
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer   { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.3)} }
      `}</style>
    </div>
  );
}