import { useState, useEffect } from 'react';
import { productApi } from '../services/productService';

const ProductStockManager = ({ productId, stocks = [], onUpdate }) => {
  const [warehouses, setWarehouses] = useState([]);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferData, setTransferData] = useState({
    from_warehouse: '',
    from_location: '',
    to_warehouse: '',
    to_location: '',
    quantity: ''
  });

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      const response = await productApi.getWarehouses();
      setWarehouses(response.data || []);
    } catch (err) {
      console.error('Failed to load warehouses:', err);
    }
  };

  const handleAdjustment = async (type, stockId, currentQty) => {
    const qty = prompt(type === 'in' ? 'Nhập số lượng thêm:' : 'Nhập số lượng cần xuất:', '1');
    if (!qty) return;

    try {
      await productApi.adjustStock({
        product_id: productId,
        warehouse_id: stocks.find(s => s._id === stockId)?.warehouse_id?._id,
        location_id: stocks.find(s => s._id === stockId)?.location_id?._id,
        adjustment_type: type,
        quantity: parseInt(qty),
        reason: type === 'in' ? 'receipt' : 'shipment'
      });
      onUpdate?.();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      await productApi.transfer({
        items: [{
          product_id: productId,
          from_warehouse: transferData.from_warehouse,
          from_location: transferData.from_location,
          to_warehouse: transferData.to_warehouse,
          to_location: transferData.to_location,
          quantity: parseInt(transferData.quantity)
        }]
      });
      setShowTransfer(false);
      setTransferData({ from_warehouse: '', from_location: '', to_warehouse: '', to_location: '', quantity: '' });
      onUpdate?.();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const totalOnHand = stocks.reduce((sum, s) => sum + s.quantity_on_hand, 0);
  const totalAvailable = stocks.reduce((sum, s) => sum + s.quantity_available, 0);
  const totalReserved = stocks.reduce((sum, s) => sum + s.quantity_reserved, 0);

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h4 style={{ color: '#2d3748', fontWeight: '600' }}>Tồn kho đa kho</h4>
        <button
          onClick={() => setShowTransfer(!showTransfer)}
          disabled={stocks.length < 2}
          style={{
            padding: '0.5rem 1rem',
            background: stocks.length >= 2 ? '#ed8936' : '#cbd5e0',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: stocks.length >= 2 ? 'pointer' : 'not-allowed',
            fontSize: '0.875rem'
          }}
        >
          Chuyển kho
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem', background: '#f0fff4', borderRadius: '8px', border: '1px solid #9ae6b4' }}>
          <div style={{ fontSize: '0.875rem', color: '#718096' }}>Tổng tồn</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#22543d' }}>{totalOnHand}</div>
        </div>
        <div style={{ padding: '1rem', background: '#fffaf0', borderRadius: '8px', border: '1px solid #feebc8' }}>
          <div style={{ fontSize: '0.875rem', color: '#718096' }}>Có thể bán</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#744210' }}>{totalAvailable}</div>
        </div>
        <div style={{ padding: '1rem', background: '#fff5f5', borderRadius: '8px', border: '1px solid #fed7d7' }}>
          <div style={{ fontSize: '0.875rem', color: '#718096' }}>Đã đặt</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#c53030' }}>{totalReserved}</div>
        </div>
      </div>

      {/* Transfer Form */}
      {showTransfer && (
        <form onSubmit={handleTransfer} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
          padding: '1.5rem',
          background: '#fffaf0',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          border: '2px solid #ed8936'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Từ kho</label>
            <select
              value={transferData.from_warehouse}
              onChange={(e) => setTransferData({ ...transferData, from_warehouse: e.target.value, from_location: '' })}
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
            >
              <option value="">Chọn kho</option>
              {warehouses.map(wh => (
                <option key={wh._id} value={wh._id}>{wh.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Từ vị trí</label>
            <select
              value={transferData.from_location}
              onChange={(e) => setTransferData({ ...transferData, from_location: e.target.value })}
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
            >
              <option value="">Chọn vị trí</option>
              {stocks
                .filter(s => s.warehouse_id?._id === transferData.from_warehouse)
                .map(s => (
                  <option key={s._id} value={s.location_id?._id}>{s.location_id?.code || 'Không xác định'}</option>
                ))
              }
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Đến kho</label>
            <select
              value={transferData.to_warehouse}
              onChange={(e) => setTransferData({ ...transferData, to_warehouse: e.target.value, to_location: '' })}
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
            >
              <option value="">Chọn kho</option>
              {warehouses.filter(wh => wh._id !== transferData.from_warehouse).map(wh => (
                <option key={wh._id} value={wh._id}>{wh.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Số lượng</label>
            <input
              type="number"
              value={transferData.quantity}
              onChange={(e) => setTransferData({ ...transferData, quantity: e.target.value })}
              required
              min="1"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
            />
          </div>
          <div style={{ gridColumn: 'span 4', display: 'flex', gap: '0.5rem' }}>
            <button type="submit" style={{ flex: 1, padding: '0.75rem', background: '#ed8936', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
              Thực hiện chuyển
            </button>
            <button type="button" onClick={() => setShowTransfer(false)} style={{ flex: 1, padding: '0.75rem', background: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* Stock Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ background: '#fed7d2' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Kho</th>
            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Vị trí</th>
            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Tồn thực</th>
            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Đã đặt</th>
            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Có sẵn</th>
            <th style={{ padding: '0.75rem', textAlign: 'center' }}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock) => (
            <tr key={stock._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '0.75rem' }}>
                <div style={{ fontWeight: '500' }}>{stock.warehouse_id?.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#718096' }}>{stock.warehouse_id?.code}</div>
              </td>
              <td style={{ padding: '0.75rem' }}>
                <div>{stock.location_id?.code || 'Chưa định vị'}</div>
                <div style={{ fontSize: '0.75rem', color: '#718096' }}>
                  {stock.location_id?.aisle}-{stock.location_id?.rack}-{stock.location_id?.bin}
                </div>
              </td>
              <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>
                {stock.quantity_on_hand}
              </td>
              <td style={{ padding: '0.75rem', textAlign: 'right', color: '#e53e3e' }}>
                {stock.quantity_reserved}
              </td>
              <td style={{ padding: '0.75rem', textAlign: 'right', color: '#38a169', fontWeight: '600' }}>
                {stock.quantity_available}
              </td>
              <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                  <button
                    onClick={() => handleAdjustment('in', stock._id, stock.quantity_on_hand)}
                    title="Nhập kho"
                    style={{ padding: '0.25rem 0.5rem', border: '1px solid #48bb78', borderRadius: '4px', background: '#c6f6d5', color: '#22543d', cursor: 'pointer', fontSize: '0.75rem' }}
                  >
                    + Nhập
                  </button>
                  <button
                    onClick={() => handleAdjustment('out', stock._id, stock.quantity_on_hand)}
                    title="Xuất kho"
                    style={{ padding: '0.25rem 0.5rem', border: '1px solid #fc8181', borderRadius: '4px', background: '#fed7d7', color: '#742a2a', cursor: 'pointer', fontSize: '0.75rem' }}
                  >
                    - Xuất
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductStockManager;
