import { useState, useEffect, useRef } from 'react';
import {
  Warehouse, LockKey, User, Eye, EyeSlash,
  ArrowRight, Package, ChartBar, Truck,
  ShieldCheck, CheckCircle, Warning,
} from '@phosphor-icons/react';
import api from '../services/api';

// ─── Animated blob background ─────────────────────────────────────────────────
const BlobBg = () => (
  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
    <div style={{
      position: 'absolute', top: '-20%', left: '-10%',
      width: '60%', height: '60%', borderRadius: '50%',
      background: 'radial-gradient(circle,rgba(251,207,232,.55) 0%,transparent 70%)',
      animation: 'blobFloat 8s ease-in-out infinite',
    }} />
    <div style={{
      position: 'absolute', bottom: '-15%', right: '-15%',
      width: '55%', height: '55%', borderRadius: '50%',
      background: 'radial-gradient(circle,rgba(190,24,93,.18) 0%,transparent 70%)',
      animation: 'blobFloat 10s ease-in-out infinite reverse',
    }} />
    <div style={{
      position: 'absolute', top: '40%', right: '10%',
      width: '30%', height: '30%', borderRadius: '50%',
      background: 'radial-gradient(circle,rgba(251,207,232,.3) 0%,transparent 70%)',
      animation: 'blobFloat 7s ease-in-out infinite 2s',
    }} />
  </div>
);

// ─── Floating stat card (left panel) ─────────────────────────────────────────
const FloatCard = ({ icon, label, value, delay = 0, x = 0 }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 10,
    padding: '10px 16px', borderRadius: 14,
    background: 'rgba(255,255,255,.15)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,.25)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,.2), 0 8px 32px rgba(0,0,0,.1)',
    animation: `floatUp .6s ease both, floatBob 4s ease-in-out infinite ${delay}s`,
    marginLeft: x,
  }}>
    <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>{label}</div>
    </div>
  </div>
);

// ─── Input field ──────────────────────────────────────────────────────────────
const InputField = ({ label, type = 'text', value, onChange, placeholder, icon, error, autoFocus }) => {
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const isPw = type === 'password';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</label>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0 14px', height: 52, borderRadius: 12,
        border: `2px solid ${error ? '#fca5a5' : focused ? '#be185d' : '#e5e7eb'}`,
        background: error ? '#fff5f5' : '#fff',
        transition: 'border-color .2s, box-shadow .2s',
        boxShadow: focused && !error ? '0 0 0 4px rgba(190,24,93,.08)' : 'none',
      }}>
        <span style={{ color: focused ? '#be185d' : '#9ca3af', flexShrink: 0, transition: 'color .2s' }}>{icon}</span>
        <input
          autoFocus={autoFocus}
          type={isPw ? (showPw ? 'text' : 'password') : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontSize: 15, color: '#111827', fontFamily: 'Outfit, sans-serif',
          }}
        />
        {isPw && (
          <button type="button" onClick={() => setShowPw(s => !s)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex' }}>
            {showPw ? <EyeSlash size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#dc2626', animation: 'shake .3s ease' }}>
          <Warning size={13} weight="fill" /> {error}
        </div>
      )}
    </div>
  );
};

// ─── Submit button ────────────────────────────────────────────────────────────
const SubmitBtn = ({ loading, children }) => {
  const [active, setActive] = useState(false);
  return (
    <button
      type="submit"
      disabled={loading}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      onMouseLeave={() => setActive(false)}
      style={{
        width: '100%', height: 52, borderRadius: 12, border: 'none',
        background: loading ? '#e5e7eb' : 'linear-gradient(135deg, #be185d 0%, #9d174d 50%, #881337 100%)',
        color: loading ? '#9ca3af' : '#fff',
        fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transform: active ? 'scale(0.98) translateY(1px)' : 'scale(1) translateY(0)',
        boxShadow: loading ? 'none' : active ? 'none' : '0 4px 20px rgba(190,24,93,.4)',
        transition: 'transform .15s, box-shadow .15s, background .2s',
        letterSpacing: '.3px',
        fontFamily: 'Outfit, sans-serif',
      }}
    >
      {loading ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #d1d5db', borderTopColor: '#be185d', display: 'inline-block', animation: 'spin .7s linear infinite' }} />
          Đang xác thực...
        </span>
      ) : (
        <>{children} <ArrowRight size={18} weight="bold" /></>
      )}
    </button>
  );
};

// ─── Main Login ───────────────────────────────────────────────────────────────
export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});
  const [globalErr, setGlobalErr] = useState('');
  const [success, setSuccess]   = useState(false);

  const validate = () => {
    const e = {};
    if (!username.trim()) e.username = 'Vui lòng nhập tên đăng nhập';
    if (!password.trim()) e.password = 'Vui lòng nhập mật khẩu';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true); setGlobalErr('');
    try {
      const res = await api.post('/auth/login', { username, password });
      const { token, user } = res; // api.js trả về data trực tiếp, không có .data wrapper
      // api.js đọc token từ user.token — phải nhúng vào cùng object
      localStorage.setItem('user', JSON.stringify({ ...user, token }));
      localStorage.setItem('token', token);
      setSuccess(true);
      setTimeout(() => onLogin?.({ ...user, token }), 600);
    } catch (err) {
      setGlobalErr(err.message || 'Sai tên đăng nhập hoặc mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh', display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      fontFamily: 'Outfit, sans-serif',
      background: '#f9fafb',
    }}>

      {/* ── Left panel ── */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(145deg, #be185d 0%, #9d174d 45%, #7f1d3a 100%)',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', padding: '48px 52px',
      }}>
        <BlobBg />

        {/* Logo */}
        <div style={{ position: 'relative', animation: 'fadeUp .5s ease both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(255,255,255,.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.3)' }}>
              <Warehouse size={24} color="#fff" weight="fill" />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-.3px' }}>Quản Lý Kho</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.6)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '2px' }}>WMS V2.0</div>
            </div>
          </div>
        </div>

        {/* Hero text */}
        <div style={{ position: 'relative', animation: 'fadeUp .5s .1s ease both' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.5)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 16 }}>Warehouse Management System</div>
          <h1 style={{ margin: '0 0 20px', fontSize: 42, fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: '-2px' }}>
            Kiểm soát<br />
            <span style={{ color: 'rgba(255,255,255,.6)' }}>kho hàng</span><br />
            thông minh
          </h1>
          <p style={{ margin: 0, fontSize: 15, color: 'rgba(255,255,255,.65)', lineHeight: 1.6, maxWidth: 340 }}>
            Quản lý vật tư, theo dõi tồn kho, và vận hành chuỗi phân phối trong một nền tảng duy nhất.
          </p>
        </div>

        {/* Stats */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 10, animation: 'fadeUp .5s .2s ease both' }}>
          <FloatCard icon={<Package size={16} color="#fff" weight="fill" />} label="Vật tư đang quản lý" value="2,400+" delay={0} x={0} />
          <FloatCard icon={<ChartBar size={16} color="#fff" weight="fill" />} label="Giao dịch hôm nay" value="128" delay={0.3} x={32} />
          <FloatCard icon={<Truck size={16} color="#fff" weight="fill" />} label="Phiếu xuất đang xử lý" value="14" delay={0.6} x={16} />
        </div>

        {/* Bottom badge */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, animation: 'fadeUp .5s .3s ease both' }}>
          <ShieldCheck size={16} color="rgba(255,255,255,.5)" weight="fill" />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.45)' }}>Dữ liệu được bảo mật & mã hoá</span>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 64px', background: '#fff',
        borderLeft: '1px solid #f1f5f9',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Subtle bg grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: .4,
          backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />

        <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>
          {/* Header */}
          <div style={{ marginBottom: 40, animation: 'fadeUp .45s ease both' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: '#fdf2f8', border: '1px solid #fbcfe8', marginBottom: 16 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#be185d', animation: 'pulseDot 2s infinite' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#be185d', letterSpacing: '1px', textTransform: 'uppercase' }}>Hệ thống đang hoạt động</span>
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: 30, fontWeight: 900, color: '#0f172a', letterSpacing: '-1px', lineHeight: 1.1 }}>
              Chào mừng trở lại
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>Đăng nhập để tiếp tục vào hệ thống</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ animation: 'fadeUp .45s .08s ease both' }}>
              <InputField
                label="Tên đăng nhập"
                value={username}
                onChange={v => { setUsername(v); setErrors(e => ({ ...e, username: '' })); setGlobalErr(''); }}
                placeholder="Nhập username..."
                icon={<User size={18} />}
                error={errors.username}
                autoFocus
              />
            </div>

            <div style={{ animation: 'fadeUp .45s .14s ease both' }}>
              <InputField
                label="Mật khẩu"
                type="password"
                value={password}
                onChange={v => { setPassword(v); setErrors(e => ({ ...e, password: '' })); setGlobalErr(''); }}
                placeholder="Nhập mật khẩu..."
                icon={<LockKey size={18} />}
                error={errors.password}
              />
            </div>

            {/* Global error */}
            {globalErr && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 14px', borderRadius: 10,
                background: '#fef2f2', border: '1px solid #fecaca',
                animation: 'shake .3s ease',
              }}>
                <Warning size={16} color="#dc2626" weight="fill" />
                <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>{globalErr}</span>
              </div>
            )}

            {/* Success state */}
            {success && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 14px', borderRadius: 10,
                background: '#f0fdf4', border: '1px solid #bbf7d0',
                animation: 'fadeUp .25s ease',
              }}>
                <CheckCircle size={16} color="#16a34a" weight="fill" />
                <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>Đăng nhập thành công, đang chuyển hướng...</span>
              </div>
            )}

            <div style={{ animation: 'fadeUp .45s .2s ease both' }}>
              <SubmitBtn loading={loading}>Đăng nhập</SubmitBtn>
            </div>
          </form>

          {/* Footer */}
          <div style={{ marginTop: 36, paddingTop: 24, borderTop: '1px solid #f3f4f6', animation: 'fadeUp .45s .28s ease both' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <ShieldCheck size={14} color="#9ca3af" />
              <span style={{ fontSize: 12, color: '#9ca3af' }}>Phiên đăng nhập được mã hoá TLS · WMS v2.0</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap');

        @keyframes fadeUp    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatBob  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes blobFloat { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(3%,4%) scale(1.04)} 66%{transform:translate(-2%,2%) scale(.97)} }
        @keyframes pulseDot  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes shake     { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-5px)} 40%,80%{transform:translateX(5px)} }

        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: '1fr 1fr'"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="position: relative; overflow: hidden; background: linear-gradient"] {
            display: none !important;
          }
          div[style*="padding: '48px 64px'"] {
            padding: 32px 24px !important;
          }
        }
      `}</style>
    </div>
  );
}