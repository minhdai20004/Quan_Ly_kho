import React, { useState, useEffect } from 'react';
import { warehouseApi } from '../../services/inventoryService';

export const WarehousesList = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    warehouseApi.getAll().then(res => {
      setWarehouses(res.data || []);
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Warehouses</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {warehouses.map(w => (
              <tr key={w._id}>
                <td>{w.name}</td>
                <td>{w.code}</td>
                <td>{w.type}</td>
                <td>{w.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};