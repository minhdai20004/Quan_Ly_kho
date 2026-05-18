import api from '../../../shared/utils/api';

export const productApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/products?${query}`);
  },

  getById: (id) => api.get(`/products/${id}`),

  create: (data) => api.post('/products', data),

  update: (id, data) => api.put(`/products/${id}`, data),

  delete: (id) => api.delete(`/products/${id}`),

  getStock: (id) => api.get(`/products/${id}/stock`),

  updateStock: (id, data) => api.post(`/products/${id}/stock`, data),

  getBatches: (id) => api.get(`/products/${id}/batches`),

  getVariants: (id) => api.get(`/products/${id}/variants`),

  createVariant: (id, data) => api.post(`/products/${id}/variants`, data),

  getUnits: (id) => api.get(`/products/${id}/units`),

  createUnit: (id, data) => api.post(`/products/${id}/units`, data),

  getPrices: (id) => api.get(`/products/${id}/prices`),

  createPrice: (id, data) => api.post(`/products/${id}/prices`, data),

  getSuppliers: (id) => api.get(`/products/${id}/suppliers`),

  addSupplier: (id, data) => api.post(`/products/${id}/suppliers`, data),

  removeSupplier: (id, supplierId) => api.delete(`/products/${id}/suppliers/${supplierId}`),

  getAvailableSuppliers: (id) => api.get(`/products/${id}/suppliers/available`),
};