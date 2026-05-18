import api from '../../shared/utils/api';

export const inventoryApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/inventory?${query}`);
  },

  adjustStock: (data) => api.post('/inventory/adjust', data),

  transfer: (data) => api.post('/inventory/transfer', data),

  getBatches: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/inventory/batches?${query}`);
  },

  createBatch: (data) => api.post('/inventory/batches', data),
};

export { productApi } from '../products/services/productService';
export { warehouseApi } from '../warehouses/services/warehouseService';
export { default as api } from '../../shared/utils/api';