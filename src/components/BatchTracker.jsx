import { useState } from 'react';

const BatchTracker = ({ batches = [], onAddBatch }) => {
  const isNearExpiry = (date) => {
    const today = new Date();
    const expiry = new Date(date);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30; // Cảnh báo trước 30 ngày
  };

  return (
    <div className="batch-tracker" style={{ padding: '15px', background: '#f8fafc', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
        <h4 style={{ margin: 0, color: '#1e293b' }}>📦 Quản lý Lô & Hạn sử dụng</h4>
        <button onClick={onAddBatch} style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '6px', background: '#6366f1', color: 'white', border: 'none', cursor: 'pointer' }}>+ Thêm Lô</button>
      </div>

      {batches.length === 0 ? (
        <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center' }}>Chưa có thông tin lô hàng.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {batches.map((b, idx) => {
            const nearExp = isNearExpiry(b.expiry_date);
            const isExp = new Date(b.expiry_date) < new Date();
            
            return (
              <div key={idx} style={{ 
                background: 'white', 
                padding: '12px', 
                borderRadius: '8px', 
                borderLeft: `4px solid ${isExp ? '#ef4444' : (nearExp ? '#f59e0b' : '#10b981')}`,
                boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px' }}>Số Lô: {b.batch_number}</span>
                  <span style={{ fontWeight: 700, color: '#6366f1' }}>SL: {b.quantity}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                  <span>NSX: {new Date(b.manufacture_date).toLocaleDateString('vi-VN')}</span>
                  <span style={{ color: isExp ? '#ef4444' : (nearExp ? '#f59e0b' : 'inherit'), fontWeight: (isExp || nearExp) ? 700 : 400 }}>
                    HSD: {new Date(b.expiry_date).toLocaleDateString('vi-VN')} 
                    {isExp ? ' (Hết hạn)' : (nearExp ? ' (Sắp hết hạn)' : '')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BatchTracker;