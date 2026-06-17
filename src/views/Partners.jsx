import { useState, useEffect } from 'react';
import api from '../services/api';

const Partners = () => {
  const [partners, setPartners] = useState([]);
  const [type, setType] = useState('all'); // all | supplier | customer
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPartners = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/partners${type !== 'all' ? `?object_type=${type}` : ''}`);
        setPartners(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPartners();
  }, [type]);

  return (
    <div className="partners-view" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontWeight: 700 }}>🤝 Đối Tác Kinh Doanh</h2>
        <div style={{ display: 'flex', gap: '10px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
          <button onClick={() => setType('all')} style={{ padding: '6px 15px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: type === 'all' ? 'white' : 'transparent', fontWeight: type === 'all' ? 600 : 400, boxShadow: type === 'all' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>Tất cả</button>
          <button onClick={() => setType('supplier')} style={{ padding: '6px 15px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: type === 'supplier' ? 'white' : 'transparent', fontWeight: type === 'supplier' ? 600 : 400, boxShadow: type === 'supplier' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>Nhà cung cấp</button>
          <button onClick={() => setType('customer')} style={{ padding: '6px 15px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: type === 'customer' ? 'white' : 'transparent', fontWeight: type === 'customer' ? 600 : 400, boxShadow: type === 'customer' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>Khách hàng</button>
        </div>
      </div>

      <div className="table-container glass" style={{ background: 'white', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th style={{ padding: '15px', textAlign: 'left' }}>Mã đối tác</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Tên đối tác</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Phân loại</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Liên hệ</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Địa chỉ</th>
              <th style={{ padding: '15px', textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Đang tải...</td></tr> : partners.map(p => (
              <tr key={p._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '15px', fontWeight: 600 }}>{p.partner_code || p.object_code}</td>
                <td style={{ padding: '15px', fontWeight: 500 }}>{p.partner_name || p.object_name}</td>
                <td style={{ padding: '15px' }}>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: '#e0e7ff', color: '#4338ca' }}>
                    {p.partner_type || p.object_type}
                  </span>
                </td>
                <td style={{ padding: '15px', fontSize: '13px' }}>
                  <div>📞 {p.phone || '—'}</div>
                  <div style={{ color: '#64748b' }}>✉️ {p.email || '—'}</div>
                </td>
                <td style={{ padding: '15px', fontSize: '13px', color: '#64748b' }}>{p.address || '—'}</td>
                <td style={{ padding: '15px', textAlign: 'right' }}>
                  <button style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer' }}>Xem hồ sơ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Partners;