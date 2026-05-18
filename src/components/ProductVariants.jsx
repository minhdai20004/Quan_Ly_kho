import { useState, useEffect } from 'react';
import { productApi } from '../services/productService';

const ProductVariants = ({ productId, variants = [], onUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    variant_id: '',
    sku: '',
    barcode: '',
    color: '',
    size: '',
    capacity: '',
    price: '',
    cost_price: '',
    quantity: 0
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        cost_price: parseFloat(formData.cost_price) || 0,
        inventory: {
          quantity_on_hand: parseInt(formData.quantity) || 0,
          quantity_reserved: 0,
          quantity_available: parseInt(formData.quantity) || 0
        }
      };
      await productApi.createVariant(productId, payload);
      setShowForm(false);
      setFormData({ variant_id: '', sku: '', barcode: '', color: '', size: '', capacity: '', price: '', cost_price: '', quantity: 0 });
      onUpdate?.();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h4 style={{ color: '#2d3748', fontWeight: '600' }}>Biến thể (Variant)</h4>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '0.5rem 1rem',
            background: '#9f7aea',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          + Thêm biến thể
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          padding: '1rem',
          background: '#f7fafc',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <input
            type="text"
            placeholder="SKU"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            required
            style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
          />
          <input
            type="text"
            placeholder="Barcode"
            value={formData.barcode}
            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
            style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
          />
          <input
            type="text"
            placeholder="Màu sắc"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
          />
          <input
            type="text"
            placeholder="Size"
            value={formData.size}
            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
            style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
          />
          <input
            type="text"
            placeholder="Dung tích"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
            style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
          />
          <input
            type="number"
            placeholder="Giá bán"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
          />
          <input
            type="number"
            placeholder="Giá vốn"
            value={formData.cost_price}
            onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
            style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
          />
          <input
            type="number"
            placeholder="Số lượng"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
          />
          <div style={{ gridColumn: 'span 3', display: 'flex', gap: '0.5rem' }}>
            <button type="submit" style={{ flex: 1, padding: '0.5rem', background: '#48bb78', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Lưu biến thể
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: '0.5rem', background: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Hủy
            </button>
          </div>
        </form>
      )}

      {variants.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#e9d8fd' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>SKU</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Thuộc tính</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Giá bán</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Giá vốn</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Tồn</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((variant) => (
              <tr key={variant._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>{variant.sku}</td>
                <td style={{ padding: '0.75rem' }}>
                  {[variant.attributes?.color, variant.attributes?.size, variant.attributes?.capacity].filter(Boolean).join(' / ') || '—'}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right', color: '#38a169', fontWeight: '600' }}>
                  {variant.price?.toLocaleString('vi-VN')} ₫
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                  {variant.cost_price?.toLocaleString('vi-VN')} ₫
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>
                  {variant.inventory?.quantity_on_hand || 0}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    background: variant.status === 'active' ? '#c6f6d5' : '#fed7d7',
                    color: variant.status === 'active' ? '#22543d' : '#742a2a'
                  }}>
                    {variant.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ padding: '1rem', textAlign: 'center', color: '#718096', background: '#f7fafc', borderRadius: '8px' }}>
          Chưa có biến thể nào
        </div>
      )}
    </div>
  );
};

export default ProductVariants;
