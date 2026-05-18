import api from '../../../shared/utils/api';

export const warehouseApi = {
  getAll: () => api.get('/warehouses'),
  getById: (id) => api.get(`/warehouses/${id}`),
  create: (data) => api.post('/warehouses', data),
  update: (id, data) => api.put(`/warehouses/${id}`, data),
  delete: (id) => api.delete(`/warehouses/${id}`),
  getLocations: (id) => api.get(`/warehouses/${id}/locations`),
  createLocation: (id, data) => api.post(`/warehouses/${id}/locations`, data),
};