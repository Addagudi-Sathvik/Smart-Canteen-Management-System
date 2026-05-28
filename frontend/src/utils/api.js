import axios from 'axios';

// Default /api uses Vite dev proxy; full URL works in production builds too
const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Add JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/google');
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  googleLogin: (credential) => api.post('/auth/google', { credential }),
  getMe: () => api.get('/auth/me'),
};

// Menu API
export const menuAPI = {
  getAll: (params) => api.get('/menu', { params }),
  getById: (id) => api.get(`/menu/${id}`),
  create: (data) => api.post('/menu', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/menu/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/menu/${id}`),
  toggleAvailability: (id) => api.patch(`/menu/${id}/toggle`),
};

// Payments API
export const paymentsAPI = {
  createOrder: (orderId) => api.post('/payments/create-order', { orderId }),
  verify: (data) => api.post('/payments/verify', data),
  failed: (orderId) => api.post('/payments/failed', { orderId }),
};

// Orders API
export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  getMyOrders: () => api.get('/orders/my'),
  getActiveOrder: () => api.get('/orders/active'),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  reorder: (id) => api.post(`/orders/${id}/reorder`),
  cancel: (id) => api.patch(`/orders/${id}/cancel`),
  getQr: (id) => api.get(`/orders/${id}/qr`),
  pickupLookup: (data) => api.post('/orders/pickup-lookup', data),
  verifyQr: (data) => api.post('/orders/verify-qr', data),
  verifyPickup: (id, data) => api.post(`/orders/${id}/verify-pickup`, data),
};

// Users API (Admin)
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  updateRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  toggleActive: (id) => api.patch(`/users/${id}/toggle-active`),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getAllOrders: (params) => api.get('/admin/orders', { params }),
  getSystemState: () => api.get('/admin/system'),
  updateSystemState: (data) => api.patch('/admin/system', data),
};

export default api;
