import { useState } from 'react';

const Users = () => {
  const [users, setUsers] = useState(() => JSON.parse(localStorage.getItem('users') || '[]'));
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('username-asc');

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    switch (sortOrder) {
      case 'username-asc':
        return a.username.localeCompare(b.username);
      case 'username-desc':
        return b.username.localeCompare(a.username);
      case 'role-admin-first':
        return a.role === 'admin' ? -1 : 1;
      case 'role-employee-first':
        return a.role === 'employee' ? -1 : 1;
      default:
        return 0;
    }
  });

  const handleDelete = (username) => {
    if (window.confirm(`Xóa tài khoản ${username}?`)) {
      const updated = users.filter(u => u.username !== username);
      setUsers(updated);
      localStorage.setItem('users', JSON.stringify(updated));
    }
  };

  const handleToggleRole = (username) => {
    const updated = users.map(u =>
      u.username === username
        ? { ...u, role: u.role === 'admin' ? 'employee' : 'admin' }
        : u
    );
    setUsers(updated);
    localStorage.setItem('users', JSON.stringify(updated));
  };

  return (
    <div className="users">
      <h1>Quản Lý Người Dùng</h1>

      {/* Thanh điều khiển: Sort + Search */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Sort dropdown - bên trái */}
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          style={{
            padding: '0.75rem',
            border: '2px solid #667eea',
            borderRadius: '8px',
            fontSize: '1rem',
            backgroundColor: 'white',
            color: '#333',
            cursor: 'pointer',
            minWidth: '200px',
            boxSizing: 'border-box'
          }}
        >
          <option value="username-asc">Username A → Z</option>
          <option value="username-desc">Username Z → A</option>
          <option value="role-admin-first">Admin đầu tiên</option>
          <option value="role-employee-first">Nhân viên đầu tiên</option>
        </select>

        {/* Search - bên phải */}
        <div style={{ flex: 1, maxWidth: '400px', minWidth: '250px' }}>
          <input
            type="text"
            placeholder="Tìm kiếm người dùng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #667eea',
              borderRadius: '8px',
              fontSize: '1rem',
              boxSizing: 'border-box',
              backgroundColor: 'white',
              color: '#333',
              outline: 'none',
              transition: 'border-color 0.3s, box-shadow 0.3s'
            }}
          />
        </div>
      </div>

      <table className="user-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Vai trò</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map(user => (
            <tr key={user.username}>
              <td>{user.username}</td>
              <td>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  backgroundColor: user.role === 'admin' ? '#e3f2fd' : '#e8f5e9',
                  color: user.role === 'admin' ? '#1976d2' : '#388e3c',
                  fontWeight: '600',
                  fontSize: '0.875rem'
                }}>
                  {user.role === 'admin' ? 'Admin' : 'Nhân viên'}
                </span>
              </td>
              <td>
                <button
                  onClick={() => handleToggleRole(user.username)}
                  style={{ marginRight: '0.5rem', fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                >
                  {user.role === 'admin' ? 'Hạ xuống' : 'Nâng lên'}
                </button>
                <button
                  onClick={() => handleDelete(user.username)}
                  style={{ backgroundColor: '#ff6b6b', fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Hiển thị số lượng */}
      <div style={{ marginTop: '1rem', color: '#666', fontSize: '0.9rem' }}>
        Tổng {filteredUsers.length} người dùng
      </div>
    </div>
  );
};

export default Users;
