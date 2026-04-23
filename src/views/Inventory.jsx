

const Inventory = () => {
  const products = JSON.parse(localStorage.getItem('products') || '[]');

  const lowStock = products.filter(p => p.quantity < 10);

  return (
    <div className="inventory">
      <h1>Tồn Kho</h1>
      <div className="inventory-summary">
        <h2>Tóm tắt</h2>
        <p>Tổng sản phẩm: {products.length}</p>
        <p>Sản phẩm sắp hết: {lowStock.length}</p>
      </div>
      <h2>Danh sách sản phẩm</h2>
      <table className="inventory-table">
        <thead>
          <tr>
            <th>Tên</th>
            <th>Mô tả</th>
            <th>Số lượng</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{product.description}</td>
              <td>{product.quantity}</td>
              <td>{product.quantity < 10 ? 'Sắp hết' : 'Còn đủ'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {lowStock.length > 0 && (
        <div className="low-stock-alert">
          <h2>Cảnh báo sản phẩm sắp hết</h2>
          <ul>
            {lowStock.map(product => (
              <li key={product.id}>{product.name} - Còn {product.quantity}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Inventory;