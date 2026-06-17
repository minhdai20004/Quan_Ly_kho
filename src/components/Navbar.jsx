import { useState } from 'react';
import {
  Warehouse, Package, ArrowFatLineDown, ArrowFatLineUp,
  ChartBar, SquaresFour, Handshake, ChartPie, Users,
  SignOut, CaretLeft, Crown, User,
} from '@phosphor-icons/react';

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { key: 'dashboard', label: 'Tổng Quan', Icon: SquaresFour },
      { key: 'materials', label: 'Vật Tư',    Icon: Package },
    ],
  },
  {
    label: 'Vận Hành',
    items: [
      { key: 'inbound',   label: 'Nhập Kho',  Icon: ArrowFatLineDown },
      { key: 'outbound',  label: 'Xuất Kho',  Icon: ArrowFatLineUp },
      { key: 'inventory', label: 'Tồn Kho',   Icon: ChartBar },
    ],
  },
  {
    label: 'Hệ Thống',
    items: [
      { key: 'warehouses', label: 'Kho Hàng',   Icon: Warehouse },
      { key: 'partners',   label: 'Đối Tác',    Icon: Handshake },
      { key: 'reports',    label: 'Báo Cáo',    Icon: ChartPie },
      { key: 'users',      label: 'Người Dùng', Icon: Users, adminOnly: true },
    ],
  },
];

// Pink palette
const P = {
  bg:          'linear-gradient(180deg, #be185d 0%, #9d174d 100%)',
  bgSolid:     '#9d174d',
  active:      'rgba(255,255,255,0.18)',
  activeHover: 'rgba(255,255,255,0.22)',
  hover:       'rgba(255,255,255,0.08)',
  text:        '#ffffff',
  textMuted:   'rgba(255,255,255,0.55)',
  textFaint:   'rgba(255,255,255,0.32)',
  border:      'rgba(255,255,255,0.12)',
  divider:     'rgba(255,255,255,0.1)',
};

function NavItem({ item, active, collapsed, onClick }) {
  const { Icon } = item;
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: '0.625rem',
        padding: collapsed ? '0.6rem 0' : '0.525rem 0.75rem',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        outline: 'none',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        fontFamily: "'Outfit', system-ui, sans-serif",
        fontSize: '0.82rem',
        fontWeight: active ? 700 : 500,
        letterSpacing: active ? '0.005em' : '0.01em',
        color: active ? '#fff' : hovered ? 'rgba(255,255,255,0.85)' : P.textMuted,
        background: active ? P.active : hovered ? P.hover : 'transparent',
        boxShadow: active ? 'inset 2.5px 0 0 #fff' : 'none',
        transition: 'background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      <span style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: active ? '#fff' : hovered ? 'rgba(255,255,255,0.75)' : P.textFaint,
        transition: 'color 0.15s ease',
      }}>
        <Icon size={15} weight={active ? 'fill' : 'regular'} />
      </span>
      <span style={{
        opacity: collapsed ? 0 : 1,
        maxWidth: collapsed ? 0 : 160,
        overflow: 'hidden',
        transition: 'opacity 0.18s ease, max-width 0.24s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {item.label}
      </span>
    </button>
  );
}

function SectionLabel({ label, collapsed }) {
  if (collapsed) return (
    <div style={{ height: 1, margin: '0.5rem 0.75rem', background: P.divider }} />
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 0.75rem 0.3rem' }}>
      <span style={{
        fontSize: '0.6rem', fontWeight: 700,
        color: P.textFaint,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        fontFamily: "'Outfit', system-ui, sans-serif",
        whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: P.divider }} />
    </div>
  );
}

const Navbar = ({ activeTab, setActiveTab, onLogout, user }) => {
  const [collapsed, setCollapsed] = useState(false);
  const isAdmin = user?.role === 'admin';
  const sidebarW = collapsed ? 56 : 210;

  return (
    <aside style={{
      width: sidebarW, minWidth: sidebarW,
      height: '100vh',
      position: 'sticky', top: 0,
      background: P.bg,
      borderRight: 'none',
      display: 'flex', flexDirection: 'column',
      zIndex: 100,
      transition: 'width 0.25s cubic-bezier(0.16,1,0.3,1), min-width 0.25s cubic-bezier(0.16,1,0.3,1)',
      overflow: 'hidden',
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: collapsed ? '1rem 0' : '1rem 0.875rem',
        borderBottom: `1px solid ${P.border}`,
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        minHeight: 60, gap: '0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', overflow: 'hidden', flex: 1, minWidth: 0 }}>
          {/* Logo icon */}
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Warehouse size={15} weight="fill" color="#fff" />
          </div>
          {/* Logo text */}
          <div style={{
            overflow: 'hidden',
            opacity: collapsed ? 0 : 1,
            maxWidth: collapsed ? 0 : 140,
            transition: 'opacity 0.18s ease, max-width 0.24s cubic-bezier(0.16,1,0.3,1)',
            whiteSpace: 'nowrap',
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em', lineHeight: 1.2, fontFamily: "'Outfit', system-ui, sans-serif" }}>
              Quản Lý Kho
            </div>
            <div style={{ fontSize: '0.58rem', color: P.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 1, fontFamily: "'JetBrains Mono', monospace" }}>
              WMS v2.0
            </div>
          </div>
        </div>

        {/* Collapse btn */}
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Mở rộng' : 'Thu gọn'}
          style={{
            flexShrink: 0, width: 22, height: 22, borderRadius: 5,
            border: `1px solid ${P.border}`,
            background: 'rgba(255,255,255,0.1)',
            color: P.textMuted, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.14s ease, transform 0.24s cubic-bezier(0.16,1,0.3,1)',
            transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = P.textMuted; }}
        >
          <CaretLeft size={11} weight="bold" />
        </button>
      </div>

      {/* ── Nav ── */}
      <nav style={{
        flex: 1, padding: '0.5rem 0.4rem',
        display: 'flex', flexDirection: 'column', gap: 1,
        overflowY: 'auto', overflowX: 'hidden',
      }}>
        {NAV_GROUPS.map((group, gi) => {
          const visibleItems = group.items.filter(t => !t.adminOnly || isAdmin);
          if (!visibleItems.length) return null;
          return (
            <div key={gi}>
              {group.label && <SectionLabel label={group.label} collapsed={collapsed} />}
              {visibleItems.map(item => (
                <NavItem
                  key={item.key}
                  item={item}
                  active={activeTab === item.key}
                  collapsed={collapsed}
                  onClick={() => setActiveTab(item.key)}
                />
              ))}
            </div>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div style={{ padding: '0.5rem 0.4rem', borderTop: `1px solid ${P.border}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* User */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: '0.5rem',
          padding: collapsed ? '0.45rem 0' : '0.45rem 0.625rem',
          borderRadius: 8,
          background: 'rgba(255,255,255,0.08)',
          border: `1px solid ${P.border}`,
          overflow: 'hidden',
          transition: 'padding 0.24s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
            background: isAdmin ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)',
            border: '1.5px solid rgba(255,255,255,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {isAdmin
              ? <Crown size={11} weight="fill" color="#fff" />
              : <User  size={11} weight="fill" color="#fff" />}
          </div>
          <div style={{
            overflow: 'hidden',
            opacity: collapsed ? 0 : 1,
            maxWidth: collapsed ? 0 : 140,
            whiteSpace: 'nowrap',
            transition: 'opacity 0.18s ease, max-width 0.24s cubic-bezier(0.16,1,0.3,1)',
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'Outfit', system-ui, sans-serif" }}>
              {user?.username || user?.name || 'User'}
            </div>
            <div style={{ fontSize: '0.6rem', color: P.textMuted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.03em', marginTop: 1 }}>
              {isAdmin ? 'admin' : 'staff'}
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          title={collapsed ? 'Đăng xuất' : undefined}
          style={{
            width: '100%',
            padding: collapsed ? '0.5rem 0' : '0.45rem 0.625rem',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '0.75rem', fontWeight: 500,
            fontFamily: "'Outfit', system-ui, sans-serif",
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: collapsed ? 0 : '0.375rem',
            overflow: 'hidden',
            transition: 'background 0.14s ease, color 0.14s ease, border-color 0.14s ease, transform 0.1s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.16)';
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
          }}
          onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.975)'; }}
          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <SignOut size={13} weight="regular" style={{ flexShrink: 0 }} />
          <span style={{
            opacity: collapsed ? 0 : 1,
            maxWidth: collapsed ? 0 : 100,
            overflow: 'hidden', whiteSpace: 'nowrap',
            transition: 'opacity 0.18s ease, max-width 0.24s cubic-bezier(0.16,1,0.3,1)',
          }}>
            Đăng Xuất
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Navbar;