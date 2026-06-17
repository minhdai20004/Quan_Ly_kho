import { useState, useEffect } from 'react';
import api from '../services/api';

const OutboundIssues = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const res = await api.get('/outbound-issues');
        setIssues(res.data.data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchIssues();
  }, []);

  const getStatusStyle = (status) => {
    switch(status) {
      case 'completed': return { bg: '#e0f2fe', text: '#0369a1', label: 'Đã xuất' };
      case 'draft': return { bg: '#f1f5f9', text: '#475569', label: 'Chờ duyệt' };
      case 'cancelled': return { bg: '#fee2e2', text: '#991b1b', label: 'Đã hủy' };
      default: return { bg: '#fef9c3', text: '#854d0e', label: status };
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>📤 Danh sách Phiếu Xuất</h2>
        <button style={{ padding: '10px 20px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>+ Tạo Phiếu Xuất</button>
      </div>

      <div className="table-container glass" style={{ background: 'white', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th style={{ padding: '15px', textAlign: 'left' }}>Mã phiếu</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Ngày xuất</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Khách hàng</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Kho xuất</th>
              <th style={{ padding: '15px', textAlign: 'right' }}>Tổng tiền</th>
              <th style={{ padding: '15px', textAlign: 'center' }}>Trạng thái</th>
              <th style={{ padding: '15px', textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Đang tải...</td></tr> : issues.map(i => {
              const style = getStatusStyle(i.status);
              return (
                <tr key={i._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '15px', fontWeight: 700, color: '#f59e0b' }}>{i.issue_code}</td>
                  <td style={{ padding: '15px' }}>{new Date(i.created_at).toLocaleDateString('vi-VN')}</td>
                  <td style={{ padding: '15px' }}>{i.customer_id?.partner_name || i.partner_id?.partner_name || 'Khách lẻ'}</td>
                  <td style={{ padding: '15px' }}>{i.warehouse_id?.warehouse_name}</td>
                  <td style={{ padding: '15px', textAlign: 'right', fontWeight: 600 }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(i.total_amount || 0)}</td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', background: style.bg, color: style.text, fontWeight: 600 }}>
                      {style.label}
                    </span>
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <button style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>Xem</button>
                  </td>
                </tr>
              );
            })}
            {!loading && issues.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Chưa có phiếu xuất nào</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OutboundIssues;