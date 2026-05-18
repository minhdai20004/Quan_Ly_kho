import { useState, useEffect } from 'react';
import { productApi } from '../services/productService';

const ProductUnits = ({ productId, units = [], onUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    unit_id: '',
    name: '',
    abbreviation: '',
    ratio: 1,
    barcode: '',
    is_base: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await productApi.createUnit(productId, formData);
      setShowForm(false);
      setFormData({ unit_id: '', name: '', abbreviation: '', ratio: 1, barcode: '', is_base: false });
      onUpdate?.();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleDelete = async (unitId) => {
    if (!window.confirm('Xóa đơn vị tính này?')) return;
    try {
      await productApi.delete(`/products/${productId}/units/${unitId}`);
      onUpdate?.();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h4 style={{ color: '#2d3748', fontWeight: '600' }}>Đơn vị tính & Quy đổi</h4>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '0.5rem 1rem',
            background: '#4299e1',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          + Thêm đơn vị
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1rem',
          padding: '1rem',
          background: '#f7fafc',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <input
            type="text"
            placeholder="Tên đơn vị (VD: Cái, Hộp, Thùng)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
          />
          <input
            type="text"
            placeholder="Viết tắt (VD: cái, h, th)"
            value={formData.abbreviation}
            onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
            style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
          />
          <input
            type="number"
            placeholder="Tỷ lệ (1 = đơn vị cơ bản)"
            min="1"
            value={formData.ratio}
            onChange={(e) => setFormData({ ...formData, ratio: parseInt(e.target.value) })}
            required
            style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
          />
          <input
            type="text"
            placeholder="Barcode (nếu có)"
            value={formData.barcode}
            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
            style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="is_base"
              checked={formData.is_base}
              onChange={(e) => setFormData({ ...formData, is_base: e.target.checked })}
            />
            <label htmlFor="is_base">Đơn vị cơ bản</label>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', gridColumn: 'span 2' }}>
            <button type="submit" style={{ flex: 1, padding: '0.5rem', background: '#48bb78', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Lưu
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: '0.5rem', background: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Hủy
            </button>
          </div>
        </form>
      )}

      {units.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#edf2f7' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Đơn vị</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Tỷ lệ</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Barcode</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Cơ bản</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {units.map((unit) => (
              <tr key={unit._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '0.75rem', fontWeight: '500' }}>{unit.name}</td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{unit.ratio}</td>
                <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>{unit.barcode || '-'}</td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  {unit.is_base ? '✅' : '—'}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  <button
                    onClick={() => handleDelete(unit.unit_id)}
                    style={{ padding: '0.25rem 0.5rem', border: '1px solid #fc8181', borderRadius: '4px', background: 'white', color: '#e53e3e', cursor: 'pointer', fontSize: '0.75rem' }}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ padding: '1rem', textAlign: 'center', color: '#718096', background: '#f7fafc', borderRadius: '8px' }}>
          Chưa có đơn vị tính nào
        </div>
      )}
    </div>
  );
};

export default ProductUnits;
