import { useState, useEffect } from 'react';
import { productApi } from '../services/productService';

const ProductPriceManager = ({ productId, prices = [], onUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingTiers, setEditingTiers] = useState(false);
  const [formData, setFormData] = useState({
    cost_price: '',
    selling_price: '',
    wholesale_price: '',
    tax_rate: 10,
    tax_included: false
  });
  const [tiers, setTiers] = useState([
    { min_quantity: 1, max_quantity: 9, unit_price: '' },
    { min_quantity: 10, max_quantity: 99, unit_price: '' },
    { min_quantity: 100, max_quantity: 999999, unit_price: '' }
  ]);
  const [customerGroups, setCustomerGroups] = useState([
    { group_name: 'Khách lẻ', price: '', discount_percent: 0 },
    { group_name: 'Đại lý cấp 1', price: '', discount_percent: 10 },
    { group_name: 'Đại lý VIP', price: '', discount_percent: 20 }
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        cost_price: parseFloat(formData.cost_price) || 0,
        selling_price: parseFloat(formData.selling_price) || 0,
        wholesale_price: parseFloat(formData.wholesale_price) || 0,
        price_tiers: tiers.map(t => ({ ...t, unit_price: parseFloat(t.unit_price) || 0 })),
        customer_group_prices: customerGroups.map(g => ({ ...g, price: parseFloat(g.price) || 0, discount_percent: parseFloat(g.discount_percent) || 0 }))
      };
      await productApi.createPrice(productId, payload);
      setShowForm(false);
      setFormData({ cost_price: '', selling_price: '', wholesale_price: '', tax_rate: 10, tax_included: false });
      onUpdate?.();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const currentPrice = prices[0];

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h4 style={{ color: '#2d3748', fontWeight: '600' }}>Bảng giá</h4>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '0.5rem 1rem',
            background: '#48bb78',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          {currentPrice ? 'Cập nhật giá' : '+ Thêm bảng giá'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{
          padding: '1.5rem',
          background: '#f7fafc',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          border: '1px solid #e2e8f0'
        }}>
          <h5 style={{ marginBottom: '1rem', color: '#2d3748' }}>Giá cơ bản</h5>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: '#4a5568' }}>Giá vốn (NHẬP)</label>
              <input
                type="number"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                placeholder="0"
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: '#4a5568' }}>Giá bán lẻ</label>
              <input
                type="number"
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                placeholder="0"
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: '#4a5568' }}>Giá sỉ</label>
              <input
                type="number"
                value={formData.wholesale_price}
                onChange={(e) => setFormData({ ...formData, wholesale_price: e.target.value })}
                placeholder="0"
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="number"
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                min="0"
                max="100"
                style={{ width: '80px', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
              />
              <span>% Thuế VAT</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="tax_included"
                checked={formData.tax_included}
                onChange={(e) => setFormData({ ...formData, tax_included: e.target.checked })}
              />
              <label htmlFor="tax_included">Giá đã gồm VAT</label>
            </div>
          </div>

          <h5 style={{ margin: '1.5rem 0 1rem', color: '#2d3748' }}>Bảng giá theo số lượng</h5>
          <div style={{ marginBottom: '1rem' }}>
            {tiers.map((tier, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                <span style={{ width: '150px', fontSize: '0.875rem', color: '#4a5568' }}>
                  {tier.min_quantity} - {tier.max_quantity === 999999 ? '∞' : tier.max_quantity} cái
                </span>
                <input
                  type="number"
                  value={tier.unit_price}
                  onChange={(e) => {
                    const newTiers = [...tiers];
                    newTiers[idx].unit_price = e.target.value;
                    setTiers(newTiers);
                  }}
                  placeholder="Đơn giá"
                  style={{ flex: 1, padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                />
              </div>
            ))}
          </div>

          <h5 style={{ margin: '1.5rem 0 1rem', color: '#2d3748' }}>Giá theo nhóm khách hàng</h5>
          <div style={{ marginBottom: '1.5rem' }}>
            {customerGroups.map((group, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                <span style={{ width: '150px', fontSize: '0.875rem', color: '#4a5568' }}>{group.group_name}</span>
                <input
                  type="number"
                  value={group.price}
                  onChange={(e) => {
                    const newGroups = [...customerGroups];
                    newGroups[idx].price = e.target.value;
                    setCustomerGroups(newGroups);
                  }}
                  placeholder="Giá"
                  style={{ flex: 1, padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '120px' }}>
                  <input
                    type="number"
                    value={group.discount_percent}
                    onChange={(e) => {
                      const newGroups = [...customerGroups];
                      newGroups[idx].discount_percent = e.target.value;
                      setCustomerGroups(newGroups);
                    }}
                    min="0"
                    max="100"
                    placeholder="%"
                    style={{ width: '60px', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                  />
                  <span>%</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" style={{ flex: 1, padding: '0.75rem', background: '#48bb78', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
              Lưu bảng giá
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: '0.75rem', background: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* Current Price Display */}
      {currentPrice && !showForm && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          padding: '1.5rem',
          background: 'linear-gradient(135deg, #f0fff4, #c6f6d5)',
          borderRadius: '8px',
          border: '1px solid #9ae6b4'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#718096', marginBottom: '0.25rem' }}>Giá vốn</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#22543d' }}>
              {currentPrice.cost_price?.toLocaleString('vi-VN')} ₫
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#718096', marginBottom: '0.25rem' }}>Giá bán lẻ</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#2b6cb0' }}>
              {currentPrice.selling_price?.toLocaleString('vi-VN')} ₫
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#718096', marginBottom: '0.25rem' }}>Giá sỉ</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#744210' }}>
              {currentPrice.wholesale_price?.toLocaleString('vi-VN')} ₫
            </div>
          </div>
          {currentPrice.tax_rate > 0 && (
            <div style={{ gridColumn: 'span 3', paddingTop: '0.5rem', borderTop: '1px solid #9ae6b4' }}>
              <span style={{ fontSize: '0.875rem', color: '#4a5568' }}>
                Thuế VAT: {currentPrice.tax_rate}% {currentPrice.tax_included ? '(đã bao gồm)' : '(chưa bao gồm)'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Price Tiers Preview */}
      {currentPrice?.price_tiers?.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <h5 style={{ color: '#2d3748', marginBottom: '0.75rem' }}>Bảng giá theo số lượng</h5>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {currentPrice.price_tiers.map((tier, idx) => (
              <div key={idx} style={{
                padding: '0.75rem 1rem',
                background: '#ebf8ff',
                borderRadius: '6px',
                border: '1px solid #bee3f8',
                textAlign: 'center',
                minWidth: '140px'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#718096', marginBottom: '0.25rem' }}>
                  {tier.min_quantity}+
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#2b6cb0' }}>
                  {tier.unit_price?.toLocaleString('vi-VN')} ₫
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customer Groups Preview */}
      {currentPrice?.customer_group_prices?.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h5 style={{ color: '#2d3748', marginBottom: '0.75rem' }}>Giá theo nhóm khách hàng</h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {currentPrice.customer_group_prices.map((group, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                background: '#fffaf0',
                borderRadius: '6px',
                border: '1px solid #feebc8'
              }}>
                <span style={{ fontWeight: '500' }}>{group.group_name}</span>
                <span style={{ fontWeight: '700', color: '#c05621' }}>
                  {group.price?.toLocaleString('vi-VN')} ₫
                  {group.discount_percent > 0 && <span style={{ fontSize: '0.875rem', color: '#718096', marginLeft: '0.5rem' }}>
                    (-{group.discount_percent}%)
                  </span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPriceManager;
