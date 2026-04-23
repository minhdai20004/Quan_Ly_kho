import { useState } from 'react';

const Categories = () => {
  const [categories, setCategories] = useState(() => JSON.parse(localStorage.getItem('categories') || '[]'));
  const [form, setForm] = useState({ name: '', description: '' });
  const [editing, setEditing] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const saveCategories = (newCategories) => {
    setCategories(newCategories);
    localStorage.setItem('categories', JSON.stringify(newCategories));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) {
      const updated = categories.map(c => c.id === editing ? { ...form, id: editing } : c);
      saveCategories(updated);
      setEditing(null);
    } else {
      const newCategory = { ...form, id: Date.now() };
      saveCategories([...categories, newCategory]);
    }
    setForm({ name: '', description: '' });
  };

  const handleEdit = (category) => {
    setForm(category);
    setEditing(category.id);
  };

  const handleDelete = (id) => {
    if (window.confirm('Xóa danh mục này?')) {
      saveCategories(categories.filter(c => c.id !== id));
    }
  };

  return (
    <div className="categories">
      <h1>Quản Lý Danh Mục</h1>
      <form onSubmit={handleSubmit} className="category-form">
        <input
          type="text"
          placeholder="Tên danh mục"
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
        <button type="submit">{editing ? 'Cập nhật' : 'Thêm'}</button>
        {editing && <button type="button" onClick={() => { setEditing(null); setForm({ name: '', description: '', price: '', quantity: '' }); }}>Hủy</button>}
      </form>
      <div className="search-container" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
        <input
          type="text"
          placeholder="Tìm kiếm danh mục..."
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
      <table className="category-table">
        <thead>
          <tr>
            <th>Tên</th>
            <th>Mô tả</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filteredCategories.map(category => (
            <tr key={category.id}>
              <td>{category.name}</td>
              <td>{category.description}</td>
              <td>
                <button onClick={() => handleEdit(category)}>Sửa</button>
                <button onClick={() => handleDelete(category.id)}>Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Categories;