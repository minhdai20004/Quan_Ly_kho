import { useState } from 'react';

const Products = ({ user }) => {
  const [products, setProducts] = useState(() => JSON.parse(localStorage.getItem('products') || '[]'));
  const [form, setForm] = useState({ name: '', description: '', price: '', quantity: '' });
  const [editing, setEditing] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const logTransaction = (productName, type, quantity, user) => {
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    transactions.push({
      date: new Date().toISOString(),
      productName,
      type,
      quantity: parseInt(quantity),
      user: user?.username || 'unknown'
    });
    localStorage.setItem('transactions', JSON.stringify(transactions));
  };

  const saveProducts = (newProducts) => {
    setProducts(newProducts);
    localStorage.setItem('products', JSON.stringify(newProducts));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) {
      const oldProduct = products.find(p => p.id === editing);
      const updated = products.map(p => p.id === editing ? { ...form, id: editing } : p);
      const qtyDiff = parseInt(form.quantity) - parseInt(oldProduct.quantity);
      if (qtyDiff > 0) {
        logTransaction(form.name, 'nhap', qtyDiff, user);
      } else if (qtyDiff < 0) {
        logTransaction(form.name, 'xuat', -qtyDiff, user);
      }
      saveProducts(updated);
      setEditing(null);
    } else {
      const newProduct = { ...form, id: Date.now() };
      saveProducts([...products, newProduct]);
      if (parseInt(form.quantity) > 0) {
        logTransaction(form.name, 'nhap', form.quantity, user);
      }
    }
    setForm({ name: '', description: '', price: '', quantity: '' });
  };

  const handleEdit = (product) => {
    setForm(product);
    setEditing(product.id);
  };


  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id) => {
    if (window.confirm('Xóa sản phẩm này?')) {
      const product = products.find(p => p.id === id);
      logTransaction(product.name, 'xuat', product.quantity, user);
      saveProducts(products.filter(p => p.id !== id));
    }
  };

  return (
    <div className="products">
      <h1>Quản Lý Sản Phẩm</h1>
      <form onSubmit={handleSubmit} className="product-form">
        <input
          type="text"
          placeholder="Tên sản phẩm"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Mô tả"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <input
          type="number"
          placeholder="Giá"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Số lượng"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          required
        />
        <button type="submit">{editing ? 'Cập nhật' : 'Thêm'}</button>
        {editing && <button type="button" onClick={() => { setEditing(null); setForm({ name: '', description: '', price: '', quantity: '' }); }}>Hủy</button>}
      </form>
      <div className="search-container" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            maxWidth: '400px',
            width: '100%',
            padding: '0.75rem',
            border: '2px solid #e1e5e9',
            borderRadius: '8px',
            fontSize: '1rem'
          }}
        />
      </div>
      <table className="product-table">
        <thead>
          <tr>
            <th>Tên</th>
            <th>Mô tả</th>
            <th>Giá</th>
            <th>Số lượng</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map(product => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{product.description}</td>
              <td>{product.price}</td>
              <td>{product.quantity}</td>
              <td>
                <button onClick={() => handleEdit(product)}>Sửa</button>
                <button onClick={() => handleDelete(product.id)}>Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Products;