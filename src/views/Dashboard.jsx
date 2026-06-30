// ================================================================
//  WMS — LUXURY DASHBOARD  v3.2  (fixed field names)
//  Paste to: src/views/Dashboard.jsx
// ================================================================
import { useState, useEffect, useCallback } from 'react';
import {
  Stack, Package, Handshake, Warning,
  ArrowSquareIn, ArrowSquareOut, ArrowClockwise,
  CheckCircle, Clock, XCircle, ChartBar, ChartLine,
} from '@phosphor-icons/react';
import api from '../services/api';
import './Dashboard.css';

/* ─── Helpers ────────────────────────────────────────────────── */
const fmt    = (n) => Number(n || 0).toLocaleString('vi-VN');
const fmtDay = (d) => new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
}).format(d);

// ✅ Helper lấy tên vật tư — handle mọi field name
const getMaterialName = (item) =>
  item?.product_name || item?.material_name || item?.name || '—';

// ✅ Helper lấy mã vật tư
const getMaterialCode = (item) =>
  item?.product_code || item?.material_code || item?.code || '';

// ✅ Helper lấy tên partner
const getPartnerName = (p) =>
  p?.name || p?.object_name || p?.partner_name || '—';

// ✅ Helper lấy tên kho
const getWarehouseName = (w) =>
  w?.name || w?.warehouse_name || '—';

/* ─── useCountUp ─────────────────────────────────────────────── */
function useCountUp(target, active) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) { setVal(0); return; }
    const n = Number(target) || 0;
    if (n === 0) { setVal(0); return; }
    let raf, start = null;
    const run = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1100, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(e * n));
      if (p < 1) raf = requestAnimationFrame(run);
    };
    raf = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf);
  }, [target, active]);
  return val;
}

/* ─── KPI Card ───────────────────────────────────────────────── */
function KPICard({ icon: Icon, iconColor, iconBg, label, value, sub, accentClass, delay, loaded }) {
  const count = useCountUp(value, loaded);
  return (
    <div className={`kpi-card ${accentClass}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="kpi-bg-orb"/>
      <div className="kpi-icon-box">
        <Icon size={22} weight="duotone" color={iconColor}/>
      </div>
      {!loaded ? (
        <><div className="kpi-skel-value"/><div className="kpi-skel-label"/><div className="kpi-skel-sub"/></>
      ) : (
        <>
          <div className="kpi-value">{count.toLocaleString('vi-VN')}</div>
          <div className="kpi-label">{label}</div>
          <div className="kpi-sub-row">{sub}</div>
        </>
      )}
    </div>
  );
}

/* ─── SVG Area Chart ─────────────────────────────────────────── */
function AreaChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="dash-empty" style={{ minHeight: 160 }}>
        <div className="dash-empty-icon"><ChartLine size={24}/></div>
        <span className="dash-empty-text">Chưa có dữ liệu trong khoảng này</span>
      </div>
    );
  }
  const W = 520, H = 170, PX = 8, PY = 10;
  const maxVal = Math.max(...data.flatMap(d => [d.nhap || 0, d.xuat || 0]), 1);
  const xi = (i) => PX + (i / (Math.max(data.length - 1, 1))) * (W - PX * 2);
  const yn = (v) => H - PY - ((v || 0) / maxVal) * (H - PY * 2);
  const pathN = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xi(i).toFixed(1)},${yn(d.nhap).toFixed(1)}`).join(' ');
  const pathX = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xi(i).toFixed(1)},${yn(d.xuat).toFixed(1)}`).join(' ');
  const floor = `L${xi(data.length-1)},${H-PY} L${xi(0)},${H-PY} Z`;
  const grids = [0.25, 0.5, 0.75].map(t => H - PY - t * (H - PY * 2));

  return (
    <div className="chart-svg-area">
      <svg className="chart-svg" viewBox={`0 0 ${W} ${H + 16}`}>
        <defs>
          <linearGradient id="gN" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%"   stopColor="#be185d" stopOpacity="0.20"/>
            <stop offset="100%" stopColor="#be185d" stopOpacity="0.01"/>
          </linearGradient>
          <linearGradient id="gX" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%"   stopColor="#0284c7" stopOpacity="0.16"/>
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.01"/>
          </linearGradient>
        </defs>
        {grids.map((y, i) => (
          <line key={i} x1={PX} x2={W-PX} y1={y} y2={y} stroke="#f1f5f9" strokeWidth="1"/>
        ))}
        <line x1={PX} x2={W-PX} y1={H-PY} y2={H-PY} stroke="#e2e8f0" strokeWidth="1"/>
        <path d={`${pathN} ${floor}`} fill="url(#gN)"/>
        <path d={`${pathX} ${floor}`} fill="url(#gX)"/>
        <path d={pathN} className="chart-line-nhap"/>
        <path d={pathX} className="chart-line-xuat"/>
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={xi(i)} cy={yn(d.nhap)} r="3.5" fill="white" stroke="#be185d" strokeWidth="2"/>
            <circle cx={xi(i)} cy={yn(d.xuat)} r="3.5" fill="white" stroke="#0284c7" strokeWidth="2"/>
          </g>
        ))}
        {data.map((d, i) => (
          (data.length <= 8 || i % Math.ceil(data.length / 7) === 0 || i === data.length - 1) && (
            <text key={i} x={xi(i)} y={H + 13} textAnchor="middle"
              fill="#94a3b8" fontSize="9" fontFamily="Outfit,sans-serif">{d.date}</text>
          )
        ))}
      </svg>
    </div>
  );
}

/* ─── Top Stock Row ──────────────────────────────────────────── */
const RANK_STYLES = [
  { bg: '#fef3c7', color: '#d97706' },
  { bg: '#f1f5f9', color: '#64748b' },
  { bg: '#fff7ed', color: '#c2410c' },
];
const BAR_GRADIENTS = [
  'linear-gradient(90deg,#be185d,#f472b6)',
  'linear-gradient(90deg,#0284c7,#38bdf8)',
  'linear-gradient(90deg,#059669,#34d399)',
  'linear-gradient(90deg,#d97706,#fbbf24)',
  'linear-gradient(90deg,#7c3aed,#a78bfa)',
];

function TopRow({ item, maxQty, index }) {
  const pct  = maxQty > 0 ? (item.totalQuantity / maxQty) * 100 : 0;
  const rs   = RANK_STYLES[index] || { bg: '#f8fafc', color: '#94a3b8' };
  // ✅ Fixed: use helper to get name
  const name = getMaterialName(item);
  const code = getMaterialCode(item);
  return (
    <div className="stock-bar-row" style={{ animationDelay: `${index * 70}ms` }}>
      <div className="stock-bar-label-row">
        <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
          <span style={{ width:22, height:22, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, background:rs.bg, color:rs.color, flexShrink:0 }}>
            {index + 1}
          </span>
          <div style={{ minWidth:0 }}>
            <span className="stock-bar-name" title={name}>{name}</span>
            {code && <div style={{ fontSize:10, color:'#be185d', fontFamily:'JetBrains Mono,monospace' }}>{code}</div>}
          </div>
        </div>
        <span className="stock-bar-qty">{fmt(item.totalQuantity)}</span>
      </div>
      <div className="stock-bar-track">
        <div className="stock-bar-fill" style={{ background:BAR_GRADIENTS[index % BAR_GRADIENTS.length], '--bar-w':`${pct}%`, width:`${pct}%`, animationDelay:`${index * 70 + 200}ms` }}/>
      </div>
    </div>
  );
}

/* ─── Low Stock Row ──────────────────────────────────────────── */
function LowRow({ item, maxQty, index }) {
  const qty    = item.quantity || item.quantity_on_hand || 0;
  const pct    = maxQty > 0 ? Math.min((qty / maxQty) * 100, 100) : 0;
  const isCrit = qty === 0;
  // ✅ Fixed: use helper to get name & code
  const name   = getMaterialName(item);
  const code   = getMaterialCode(item);
  return (
    <div className={`alert-row ${isCrit ? 'crit' : 'warn'}`} style={{ animationDelay:`${index * 65}ms` }}>
      <div className="alert-icon-circle">
        {isCrit
          ? <XCircle size={15} weight="duotone"/>
          : <Warning size={15} weight="duotone"/>
        }
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
          <span className="alert-item-name" title={name}>
            {name}
            {code && (
              <span style={{ marginLeft:6, fontSize:10, fontFamily:'JetBrains Mono,monospace', color:'#be185d', background:'#fdf2f8', padding:'1px 5px', borderRadius:4 }}>
                {code}
              </span>
            )}
          </span>
          <span className="alert-item-qty">{fmt(qty)}</span>
        </div>
        <div style={{ height:4, background:'#f1f5f9', borderRadius:4, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${pct}%`, borderRadius:4, background:isCrit?'#ef4444':'#f59e0b', transition:'width .7s cubic-bezier(.16,1,.3,1)' }}/>
        </div>
      </div>
    </div>
  );
}

/* ─── Transaction Row ────────────────────────────────────────── */
// ✅ Fixed: added 'confirmed' status (không chỉ 'completed')
const STATUS_MAP = {
  confirmed: { label: 'Đã xác nhận', cls: 'ok',  Icon: CheckCircle },
  completed: { label: 'Hoàn thành',  cls: 'ok',  Icon: CheckCircle },
  draft:     { label: 'Nháp',        cls: 'pen', Icon: Clock       },
  cancelled: { label: 'Đã huỷ',      cls: 'no',  Icon: XCircle     },
};

function TxRow({ tx, index }) {
  const isIn = tx.transaction_type === 'inbound' || !!tx.receipt_code;
  const code = tx.receipt_code || tx.issue_code || '—';
  // ✅ Fixed: partner name field
  const partner = getPartnerName(tx.partner_id);
  // ✅ Fixed: warehouse name field
  const wh    = getWarehouseName(tx.warehouse_id);
  const date  = tx.created_at ? new Date(tx.created_at).toLocaleDateString('vi-VN') : '—';
  const s     = STATUS_MAP[tx.status] || STATUS_MAP.draft;
  return (
    <div className="tx-row" style={{ animationDelay:`${index * 50}ms` }}>
      <div style={{ width:34, height:34, borderRadius:10, background:isIn?'#dcfce7':'#fdf2f8', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        {isIn
          ? <ArrowSquareIn  size={16} color="#16a34a" weight="fill"/>
          : <ArrowSquareOut size={16} color="#be185d" weight="fill"/>
        }
      </div>
      <div className="tx-meta">
        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:2 }}>
          <span className="tx-code-text" style={{ color:isIn?'#16a34a':'#be185d' }}>{code}</span>
          <span className={`tx-badge ${s.cls}`} style={{ display:'inline-flex', alignItems:'center', gap:3 }}>
            <s.Icon size={11} weight="fill"/> {s.label}
          </span>
        </div>
        <span className="tx-partner-text">{partner} · {wh}</span>
      </div>
      <span style={{ fontSize:11.5, color:'#cbd5e1', whiteSpace:'nowrap', flexShrink:0 }}>{date}</span>
    </div>
  );
}

/* ─── Shimmer ────────────────────────────────────────────────── */
const Skel = ({ h=14, w='100%', r=7, mb=10 }) => (
  <div style={{ height:h, width:w, borderRadius:r, marginBottom:mb, background:'linear-gradient(90deg,#f1f5f9 25%,#e8edf3 50%,#f1f5f9 75%)', backgroundSize:'200% 100%', animation:'shimmerSwipe 1.5s ease-in-out infinite' }}/>
);

/* ─── Main Dashboard ─────────────────────────────────────────── */
export default function Dashboard() {
  const [stats,    setStats]    = useState(null);
  const [chart,    setChart]    = useState([]);
  const [low,      setLow]      = useState([]);
  const [top,      setTop]      = useState([]);
  const [recent,   setRecent]   = useState([]);
  const [days,     setDays]     = useState(7);
  const [loading,  setLoading]  = useState(true);
  const [spinning, setSpinning] = useState(false);

  // ✅ Unwrap helper — handle { data: { data: [...] } }, { data: [...] }, [...]
  const unwrap = (v) => v?.data?.data ?? v?.data ?? v ?? null;

  const load = useCallback(async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      api.get('/dashboard/stats'),
      api.get(`/dashboard/chart?days=${days}`),
      api.get('/dashboard/low-stock'),
      api.get('/dashboard/top-products'),
      api.get('/dashboard/recent-transactions'),
    ]);
    if (results[0].status==='fulfilled') setStats(unwrap(results[0].value));
    if (results[1].status==='fulfilled') { const d=unwrap(results[1].value); setChart(Array.isArray(d)?d:[]); }
    if (results[2].status==='fulfilled') { const d=unwrap(results[2].value); setLow(Array.isArray(d)?d:[]); }
    if (results[3].status==='fulfilled') { const d=unwrap(results[3].value); setTop(Array.isArray(d)?d:[]); }
    if (results[4].status==='fulfilled') { const d=unwrap(results[4].value); setRecent(Array.isArray(d)?d:[]); }
    setLoading(false);
    setSpinning(false);
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = () => { setSpinning(true); load(); };

  const loaded = !loading;
  const maxLow = Math.max(...low.map(i => i.quantity || i.quantity_on_hand || 0), 1);
  const maxTop = Math.max(...top.map(i => i.totalQuantity || 0), 1);
  const now    = new Date();
  const greet  = now.getHours() < 12 ? 'Chào buổi sáng' : now.getHours() < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  const kpis = [
    { icon:Stack,     iconColor:'#be185d', accentClass:'pink',   label:'Tổng tồn kho',  value:stats?.totalStock     ?? 0, sub:<span style={{color:'#94a3b8'}}>{fmt(stats?.totalMaterials)} vật tư · {fmt(stats?.totalGroups)} nhóm</span>,    delay:0   },
    { icon:Package,   iconColor:'#0284c7', accentClass:'sky',    label:'Vật tư',         value:stats?.totalMaterials ?? 0, sub:<span style={{color:'#0284c7',fontWeight:600}}>+{stats?.newMaterialsToday||0} hôm nay</span>,                    delay:75  },
    { icon:Handshake, iconColor:'#8b5cf6', accentClass:'violet', label:'Đối tác',         value:stats?.totalPartners  ?? 0, sub:<span style={{color:'#94a3b8'}}>NCC + khách hàng</span>,                                                         delay:150 },
    { icon:Warning,   iconColor:'#d97706', accentClass:'amber',  label:'Sắp hết hàng',   value:stats?.lowStockCount  ?? 0, sub:<span style={{color:'#d97706',fontWeight:600}}>{(stats?.lowStockCount??0)>0?'Cần bổ sung sớm':'Ổn định'}</span>, delay:225 },
  ];

  return (
    <div className="wms-dashboard">

      {/* ══ HEADER ══════════════════════════════════════════════ */}
      <div className="dash-header">
        <div>
          <h1 className="dash-greeting">
            {greet},&nbsp;<span className="dash-greeting-accent">Admin</span>
          </h1>
          <div className="dash-meta-row">
            <span className="dash-date-text">{fmtDay(now)}</span>
            <div className="dash-live-badge">
              <div className="dash-live-dot"/>
              LIVE
            </div>
          </div>
        </div>
        <div className="dash-header-right">
          <div className="dash-period-group">
            {[[7,'7N'],[14,'14N'],[30,'30N']].map(([v,lbl]) => (
              <button key={v} className={`dash-period-btn${days===v?' active':''}`} onClick={()=>setDays(v)}>
                {lbl}
              </button>
            ))}
          </div>
          <button className={`dash-icon-btn${spinning?' spinning':''}`} onClick={handleRefresh} title="Làm mới">
            <ArrowClockwise size={16} weight="bold"/>
          </button>
        </div>
      </div>

      {/* ══ KPI GRID ════════════════════════════════════════════ */}
      <div className="dash-kpi-grid">
        {kpis.map(k => <KPICard key={k.label} {...k} loaded={loaded}/>)}
      </div>

      {/* ══ ROW 2 — Chart + Low Stock ═══════════════════════════ */}
      <div className="dash-charts-row" style={{ marginBottom:18 }}>
        <div className="panel-card" style={{ animationDelay:'80ms' }}>
          <div className="panel-header">
            <div>
              <div className="panel-title">Biến động nhập / xuất</div>
              <div className="panel-sub">{days} ngày gần nhất</div>
            </div>
            <div className="panel-legend">
              {[{c:'#be185d',l:'Nhập'},{c:'#0284c7',l:'Xuất'}].map(x => (
                <div key={x.l} className="legend-dot-item">
                  <div className="legend-dot-box" style={{ background:x.c }}/>
                  {x.l}
                </div>
              ))}
            </div>
          </div>
          {loading
            ? <div style={{ padding:'12px 24px 20px' }}><Skel h={160} r={12} mb={0}/></div>
            : <AreaChart data={chart}/>
          }
        </div>

        <div className="panel-card" style={{ animationDelay:'130ms' }}>
          <div className="panel-header">
            <div>
              <div className="panel-title">Sắp hết hàng</div>
              <div className="panel-sub">Cần bổ sung sớm</div>
            </div>
            {loaded && low.length > 0 && (
              <div className="panel-badge" style={{ background:'rgba(251,191,36,.14)', border:'1px solid rgba(251,191,36,.3)', color:'#d97706' }}>
                {low.length} mặt hàng
              </div>
            )}
          </div>
          <div className="alert-items-list">
            {loading
              ? [...Array(5)].map((_,i) => <Skel key={i} h={46} r={10} mb={9}/>)
              : low.length === 0
                ? <div className="stock-ok-state">
                    <div className="stock-ok-icon"><CheckCircle size={28} weight="duotone" color="#059669"/></div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#059669' }}>Tồn kho ổn định</div>
                    <div style={{ fontSize:12, color:'#94a3b8', marginTop:2 }}>Không có mặt hàng sắp hết</div>
                  </div>
                : low.map((it,i) => <LowRow key={it._id||i} item={it} maxQty={maxLow} index={i}/>)
            }
          </div>
        </div>
      </div>

      {/* ══ ROW 3 — Top Stock + Recent Tx ═══════════════════════ */}
      <div className="dash-bottom-row">
        <div className="panel-card" style={{ animationDelay:'160ms' }}>
          <div className="panel-header">
            <div>
              <div className="panel-title">Vật tư tồn nhiều nhất</div>
              <div className="panel-sub">Top 5 theo số lượng</div>
            </div>
          </div>
          <div className="stock-bars-list">
            {loading
              ? [...Array(5)].map((_,i) => <Skel key={i} h={38} r={8} mb={14}/>)
              : top.length === 0
                ? <div className="dash-empty"><div className="dash-empty-icon"><ChartBar size={22}/></div><span className="dash-empty-text">Chưa có dữ liệu</span></div>
                : top.slice(0,5).map((it,i) => <TopRow key={it._id||i} item={it} maxQty={maxTop} index={i}/>)
            }
          </div>
        </div>

        <div className="panel-card" style={{ animationDelay:'200ms' }}>
          <div className="panel-header">
            <div>
              <div className="panel-title">Giao dịch gần đây</div>
              <div className="panel-sub">Nhập + xuất kho</div>
            </div>
            {loaded && (
              <div style={{ display:'flex', gap:10 }}>
                <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:11.5, color:'#16a34a', fontWeight:600 }}>
                  <ArrowSquareIn size={12} weight="fill"/> Nhập
                </span>
                <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:11.5, color:'#be185d', fontWeight:600 }}>
                  <ArrowSquareOut size={12} weight="fill"/> Xuất
                </span>
              </div>
            )}
          </div>
          <div className="tx-list-inner" style={{ maxHeight:360, overflowY:'auto', paddingRight:4 }}>
            {loading
              ? [...Array(6)].map((_,i) => <Skel key={i} h={50} r={10} mb={10}/>)
              : recent.length === 0
                ? <div className="dash-empty"><div className="dash-empty-icon"><ChartBar size={22}/></div><span className="dash-empty-text">Chưa có giao dịch nào</span></div>
                : recent.map((tx,i) => <TxRow key={i} tx={tx} index={i}/>)
            }
          </div>
        </div>
      </div>

    </div>
  );
}