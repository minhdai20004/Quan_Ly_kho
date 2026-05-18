import { useState } from 'react';

const TABS = [
  { key: 'dashboard',  label: 'Kho Hàng',       icon: '🏭' },
  { key: 'products',   label: 'Sản Phẩm',        icon: '📦' },
  { key: 'reports',    label: 'Báo Cáo',         icon: '📊' },
  { key: 'categories', label: 'Danh Mục',        icon: '🗂️' },
  { key: 'inventory',  label: 'Tồn Kho',         icon: '🔢' },
  { key: 'suppliers',  label: 'Nhà Cung Cấp',    icon: '🚚' },
];

const Navbar = ({ activeTab, setActiveTab, onLogout, user }) => {
  const [collapsed, setCollapsed] = useState(false);
  const isAdmin = user?.role === 'admin';

  return (
    <aside style={{
      width: collapsed ? '68px' : '220px',
      minWidth: collapsed ? '68px' : '220px',
      height: '100vh', position: 'sticky', top: 0,
      background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%)',
      display: 'flex', flexDirection: 'column',
      boxShadow: '4px 0 24px rgba(0,0,0,0.18)',
      zIndex: 100, fontFamily: "'Segoe UI', sans-serif",
      transition: 'width 0.25s ease, min-width 0.25s ease',
      overflow: 'hidden',
    }}>

      {/* Logo + Toggle */}
      <div style={{
        padding: '1.25rem 0.875rem',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: '0.5rem', minHeight: '72px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden', flex: 1, minWidth: 0 }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
            background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', boxShadow: '0 4px 12px rgba(129,140,248,0.4)',
          }}>📦</div>
          <div style={{
            overflow: 'hidden', whiteSpace: 'nowrap',
            opacity: collapsed ? 0 : 1,
            maxWidth: collapsed ? 0 : '120px',
            transition: 'opacity 0.2s ease, max-width 0.25s ease',
          }}>
            <div style={{ color: 'white', fontWeight: '700', fontSize: '0.95rem', lineHeight: 1.2 }}>Quản Lý Kho</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>WMS System</div>
          </div>
        </div>

        {/* Toggle button */}
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Mở rộng' : 'Thu gọn'}
          style={{
            flexShrink: 0, width: '26px', height: '26px', borderRadius: '7px', border: 'none',
            background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.7rem', transition: 'transform 0.25s ease, background 0.15s',
            transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
        >◀</button>
      </div>

      {/* Menu */}
      <nav style={{ flex: 1, padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto', overflowX: 'hidden' }}>
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              title={collapsed ? tab.label : ''}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: collapsed ? 0 : '0.75rem',
                padding: collapsed ? '0.7rem 0' : '0.65rem 0.875rem',
                borderRadius: '10px', border: 'none', cursor: 'pointer',
                background: active ? 'rgba(129,140,248,0.22)' : 'transparent',
                color: active ? '#c7d2fe' : 'rgba(255,255,255,0.55)',
                fontWeight: active ? '600' : '400',
                fontSize: '0.875rem', textAlign: 'left',
                transition: 'all 0.15s ease',
                position: 'relative', outline: 'none',
                whiteSpace: 'nowrap', overflow: 'hidden',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; } }}
            >
              {active && (
                <div style={{
                  position: 'absolute', left: 0, top: '20%', bottom: '20%',
                  width: '3px', borderRadius: '0 3px 3px 0',
                  background: 'linear-gradient(180deg, #818cf8, #a78bfa)',
                }} />
              )}
              <span style={{ fontSize: '1.1rem', minWidth: '20px', textAlign: 'center', flexShrink: 0 }}>{tab.icon}</span>
              <span style={{
                opacity: collapsed ? 0 : 1,
                maxWidth: collapsed ? 0 : '140px',
                overflow: 'hidden',
                transition: 'opacity 0.2s ease, max-width 0.25s ease',
              }}>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div style={{ padding: '0.875rem 0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Avatar */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: collapsed ? 0 : '0.625rem',
          padding: collapsed ? '0.5rem 0' : '0.625rem 0.75rem',
          borderRadius: '10px', background: 'rgba(255,255,255,0.06)',
          marginBottom: '0.5rem', overflow: 'hidden',
          transition: 'padding 0.25s ease',
        }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
            background: isAdmin ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'linear-gradient(135deg, #6ee7b7, #10b981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem',
          }}>
            {isAdmin ? '👑' : '👤'}
          </div>
          <div style={{
            overflow: 'hidden', whiteSpace: 'nowrap',
            opacity: collapsed ? 0 : 1,
            maxWidth: collapsed ? 0 : '120px',
            transition: 'opacity 0.2s ease, max-width 0.25s ease',
          }}>
            <div style={{ color: 'white', fontSize: '0.82rem', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.username || user?.name || 'User'}
            </div>
            <div style={{ color: isAdmin ? '#fcd34d' : '#6ee7b7', fontSize: '0.7rem' }}>
              {isAdmin ? 'Quản trị viên' : 'Nhân viên'}
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          title={collapsed ? 'Đăng Xuất' : ''}
          style={{
            width: '100%', padding: '0.6rem', border: 'none', borderRadius: '10px',
            background: 'rgba(239,68,68,0.12)', color: '#fca5a5',
            fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: collapsed ? 0 : '0.4rem',
            transition: 'all 0.15s', overflow: 'hidden',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.25)'; e.currentTarget.style.color = '#fecaca'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = '#fca5a5'; }}
        >
          <span style={{ flexShrink: 0 }}>🚪</span>
          <span style={{
            opacity: collapsed ? 0 : 1,
            maxWidth: collapsed ? 0 : '100px',
            overflow: 'hidden', whiteSpace: 'nowrap',
            transition: 'opacity 0.2s ease, max-width 0.25s ease',
          }}> Đăng Xuất</span>
        </button>
      </div>
    </aside>
  );
};

export default Navbar;