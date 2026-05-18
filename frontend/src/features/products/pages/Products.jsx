import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProductsList } from '../components/ProductList';
import { ProductDetail } from '../components/ProductDetail';

export const ProductsPage = () => {
  return (
    <Routes>
      <Route index element={<ProductsList />} />
      <Route path=":id" element={<ProductDetail />} />
    </Routes>
  );
};