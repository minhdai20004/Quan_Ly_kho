import React, { useState, useEffect } from 'react';
import { productService } from '../../services/productService';

export const Dashboard = () => {
  const [stats, setStats] = useState({ products: 0, totalStock: 0, suppliers: 0, categories: 0 });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const products = await productService.getProducts({ limit: 1 });
      setStats(prev => ({ ...prev, products: products.pagination?.total || 0 }));
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  return (
    <div className="dashboard">
      <h1>Warehouse Management System</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Products</h3>
          <p>{stats.products}</p>
        </div>
        <div className="stat-card">
          <h3>Total Stock</h3>
          <p>{stats.totalStock}</p>
        </div>
        <div className="stat-card">
          <h3>Categories</h3>
          <p>{stats.categories}</p>
        </div>
        <div className="stat-card">
          <h3>Suppliers</h3>
          <p>{stats.suppliers}</p>
        </div>
      </div>
    </div>
  );
};