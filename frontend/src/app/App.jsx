import React from 'react';
import { Link, Outlet } from 'react-router-dom';

export const App = () => {
  return (
    <div>
      <nav style={{ padding: '1rem', background: '#f5f5f5' }}>
        <Link to="/dashboard" style={{ marginRight: '1rem' }}>Dashboard</Link>
        <Link to="/products" style={{ marginRight: '1rem' }}>Products</Link>
        <Link to="/inventory" style={{ marginRight: '1rem' }}>Inventory</Link>
        <Link to="/warehouses">Warehouses</Link>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
};