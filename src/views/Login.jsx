import { useState } from 'react';
import { Warehouse, Eye, EyeSlash } from '@phosphor-icons/react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Đăng nhập thất bại'); return; }
      onLogin({ ...data.user, token: data.token });
    } catch {
      setError('Không thể kết nối server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">
            <Warehouse size={20} weight="fill" color="#fff" />
          </div>
          <div>
            <div className="login-title">Quản Lý Kho</div>
            <div className="login-sub">WMS v2.0</div>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ color: '#f1f5f9', fontSize: '1.1rem', fontWeight: '700', letterSpacing: '-0.01em' }}>Chào mừng trở lại</div>
          <div style={{ color: 'rgba(148,163,184,0.6)', fontSize: '0.8rem', marginTop: '4px' }}>Đăng nhập để tiếp tục</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label className="login-label">Tên đăng nhập</label>
            <input className="login-input" type="text" placeholder="Nhập username..." value={username} onChange={e => setUsername(e.target.value)} required autoFocus />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label className="login-label">Mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <input
                className="login-input"
                type={showPass ? 'text' : 'password'}
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(148,163,184,0.5)', cursor: 'pointer', padding: 0 }}>
                {showPass ? <EyeSlash size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', padding: '0.6rem 0.875rem', color: '#fca5a5', fontSize: '0.8rem', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;