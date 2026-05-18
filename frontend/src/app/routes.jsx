import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { App } from './App';
import { Dashboard } from '../features/dashboard';
import { ProductsPage } from '../features/products/pages/Products';
import { InventoryPage } from '../features/inventory/pages/Inventory';
import { WarehousesPage } from '../features/warehouses/pages/Warehouses';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products/*" element={<ProductsPage />} />
        <Route path="inventory/*" element={<InventoryPage />} />
        <Route path="warehouses/*" element={<WarehousesPage />} />
      </Route>
    </Routes>
  );
};