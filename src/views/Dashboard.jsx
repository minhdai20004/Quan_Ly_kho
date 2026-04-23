

const Dashboard = () => {
  const products = JSON.parse(localStorage.getItem('products') || '[]');
  const suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');
  const categories = JSON.parse(localStorage.getItem('categories') || '[]');
  const totalStock = products.reduce((sum, p) => sum + parseInt(p.quantity || 0), 0);

  const stats = {
    products: products.length,
    totalStock,
    suppliers: suppliers.length,
    categories: categories.length,
  };

  return (
    <div className="dashboard">
      <h1>Quản Lý Kho - Dashboard</h1>
      <div className="stats">
        <div className="stat-card">
          <h3>Tổng sản phẩm</h3>
          <p>{stats.products}</p>
        </div>
        <div className="stat-card">
          <h3>Tổng tồn kho</h3>
          <p>{stats.totalStock}</p>
        </div>
        <div className="stat-card">
          <h3>Danh mục</h3>
          <p>{stats.categories}</p>
        </div>
        <div className="stat-card">
          <h3>Nhà cung cấp</h3>
          <p>{stats.suppliers}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;