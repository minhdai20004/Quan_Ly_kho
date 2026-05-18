import { useState, useEffect } from 'react';
import { productApi } from '../services/productService';

const BatchTracker = ({ productId, batches = [], onUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    batch_number: '',
    supplier_id: '',
    manufacture_date: '',
    expiry_date: '',
    quantity: '',
    warehouse_id: '',
    location_id: ''
  });
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const response = await productApi.getSuppliers(); // Actually get all suppliers
      setSuppliers(response.data || []);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        batch_number: formData.batch_number,
        supplier_id: formData.supplier_id,
        manufacture_date: formData.manufacture_date ? new Date(formData.manufacture_date) : null,
        expiry_date: formData.expiry_date ? new Date(formData.expiry_date) : null,
        quantity: parseInt(formData.quantity),
        warehouse_id: formData.warehouse_id,
        location_id: formData.location_id || null,
        status: 'active'
      };
      await productApi.createBatch(payload);
      setShowForm(false);
      setFormData({ batch_number: '', supplier_id: '', manufacture_date: '', expiry_date: '', quantity: '', warehouse_id: '', location_id: '' });
      onUpdate?.();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const getExpiryStatus = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { color: '#e53e3e', text: 'Hết hạn' };
    if (daysLeft < 30) return { color: '#dd6b20', text: `${daysLeft} ngày` };
    return { color: '#38a169', text: `${daysLeft} ngày` };
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h4 style={{ color: '#2d3748', fontWeight: '600' }}>Lô hàng & Hạn sử dụng</h4>
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
          + Thêm lô hàng
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1rem',
          padding: '1.5rem',
          background: '#f7fafc',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          border: '1px solid #e2e8f0'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Số lô *</label>
            <input
              type="text"
              value={formData.batch_number}
              onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
              placeholder="VD: LOT-2024-001"
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Nhà cung cấp</label>
            <select
              value={formData.supplier_id}
              onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
            >
              <option value="">Chọn NCC</option>
              {suppliers.map(sup => (
                <option key={sup._id} value={sup._id}>{sup.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Ngày sản xuất</label>
            <input
              type="date"
              value={formData.manufacture_date}
              onChange={(e) => setFormData({ ...formData, manufacture_date: e.target.value })}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Hạn sử dụng</label>
            <input
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Số lượng</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
              min="1"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Kho nhập</label>
            <select
              value={formData.warehouse_id}
              onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value, location_id: '' })}
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
            >
              <option value="">Chọn kho</option>
              {warehouses.map(wh => (
                <option key={wh._id} value={wh._id}>{wh.name}</option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button type="submit" style={{ flex: 1, padding: '0.75rem', background: '#48bb78', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
              Lưu lô hàng
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: '0.75rem', background: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
              Hủy
            </button>
          </div>
        </form>
      )}

      {batches.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#e9d8fd' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Số lô</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Nhà cung cấp</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Sản xuất</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Hết hạn</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Số lượng</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => {
              const expiryStatus = getExpiryStatus(batch.expiry_date);
              return (
                <tr key={batch._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontWeight: '500' }}>
                    {batch.batch_number}
                  </td>
                  <td style={{ padding: '0.75rem' }}>{batch.supplier_id?.name || 'N/A'}</td>
                  <td style={{ padding: '0.75rem' }}>
                    {batch.manufacture_date ? new Date(batch.manufacture_date).toLocaleDateString('vi-VN') : '—'}
                  </td>
                  <td style={{ padding: '0.75rem', color: expiryStatus.color, fontWeight: '600' }}>
                    {batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString('vi-VN') : '—'}
                    <div style={{ fontSize: '0.75rem' }}>{expiryStatus.text}</div>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>
                    {batch.quantity}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      background: batch.status === 'active' ? '#c6f6d5' : batch.status === 'expired' ? '#fed7d7' : '#e2e8f0',
                      color: batch.status === 'active' ? '#22543d' : batch.status === 'expired' ? '#742a2a' : '#4a5568'
                    }}>
                      {batch.status === 'active' ? 'Active' : batch.status === 'expired' ? 'Expired' : batch.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#718096', background: '#f7fafc', borderRadius: '8px' }}>
          Chưa có lô hàng nào
        </div>
      )}

      {batches.length > 0 && (
        <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#718096' }}>
          💡 Lưu ý: Hệ thống sẽ cảnh báo tự động khi lô hàng sắp hết hạn (theo cấu hình cảnh báo của sản phẩm).
        </div>
      )}
    </div>
  );
};

export default BatchTracker;
