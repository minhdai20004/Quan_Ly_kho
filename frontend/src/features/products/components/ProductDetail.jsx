import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { productApi } from '../../services/inventoryService';

export const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productApi.getById(id).then(res => {
      setProduct(res.data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (!product) return <p>Product not found</p>;

  return (
    <div style={{ padding: '1rem' }}>
      <h2>{product.product_name}</h2>
      <p>Code: {product.product_code}</p>
      <p>SKU: {product.sku}</p>
      <p>Status: {product.status}</p>
    </div>
  );
};