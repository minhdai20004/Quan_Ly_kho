import { useState } from 'react';

const Transactions = () => {
  const [transactions] = useState(() => JSON.parse(localStorage.getItem('transactions') || '[]'));
  const [sortOrder, setSortOrder] = useState('newest');

  const sortedTransactions = [...transactions].sort((a, b) => {
    switch (sortOrder) {
      case 'newest':
        return new Date(b.date) - new Date(a.date);
      case 'oldest':
        return new Date(a.date) - new Date(b.date);
      case 'product-a-z':
        return a.productName.localeCompare(b.productName);
      case 'product-z-a':
        return b.productName.localeCompare(a.productName);
      case 'quantity-high':
        return parseInt(b.quantity) - parseInt(a.quantity);
      case 'quantity-low':
        return parseInt(a.quantity) - parseInt(b.quantity);
      default:
        return 0;
    }
  });

  return (
    <div className="transactions">
      <h1>Lịch Sử Giao Dịch</h1>

      {/* Sort dropdown */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginBottom: '1.5rem',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <label style={{ fontWeight: '600', color: '#333' }}>Sắp xếp:</label>
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
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
          <option value="product-a-z">Tên sản phẩm A → Z</option>
          <option value="product-z-a">Tên sản phẩm Z → A</option>
          <option value="quantity-high">Số lượng (cao → thấp)</option>
          <option value="quantity-low">Số lượng (thấp → cao)</option>
        </select>
        <span style={{ color: '#666', fontSize: '0.9rem' }}>
          Tổng {sortedTransactions.length} giao dịch
        </span>
      </div>

      <table className="transaction-table">
        <thead>
          <tr>
            <th>Thời gian</th>
            <th>Sản phẩm</th>
            <th>Loại</th>
            <th>Số lượng</th>
            <th>Người thực hiện</th>
          </tr>
        </thead>
        <tbody>
          {sortedTransactions.map((t, index) => (
            <tr key={index}>
              <td>{new Date(t.date).toLocaleString('vi-VN')}</td>
              <td>{t.productName}</td>
              <td>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  backgroundColor: t.type === 'nhap' ? '#e8f5e9' : '#ffebee',
                  color: t.type === 'nhap' ? '#388e3c' : '#d32f2f',
                  fontWeight: '600'
                }}>
                  {t.type === 'nhap' ? 'Nhập' : 'Xuất'}
                </span>
              </td>
              <td>{t.quantity}</td>
              <td>{t.user}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Transactions;
