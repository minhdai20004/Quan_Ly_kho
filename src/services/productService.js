import api from './api';

// ========== PRODUCTS ==========
export const productApi = {
  // Get all products with filters
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/products?${query}`);
  },

  // Get single product with all details
  getById: (productId) => api.get(`/products/${productId}`),

  // Create product
  create: (productData) => api.post('/products', productData),

  // Update product
  update: (productId, productData) => api.put(`/products/${productId}`, productData),

  // Delete product (soft delete)
  delete: (productId) => api.delete(`/products/${productId}`),

  // Get variants
  getVariants: (productId) => api.get(`/products/${productId}/variants`),
  createVariant: (productId, variantData) => api.post(`/products/${productId}/variants`, variantData),

  // Get units
  getUnits: (productId) => api.get(`/products/${productId}/units`),
  createUnit: (productId, unitData) => api.post(`/products/${productId}/units`, unitData),

  // Get prices
  getPrices: (productId) => api.get(`/products/${productId}/prices`),
  createPrice: (productId, priceData) => api.post(`/products/${productId}/prices`, priceData),

   // Get stock
   getStock: (productId) => api.get(`/products/${productId}/stock`),

   // Update stock (inbound/outbound/adjust)
   updateStock: (productId, stockData) => api.post(`/products/${productId}/stock`, stockData),

   // Get batches
   getBatches: (productId) => api.get(`/products/${productId}/batches`),

  // Get suppliers
  getSuppliers: (productId) => api.get(`/products/${productId}/suppliers`),
  getAvailableSuppliers: (productId) => api.get(`/products/${productId}/suppliers/available`),
  addSupplier: (productId, supplierData) => api.post(`/products/${productId}/suppliers`, supplierData),
  removeSupplier: (productId, supplierId) => api.delete(`/products/${productId}/suppliers/${supplierId}`),
};

// ========== CATEGORIES ==========
export const categoryApi = {
  getAll: () => api.get('/categories'),
  getTree: () => api.get('/categories/tree'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// ========== BRANDS ==========
export const brandApi = {
  getAll: () => api.get('/brands'),
  getById: (id) => api.get(`/brands/${id}`),
  create: (data) => api.post('/brands', data),
  update: (id, data) => api.put(`/brands/${id}`, data),
  delete: (id) => api.delete(`/brands/${id}`),
};

// ========== WAREHOUSES ==========
export const warehouseApi = {
  getAll: () => api.get('/warehouses'),
  getById: (id) => api.get(`/warehouses/${id}`),
  getLocations: (warehouseId) => api.get(`/warehouses/${warehouseId}/locations`),
  create: (data) => api.post('/warehouses', data),
  update: (id, data) => api.put(`/warehouses/${id}`, data),
  delete: (id) => api.delete(`/warehouses/${id}`),
  createLocation: (warehouseId, data) => api.post(`/warehouses/${warehouseId}/locations`, data),
};

// ========== INVENTORY ==========
export const inventoryApi = {
  // Get all inventory
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/inventory?${query}`);
  },

  // Adjust stock
  adjustStock: (data) => api.post('/inventory/adjust', data),

  // Transfer stock
  transfer: (data) => api.post('/inventory/transfer', data),

  // Batches
  getBatches: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/inventory/batches?${query}`);
  },
  createBatch: (data) => api.post('/inventory/batches', data),
  adjustBatch: (batchId, data) => api.put(`/inventory/batches/${batchId}/adjust`, data),
};

// ========== SUPPLIERS ==========
export const supplierApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/suppliers${query ? '?' + query : ''}`);
  },
  getById: (id) => api.get(`/suppliers/${id}`),
  getStats: () => api.get('/suppliers/stats'),
  getProducts: (supplierId) => api.get(`/suppliers/${supplierId}/products`),
  addProduct: (supplierId, data) => api.post(`/suppliers/${supplierId}/products`, data),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
};
