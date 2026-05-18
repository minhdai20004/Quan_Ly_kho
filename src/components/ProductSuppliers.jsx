import { useState, useEffect, useCallback } from 'react';
import { productApi } from '../services/productService';

const ProductSuppliers = ({ productId, suppliers = [], onUpdate }) => {
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedSupToLink, setSelectedSupToLink] = useState(null);
  const [formData, setFormData] = useState({
    supplier_sku: '',
    purchase_price: '',
    min_order_qty: 1,
    lead_time_days: 7,
    is_primary: false
  });

  const loadAvailableSuppliers = useCallback(async () => {
    try {
      const response = await productApi.getAvailableSuppliers(productId);
      setAllSuppliers(response.data || []);
    } catch (err) {
      console.error('Failed to load available suppliers:', err);
    }
  }, [productId]);

  useEffect(() => {
    loadAvailableSuppliers();
  }, [loadAvailableSuppliers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await productApi.addSupplier(productId, {
        ...formData,
        supplier_id: selectedSupToLink._id,
        purchase_price: parseFloat(formData.purchase_price) || 0
      });
      setShowForm(false);
      setSelectedSupToLink(null);
      setFormData({
        supplier_sku: '',
        purchase_price: '',
        min_order_qty: 1,
        lead_time_days: 7,
        is_primary: false
      });
      onUpdate?.();
      loadAvailableSuppliers();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleRemove = async (supplierId) => {
    if (!window.confirm('Xóa liên kết với nhà cung cấp này?')) return;
    try {
      await productApi.removeSupplier(productId, supplierId);
      onUpdate?.();
      loadAvailableSuppliers();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h4 style={{ color: '#2d3748', fontWeight: '600' }}>Nhà cung cấp</h4>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setSelectedSupToLink(null); }}
            style={{
              padding: '0.5rem 1rem',
              background: '#38b2ac',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            + Liên kết NCC
          </button>
        )}
      </div>

      {showForm && !selectedSupToLink && (
        <div style={{ marginBottom: '1.5rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ padding: '1rem', background: '#f7fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
            <h5 style={{ margin: 0, fontWeight: '600', color: '#4a5568' }}>Chọn nhà cung cấp để liên kết</h5>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer' }}>✕ Đóng</button>
          </div>
          
          {allSuppliers.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#edf2f7' }}>
                <tr>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', color: '#4a5568', fontWeight: '600' }}>Mã NCC</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', color: '#4a5568', fontWeight: '600' }}>Tên NCC</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', color: '#4a5568', fontWeight: '600' }}>Liên hệ</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.875rem', color: '#4a5568', fontWeight: '600' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {allSuppliers.map(sup => (
                  <tr key={sup._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{sup.code || sup.supplier_id || '-'}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: '500' }}>{sup.name}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#718096' }}>{sup.contact?.name} - {sup.contact?.phone}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <button
                        onClick={() => setSelectedSupToLink(sup)}
                        style={{ padding: '0.25rem 0.75rem', background: '#3182ce', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' }}
                      >
                        Chọn
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#718096' }}>
              Không có nhà cung cấp nào khả dụng (hoặc tất cả đã được liên kết).
            </div>
          )}
        </div>
      )}

      {showForm && selectedSupToLink && (
        <form onSubmit={handleSubmit} style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem',
          padding: '1.5rem', background: '#f0fff4', borderRadius: '8px',
          marginBottom: '1rem', border: '1px solid #c6f6d5'
        }}>
          <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #c6f6d5', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
            <h5 style={{ margin: 0, color: '#22543d', fontSize: '1rem' }}>Thiết lập liên kết: <span style={{ fontWeight: '700' }}>{selectedSupToLink.name}</span></h5>
            <button type="button" onClick={() => setSelectedSupToLink(null)} style={{ background: 'none', border: 'none', color: '#718096', cursor: 'pointer', fontSize: '0.875rem' }}>← Chọn NCC khác</button>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Mã hàng NCC</label>
            <input type="text" value={formData.supplier_sku} onChange={(e) => setFormData({ ...formData, supplier_sku: e.target.value })} placeholder="SKU bên nhà cung cấp" style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Giá mua *</label>
            <input type="number" value={formData.purchase_price} onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })} placeholder="0" required style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>MOQ (SL tối thiểu)</label>
            <input type="number" value={formData.min_order_qty} onChange={(e) => setFormData({ ...formData, min_order_qty: parseInt(e.target.value) || 1 })} min="1" style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Lead time (ngày)</label>
            <input type="number" value={formData.lead_time_days} onChange={(e) => setFormData({ ...formData, lead_time_days: parseInt(e.target.value) || 0 })} min="0" style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', gridColumn: 'span 2' }}>
            <input type="checkbox" id="is_primary" checked={formData.is_primary} onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })} />
            <label htmlFor="is_primary">Đặt làm Nhà cung cấp chính cho sản phẩm này</label>
          </div>
          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button type="submit" style={{ flex: 1, padding: '0.75rem', background: '#48bb78', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Lưu liên kết</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: '0.75rem', background: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Hủy</button>
          </div>
        </form>
      )}

      {suppliers.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {suppliers.map((sp) => (
            <div key={sp._id} style={{
              padding: '1rem',
              background: '#f0fff4',
              borderRadius: '8px',
              border: '1px solid #c6f6d5',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: '600', fontSize: '1rem' }}>{sp.supplier_id?.name}</span>
                  {sp.is_primary && (
                    <span style={{ padding: '0.125rem 0.5rem', background: '#48bb78', color: 'white', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>
                      PRIMARY
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                  Giá mua: <span style={{ fontWeight: '600', color: '#22543d' }}>{sp.purchase_price?.toLocaleString('vi-VN')} ₫</span>
                  {sp.supplier_sku && <span> | Mã NCC: {sp.supplier_sku}</span>}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                  MOQ: {sp.min_order_qty} | Lead time: {sp.lead_time_days} ngày
                </div>
              </div>
              <button
                onClick={() => handleRemove(sp.supplier_id?._id || sp.supplier_id)}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#fc8181',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
              >
                Xóa
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#718096', background: '#f7fafc', borderRadius: '8px' }}>
          Chưa có nhà cung cấp nào
        </div>
      )}
    </div>
  );
};

export default ProductSuppliers;
