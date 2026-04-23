import { useState } from 'react';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState(() => JSON.parse(localStorage.getItem('suppliers') || '[]'));
  const [form, setForm] = useState({ name: '', contact: '', address: '' });
  const [editing, setEditing] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const saveSuppliers = (newSuppliers) => {
    setSuppliers(newSuppliers);
    localStorage.setItem('suppliers', JSON.stringify(newSuppliers));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) {
      const updated = suppliers.map(s => s.id === editing ? { ...form, id: editing } : s);
      saveSuppliers(updated);
      setEditing(null);
    } else {
      const newSupplier = { ...form, id: Date.now() };
      saveSuppliers([...suppliers, newSupplier]);
    }
    setForm({ name: '', contact: '', address: '' });
  };

  const handleEdit = (supplier) => {
    setForm(supplier);
    setEditing(supplier.id);
  };

  const handleDelete = (id) => {
    if (window.confirm('Xóa nhà cung cấp này?')) {
      saveSuppliers(suppliers.filter(s => s.id !== id));
    }
  };

  return (
    <div className="suppliers">
      <h1>Quản Lý Nhà Cung Cấp</h1>
      <form onSubmit={handleSubmit} className="supplier-form">
        <input
          type="text"
          placeholder="Tên nhà cung cấp"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Liên hệ"
          value={form.contact}
          onChange={(e) => setForm({ ...form, contact: e.target.value })}
        />
        <input
          type="text"
          placeholder="Địa chỉ"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
        <button type="submit">{editing ? 'Cập nhật' : 'Thêm'}</button>
        {editing && <button type="button" onClick={() => { setEditing(null); setForm({ name: '', description: '', price: '', quantity: '' }); }}>Hủy</button>}
      </form>
      <div className="search-container" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
        <input
          type="text"
          placeholder="Tìm kiếm nhà cung cấp..."
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
      <table className="supplier-table">
        <thead>
          <tr>
            <th>Tên</th>
            <th>Liên hệ</th>
            <th>Địa chỉ</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filteredSuppliers.map(supplier => (
            <tr key={supplier.id}>
              <td>{supplier.name}</td>
              <td>{supplier.contact}</td>
              <td>{supplier.address}</td>
              <td>
                <button onClick={() => handleEdit(supplier)}>Sửa</button>
                <button onClick={() => handleDelete(supplier.id)}>Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Suppliers;