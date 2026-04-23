

const Transactions = () => {
  const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');

  return (
    <div className="transactions">
      <h1>Lịch Sử Giao Dịch</h1>
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
          {transactions.sort((a, b) => new Date(b.date) - new Date(a.date)).map((t, index) => (
            <tr key={index}>
              <td>{new Date(t.date).toLocaleString()}</td>
              <td>{t.productName}</td>
              <td>{t.type === 'nhap' ? 'Nhập' : 'Xuất'}</td>
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