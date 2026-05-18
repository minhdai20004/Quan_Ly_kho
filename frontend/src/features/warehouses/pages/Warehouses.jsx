import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { WarehousesList } from '../components/WarehousesList';

export const WarehousesPage = () => {
  return (
    <Routes>
      <Route index element={<WarehousesList />} />
    </Routes>
  );
};