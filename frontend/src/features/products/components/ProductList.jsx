import React, { useState, useEffect } from 'react';
import { productApi } from '../../services/inventoryService';

export const ProductsList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productApi.getAll({ limit: 50 }).then(res => {
      setProducts(res.data || []);
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Products</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p._id}>
                <td>{p.product_name}</td>
                <td>{p.product_code}</td>
                <td>{p.stocks?.reduce((s, x) => s + (x.quantity_on_hand || 0), 0) || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};