// ================================================================
//  WMS — USERS  v3.0  (fixed API parsing + luxury UI)
//  Paste to: src/views/Users.jsx
// ================================================================
import { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, PencilSimple, Trash, X, FloppyDisk,
  ArrowsClockwise, MagnifyingGlass, ShieldCheck, User,
  Lock, LockOpen, CheckCircle, XCircle, Eye, EyeSlash,
  Warning, Key, Envelope, IdentificationCard,
} from '@phosphor-icons/react';
import api from '../services/api';

/* ── Tokens ───────────────────────────────────────────────────── */
const C = {
  pink:'#be185d', pinkD:'#9d174d', pinkL:'#fce7f3', pinkLL:'#fdf2f8',
  sky:'#0284c7',  skyL:'#e0f2fe',
  green:'#059669',greenL:'#d1fae5',
  red:'#dc2626',  redL:'#fee2e2',
  amber:'#d97706',amberL:'#fef3c7',
  purple:'#7c3aed',purpleL:'#ede9fe',
  bg:'#f0f4f8', surface:'#ffffff',
  border:'#e2e8f0', border2:'#f1f5f9',
  text1:'#1e293b', text2:'#475569', text3:'#94a3b8',
};

/* ── Helpers ──────────────────────────────────────────────────── */
const ROLES = [
  { value:'admin', label:'Admin',     color:C.purple, bg:C.purpleL, Icon:ShieldCheck },
  { value:'staff', label:'Nhân viên', color:C.sky,    bg:C.skyL,    Icon:User },
];

const getRoleMeta = role => ROLES.find(r=>r.value===role) || ROLES[1];

const inSx = (disabled=false) => ({
  width:'100%', padding:'9px 12px',
  border:`1.5px solid ${C.border}`, borderRadius:10,
  background:disabled?'#f8fafc':C.surface,
  fontFamily:'Outfit,sans-serif', fontSize:13.5,
  color:C.text1, outline:'none',
  transition:'border-color 0.2s,box-shadow 0.2s', boxSizing:'border-box',
});
const fp = e=>{e.target.style.borderColor=C.pink;e.target.style.boxShadow=`0 0 0 3px rgba(190,24,93,0.10)`;};
const br = e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow='none';};

/* ── Shimmer ──────────────────────────────────────────────────── */
const Shimmer = ({h=16,r=8,w='100%',style={}}) => (
  <div style={{width:w,height:h,borderRadius:r,background:'linear-gradient(90deg,#f1f5f9 25%,#e8edf2 50%,#f1f5f9 75%)',backgroundSize:'400% 100%',animation:'u-shimmer 1.6s ease-in-out infinite',...style}}/>
);

/* ── Avatar ───────────────────────────────────────────────────── */
const Avatar = ({name,size=40}) => {
  const initials = (name||'?').trim().split(' ').map(w=>w[0]).slice(-2).join('').toUpperCase();
  const hue = [...(name||'')].reduce((h,c)=>h+c.charCodeAt(0),0)%360;
  return (
    <div style={{width:size,height:size,borderRadius:size*0.28,flexShrink:0,background:`hsl(${hue},55%,88%)`,color:`hsl(${hue},55%,32%)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.36,fontWeight:800,letterSpacing:'-0.5px',border:`2px solid hsl(${hue},45%,80%)`}}>
      {initials}
    </div>
  );
};

/* ── Badges ───────────────────────────────────────────────────── */
const RoleBadge = ({role}) => {
  const m = getRoleMeta(role);
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'3px 10px',borderRadius:8,fontSize:11,fontWeight:700,background:m.bg,color:m.color,border:`1px solid ${m.color}25`}}>
      <m.Icon size={11} weight="fill"/>{m.label}
    </span>
  );
};

const ActiveBadge = ({active}) => (
  <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'3px 10px',borderRadius:8,fontSize:11,fontWeight:700,background:active?C.greenL:C.redL,color:active?C.green:C.red,border:`1px solid ${active?'rgba(5,150,105,0.25)':'rgba(220,38,38,0.25)'}`}}>
    {active?<CheckCircle size={11} weight="fill"/>:<XCircle size={11} weight="fill"/>}
    {active?'Hoạt động':'Bị khoá'}
  </span>
);

/* ── ActBtn ───────────────────────────────────────────────────── */
const ActBtn = ({children,onClick,hoverColor,hoverBg,title,baseColor=C.text3,baseBorder=C.border}) => (
  <button title={title} onClick={onClick}
    style={{width:32,height:32,border:`1.5px solid ${baseBorder}`,background:C.surface,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:baseColor,transition:'all 0.18s',flexShrink:0}}
    onMouseEnter={e=>{e.currentTarget.style.color=hoverColor;e.currentTarget.style.background=hoverBg;e.currentTarget.style.borderColor=hoverColor;}}
    onMouseLeave={e=>{e.currentTarget.style.color=baseColor;e.currentTarget.style.background=C.surface;e.currentTarget.style.borderColor=baseBorder;}}>
    {children}
  </button>
);

/* ── Field ────────────────────────────────────────────────────── */
const Field = ({label,value,onChange,placeholder,disabled,type='text',required}) => (
  <div style={{display:'flex',flexDirection:'column',gap:5}}>
    <label style={{fontSize:11.5,fontWeight:700,color:C.text2,textTransform:'uppercase',letterSpacing:'0.5px'}}>
      {label}{required&&<span style={{color:C.pink}}> *</span>}
    </label>
    <input type={type} value={value} onChange={e=>onChange(e.target.value)}
      placeholder={placeholder} disabled={disabled}
      style={inSx(disabled)} onFocus={disabled?undefined:fp} onBlur={br}/>
  </div>
);

/* ── PasswordField ────────────────────────────────────────────── */
const PasswordField = ({label,value,onChange,placeholder,required}) => {
  const [show,setShow] = useState(false);
  return (
    <div style={{display:'flex',flexDirection:'column',gap:5}}>
      <label style={{fontSize:11.5,fontWeight:700,color:C.text2,textTransform:'uppercase',letterSpacing:'0.5px'}}>
        {label}{required&&<span style={{color:C.pink}}> *</span>}
      </label>
      <div style={{position:'relative'}}>
        <input type={show?'text':'password'} value={value} onChange={e=>onChange(e.target.value)}
          placeholder={placeholder}
          style={{...inSx(),paddingRight:40}}
          onFocus={fp} onBlur={br}/>
        <button type="button" onClick={()=>setShow(s=>!s)}
          style={{position:'absolute',right:11,top:'50%',transform:'translateY(-50%)',border:'none',background:'none',cursor:'pointer',color:C.text3,padding:2,display:'flex',alignItems:'center'}}>
          {show?<EyeSlash size={15}/>:<Eye size={15}/>}
        </button>
      </div>
    </div>
  );
};

/* ── emptyForm ────────────────────────────────────────────────── */
const emptyForm = {username:'',password:'',full_name:'',email:'',role:'staff'};

/* ── UserModal ────────────────────────────────────────────────── */
function UserModal({open,item,onClose,onSaved}) {
  const [form,setForm]     = useState(emptyForm);
  const [saving,setSaving] = useState(false);
  const [err,setErr]       = useState('');

  useEffect(()=>{
    if(!open) return;
    setForm(item?{
      username:  item.username||'',
      password:  '',
      full_name: item.full_name||'',
      email:     item.email||'',
      role:      item.role||'staff',
    }:emptyForm);
    setErr('');
  },[open,item]);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSave = async()=>{
    if(!form.username.trim())         return setErr('Vui lòng nhập username');
    if(!item&&!form.password.trim())  return setErr('Vui lòng nhập mật khẩu');
    if(!form.full_name.trim())        return setErr('Vui lòng nhập họ tên');
    setSaving(true); setErr('');
    try {
      const payload = {...form};
      if(item&&!payload.password) delete payload.password;
      if(item) await api.put(`/auth/users/${item._id}`, payload);
      else     await api.post('/auth/register', payload);
      onSaved();
    } catch(e) { setErr(e.message||'Lỗi server'); }
    finally { setSaving(false); }
  };

  if(!open) return null;
  return (
    <div onClick={undefined}
      style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.52)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,backdropFilter:'blur(7px)',padding:20,animation:'u-fadein 0.2s ease'}}>
      <div style={{background:C.surface,borderRadius:24,width:'100%',maxWidth:520,overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'0 24px 64px rgba(0,0,0,0.16)',border:`1px solid ${C.border}`,animation:'u-scalein 0.3s cubic-bezier(0.16,1,0.3,1)'}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 22px',background:'linear-gradient(135deg,#fdf2f8,#fce7f3)',borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:'flex',alignItems:'center',gap:11}}>
            <div style={{width:42,height:42,borderRadius:13,background:`linear-gradient(135deg,${C.pink},${C.pinkD})`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 12px rgba(190,24,93,0.28)'}}>
              <Users size={20} color="#fff" weight="fill"/>
            </div>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:C.text1}}>{item?'Chỉnh sửa tài khoản':'Tạo tài khoản mới'}</div>
              <div style={{fontSize:12,color:C.pink,marginTop:1}}>{item?`Đang sửa: @${item.username}`:'Điền thông tin người dùng'}</div>
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
        <div style={{padding:'20px 22px',display:'flex',flexDirection:'column',gap:14}}>

          {/* Section: Tài khoản */}
          <div style={{fontSize:11,fontWeight:800,color:C.pink,textTransform:'uppercase',letterSpacing:'1px',paddingBottom:4,borderBottom:`1px solid ${C.pinkL}`}}>Thông tin tài khoản</div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <Field label="Username *" value={form.username} onChange={v=>set('username',v.toLowerCase().replace(/\s/g,''))}
              placeholder="vd: nhanvien01" disabled={!!item} required/>
            <div style={{display:'flex',flexDirection:'column',gap:5}}>
              <label style={{fontSize:11.5,fontWeight:700,color:C.text2,textTransform:'uppercase',letterSpacing:'0.5px'}}>Vai trò *</label>
              <select value={form.role} onChange={e=>set('role',e.target.value)}
                style={{...inSx(),appearance:'none',cursor:'pointer'}}
                onFocus={fp} onBlur={br}>
                {ROLES.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>

          <PasswordField
            label={item?'Mật khẩu mới (để trống = không đổi)':'Mật khẩu'}
            value={form.password}
            onChange={v=>set('password',v)}
            placeholder={item?'Để trống nếu không muốn đổi':'Tối thiểu 6 ký tự'}
            required={!item}/>

          {/* Section: Cá nhân */}
          <div style={{fontSize:11,fontWeight:800,color:C.sky,textTransform:'uppercase',letterSpacing:'1px',paddingBottom:4,borderBottom:`1px solid ${C.skyL}`,marginTop:4}}>Thông tin cá nhân</div>

          <Field label="Họ tên *" value={form.full_name} onChange={v=>set('full_name',v)}
            placeholder="Nguyễn Văn A" required/>

          <Field label="Email" value={form.email} onChange={v=>set('email',v)}
            placeholder="email@company.com" type="email"/>

          {err&&(
            <div style={{padding:'10px 14px',background:C.redL,borderRadius:10,color:C.red,fontSize:13,border:`1px solid rgba(220,38,38,0.25)`,display:'flex',alignItems:'center',gap:7}}>
              <Warning size={14} weight="fill"/>{err}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',padding:'14px 22px 18px',borderTop:`1px solid ${C.border}`,background:'#f8fafc'}}>
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
            {saving?<ArrowsClockwise size={14} style={{animation:'u-spin 0.8s linear infinite'}}/>:<FloppyDisk size={14} weight="bold"/>}
            {saving?'Đang lưu...':(item?'Cập nhật':'Tạo tài khoản')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── ConfirmDialog ────────────────────────────────────────────── */
function ConfirmDialog({open,title,message,confirmLabel,confirmColor='#ef4444',onConfirm,onCancel,loading}) {
  if(!open) return null;
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.55)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1100,backdropFilter:'blur(6px)',animation:'u-fadein 0.2s ease'}}>
      <div style={{background:C.surface,borderRadius:20,padding:'28px 32px',width:380,boxShadow:'0 20px 60px rgba(0,0,0,0.16)',border:`1px solid ${C.border}`,animation:'u-scalein 0.25s cubic-bezier(0.16,1,0.3,1)'}}>
        <div style={{width:48,height:48,borderRadius:13,background:C.redL,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',border:`1px solid rgba(220,38,38,0.2)`}}>
          <Warning size={24} color={C.red} weight="duotone"/>
        </div>
        <div style={{fontWeight:800,fontSize:16,color:C.text1,marginBottom:8,textAlign:'center'}}>{title}</div>
        <div style={{color:C.text2,fontSize:13.5,marginBottom:24,lineHeight:1.6,textAlign:'center'}}>{message}</div>
        <div style={{display:'flex',gap:10,justifyContent:'center'}}>
          <button onClick={onCancel}
            style={{padding:'9px 22px',borderRadius:10,border:`1.5px solid ${C.border}`,background:C.surface,color:C.text2,cursor:'pointer',fontWeight:600,fontSize:13.5,fontFamily:'Outfit,sans-serif',transition:'all 0.18s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.pink;e.currentTarget.style.color=C.pink;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.text2;}}>
            Huỷ
          </button>
          <button onClick={onConfirm} disabled={loading}
            style={{padding:'9px 22px',borderRadius:10,border:'none',background:`linear-gradient(135deg,${confirmColor},${confirmColor}cc)`,color:'white',cursor:loading?'not-allowed':'pointer',fontWeight:700,fontSize:13.5,fontFamily:'Outfit,sans-serif',opacity:loading?0.7:1,boxShadow:`0 2px 10px ${confirmColor}40`,transition:'all 0.2s'}}>
            {loading?'Đang xử lý...':confirmLabel||'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── UserCard ─────────────────────────────────────────────────── */
function UserCard({user,isSelf,onEdit,onToggle,onDelete,index}) {
  const m = getRoleMeta(user.role);
  return (
    <div style={{background:C.surface,borderRadius:18,border:`1px solid ${C.border}`,padding:'16px 20px',display:'flex',alignItems:'center',gap:16,boxShadow:'0 2px 10px rgba(0,0,0,0.04)',transition:'transform 0.2s,box-shadow 0.2s',animation:`u-fadeup 0.35s cubic-bezier(0.16,1,0.3,1) ${index*40}ms both`}}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 28px rgba(0,0,0,0.08)';}}
      onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 2px 10px rgba(0,0,0,0.04)';}}>

      {/* Avatar */}
      <Avatar name={user.full_name||user.username} size={46}/>

      {/* Info */}
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5,flexWrap:'wrap'}}>
          <span style={{fontWeight:800,fontSize:15,color:C.text1}}>{user.full_name||user.username}</span>
          {isSelf&&(
            <span style={{fontSize:10,padding:'1px 8px',borderRadius:20,background:C.pinkL,color:C.pink,fontWeight:700,border:`1px solid ${C.pink}30`}}>Bạn</span>
          )}
          <RoleBadge role={user.role}/>
          <ActiveBadge active={user.is_active}/>
        </div>
        <div style={{display:'flex',gap:14,flexWrap:'wrap',alignItems:'center'}}>
          <span style={{fontSize:12,color:C.pink,fontFamily:'JetBrains Mono,monospace',fontWeight:700}}>@{user.username}</span>
          {user.email&&<span style={{fontSize:12,color:C.text3,display:'flex',alignItems:'center',gap:4}}><Envelope size={11}/>{user.email}</span>}
          {user.created_at&&(
            <span style={{fontSize:11,color:C.text3}}>
              Tạo: {new Date(user.created_at).toLocaleDateString('vi-VN')}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{display:'flex',gap:6,flexShrink:0}}>
        <ActBtn onClick={()=>onEdit(user)} title="Sửa tài khoản" hoverColor={C.sky} hoverBg={C.skyL}>
          <PencilSimple size={14}/>
        </ActBtn>
        {!isSelf&&(
          <>
            <ActBtn
              onClick={()=>onToggle(user)}
              title={user.is_active?'Khoá tài khoản':'Mở khoá tài khoản'}
              hoverColor={user.is_active?C.amber:C.green}
              hoverBg={user.is_active?C.amberL:C.greenL}
              baseColor={user.is_active?C.amber:C.green}
              baseBorder={user.is_active?'#fde68a':'#bbf7d0'}>
              {user.is_active?<Lock size={14}/>:<LockOpen size={14}/>}
            </ActBtn>
            <ActBtn onClick={()=>onDelete(user)} title="Xoá tài khoản" hoverColor={C.red} hoverBg={C.redL}>
              <Trash size={14}/>
            </ActBtn>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────── */
export default function UsersPage() {
  const [users,setUsers]       = useState([]);
  const [loading,setLoading]   = useState(true);
  const [search,setSearch]     = useState('');
  const [roleFilter,setRole]   = useState('all');
  const [modal,setModal]       = useState({open:false,item:null});
  const [confirm,setConfirm]   = useState({open:false});

  const currentUserId = (() => {
    try { return JSON.parse(localStorage.getItem('user')||'{}')?.id||''; }
    catch { return ''; }
  })();

  const load = useCallback(async()=>{
    setLoading(true);
    try {
      const res = await api.get('/auth/users');
      // api.js returns parsed JSON directly — handle both { data: [...] } and [...]
      const d = res?.data ?? res;
      setUsers(Array.isArray(d)?d:[]);
    } catch { setUsers([]); }
    finally { setLoading(false); }
  },[]);

  useEffect(()=>{load();},[load]);

  const filtered = users.filter(u=>{
    const q = search.toLowerCase();
    const matchQ = !q||u.username?.toLowerCase().includes(q)||u.full_name?.toLowerCase().includes(q)||u.email?.toLowerCase().includes(q);
    const matchR = roleFilter==='all'||u.role===roleFilter;
    return matchQ&&matchR;
  });

  const handleToggle = user => setConfirm({
    open:true,
    title: user.is_active?'Khoá tài khoản':'Mở khoá tài khoản',
    message: `${user.is_active?'Khoá':'Mở khoá'} tài khoản "@${user.username}"?`,
    confirmLabel: user.is_active?'Khoá ngay':'Mở khoá',
    confirmColor: user.is_active?C.amber:C.green,
    loading:false,
    onConfirm: async()=>{
      setConfirm(c=>({...c,loading:true}));
      try { await api.patch(`/auth/users/${user._id}/toggle`); setConfirm({open:false}); load(); }
      catch { setConfirm(c=>({...c,loading:false})); }
    },
  });

  const handleDelete = user => setConfirm({
    open:true,
    title:'Xoá tài khoản',
    message:`Xoá tài khoản "@${user.username}"? Hành động này không thể hoàn tác.`,
    confirmLabel:'Xoá vĩnh viễn',
    confirmColor:C.red,
    loading:false,
    onConfirm: async()=>{
      setConfirm(c=>({...c,loading:true}));
      try { await api.delete(`/auth/users/${user._id}`); setConfirm({open:false}); load(); }
      catch { setConfirm(c=>({...c,loading:false})); }
    },
  });

  /* Stats */
  const activeCount = users.filter(u=>u.is_active).length;
  const adminCount  = users.filter(u=>u.role==='admin').length;
  const lockedCount = users.length - activeCount;

  const STAT_TABS = [
    {key:'all',     label:'Tổng cộng', value:users.length,  color:C.pink,   bg:C.pinkL,   top:`linear-gradient(90deg,${C.pink},#f472b6)`},
    {key:'active',  label:'Hoạt động', value:activeCount,   color:C.green,  bg:C.greenL,  top:`linear-gradient(90deg,${C.green},#34d399)`},
    {key:'admin',   label:'Admin',     value:adminCount,    color:C.purple, bg:C.purpleL, top:`linear-gradient(90deg,${C.purple},#a78bfa)`},
    {key:'locked',  label:'Bị khoá',   value:lockedCount,   color:C.red,    bg:C.redL,    top:`linear-gradient(90deg,${C.red},#f87171)`},
  ];

  return (
    <div style={{minHeight:'100vh',background:C.bg,fontFamily:'Outfit,sans-serif',padding:'28px 32px 56px'}}>

      {/* ══ HEADER ══ */}
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:22}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div style={{width:48,height:48,borderRadius:15,background:`linear-gradient(135deg,${C.pinkL},#fce4ef)`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 16px rgba(190,24,93,0.20)'}}>
            <Users size={24} color={C.pink} weight="duotone"/>
          </div>
          <div>
            <h1 style={{fontSize:22,fontWeight:800,color:C.text1,margin:0,letterSpacing:'-0.5px'}}>Người Dùng</h1>
            <div style={{fontSize:13,color:C.text3,marginTop:3}}>Quản lý tài khoản & phân quyền</div>
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={load}
            style={{width:40,height:40,border:`1.5px solid ${C.border}`,background:C.surface,borderRadius:11,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:C.text3,transition:'all 0.2s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.pink;e.currentTarget.style.color=C.pink;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.text3;}}>
            <ArrowsClockwise size={16} weight="bold" style={{animation:loading?'u-spin 1s linear infinite':'none'}}/>
          </button>
          <button onClick={()=>setModal({open:true,item:null})}
            style={{display:'inline-flex',alignItems:'center',gap:7,padding:'10px 20px',background:`linear-gradient(135deg,${C.pink},${C.pinkD})`,border:'none',borderRadius:12,color:'white',fontFamily:'Outfit,sans-serif',fontSize:14,fontWeight:700,cursor:'pointer',boxShadow:'0 2px 12px rgba(190,24,93,0.30)',transition:'all 0.22s'}}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 6px 20px rgba(190,24,93,0.40)';}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 2px 12px rgba(190,24,93,0.30)';}}>
            <Plus size={15} weight="bold"/> Thêm tài khoản
          </button>
        </div>
      </div>

      {/* ══ STAT TABS ══ */}
      <div style={{display:'flex',gap:10,marginBottom:22,flexWrap:'wrap'}}>
        {STAT_TABS.map(({key,label,value,color,bg,top})=>(
          <div key={key}
            style={{display:'flex',alignItems:'center',gap:10,padding:'11px 18px',background:C.surface,borderRadius:16,border:`1.5px solid ${C.border}`,boxShadow:'0 1px 4px rgba(0,0,0,0.04)',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:top}}/>
            <div style={{width:36,height:36,borderRadius:10,background:bg,display:'flex',alignItems:'center',justifyContent:'center'}}>
              {key==='all'?<Users size={17} color={color} weight="duotone"/>:
               key==='active'?<CheckCircle size={17} color={color} weight="duotone"/>:
               key==='admin'?<ShieldCheck size={17} color={color} weight="duotone"/>:
               <Lock size={17} color={color} weight="duotone"/>}
            </div>
            <div>
              <div style={{fontSize:20,fontWeight:800,color,lineHeight:1,fontFamily:'JetBrains Mono,monospace'}}>{loading?'—':value}</div>
              <div style={{fontSize:11.5,fontWeight:600,color:C.text3,marginTop:2}}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ══ TOOLBAR ══ */}
      <div style={{display:'flex',gap:10,marginBottom:18,alignItems:'center'}}>
        <div style={{position:'relative',flex:1,maxWidth:380}}>
          <MagnifyingGlass size={15} color={C.text3} style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Tìm tên, username, email..."
            style={{...inSx(),paddingLeft:38}} onFocus={fp} onBlur={br}/>
        </div>
        <div style={{display:'flex',gap:3,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:11,padding:3}}>
          {[{key:'all',label:'Tất cả'},...ROLES.map(r=>({key:r.value,label:r.label}))].map(f=>(
            <button key={f.key} onClick={()=>setRole(f.key)}
              style={{padding:'6px 15px',borderRadius:9,border:'none',cursor:'pointer',fontSize:13,fontWeight:roleFilter===f.key?700:500,fontFamily:'Outfit,sans-serif',background:roleFilter===f.key?`linear-gradient(135deg,${C.pink},${C.pinkD})`:'transparent',color:roleFilter===f.key?'white':C.text2,transition:'all 0.18s',boxShadow:roleFilter===f.key?'0 2px 8px rgba(190,24,93,0.25)':'none'}}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══ LIST ══ */}
      {loading ? (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {[...Array(4)].map((_,i)=><Shimmer key={i} h={82} r={18}/>)}
        </div>
      ) : filtered.length===0 ? (
        <div style={{background:C.surface,borderRadius:20,border:`1px solid ${C.border}`,padding:'60px 20px',textAlign:'center',boxShadow:'0 4px 20px rgba(0,0,0,0.04)'}}>
          <div style={{width:64,height:64,background:C.pinkL,borderRadius:18,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',border:`1.5px dashed rgba(190,24,93,0.3)`,animation:'u-float 3s ease-in-out infinite'}}>
            <Users size={28} color={C.pink}/>
          </div>
          <div style={{fontSize:15,fontWeight:700,color:C.text2,marginBottom:6}}>
            {search||roleFilter!=='all'?'Không tìm thấy tài khoản phù hợp':'Chưa có tài khoản nào'}
          </div>
          {!search&&roleFilter==='all'&&(
            <button onClick={()=>setModal({open:true,item:null})}
              style={{marginTop:12,display:'inline-flex',alignItems:'center',gap:7,padding:'9px 20px',border:'none',background:`linear-gradient(135deg,${C.pink},${C.pinkD})`,borderRadius:10,color:'white',fontFamily:'Outfit,sans-serif',fontSize:13.5,fontWeight:700,cursor:'pointer',boxShadow:'0 2px 10px rgba(190,24,93,0.28)'}}>
              <Plus size={14} weight="bold"/> Tạo tài khoản đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {filtered.map((u,i)=>(
            <UserCard key={u._id} user={u} index={i}
              isSelf={u._id===currentUserId||u.username==='admin'&&currentUserId===''}
              onEdit={item=>setModal({open:true,item})}
              onToggle={handleToggle}
              onDelete={handleDelete}/>
          ))}
          <div style={{padding:'10px 4px',fontSize:13,color:C.text3,textAlign:'right'}}>
            Hiển thị <strong style={{color:C.text2,fontFamily:'JetBrains Mono,monospace'}}>{filtered.length}</strong> / {users.length} tài khoản
          </div>
        </div>
      )}

      <UserModal open={modal.open} item={modal.item}
        onClose={()=>setModal({open:false,item:null})}
        onSaved={()=>{setModal({open:false,item:null});load();}}/>
      <ConfirmDialog {...confirm} onCancel={()=>setConfirm({open:false})}/>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
        @keyframes u-shimmer  {0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes u-fadeup   {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes u-fadein   {from{opacity:0}to{opacity:1}}
        @keyframes u-scalein  {from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
        @keyframes u-spin     {to{transform:rotate(360deg)}}
        @keyframes u-float    {0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
      `}</style>
    </div>
  );
}