

const Navbar = ({ activeTab, setActiveTab, onLogout, user }) => {
  const tabs = user?.role === 'admin' ? [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'products', label: 'Sản phẩm' },
    { key: 'categories', label: 'Danh mục' },
    { key: 'inventory', label: 'Tồn kho' },
    { key: 'suppliers', label: 'Nhà cung cấp' },
    { key: 'transactions', label: 'Lịch sử GD' },
    { key: 'register', label: 'Đăng ký NV' },
  ] : [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'products', label: 'Sản phẩm' },
    { key: 'categories', label: 'Danh mục' },
    { key: 'inventory', label: 'Tồn kho' },
    { key: 'suppliers', label: 'Nhà cung cấp' },
    { key: 'transactions', label: 'Lịch sử GD' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>Quản Lý Kho</h1>
      </div>
      <ul className="navbar-menu">
        {tabs.map(tab => (
          <li key={tab.key}>
            <button
              className={activeTab === tab.key ? 'active' : ''}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>
      <div className="navbar-user">
        <span>Xin chào, {user?.username}</span>
        <button onClick={onLogout}>Đăng Xuất</button>
      </div>
    </nav>
  );
};

export default Navbar;