import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

console.log('🌐 API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('📤 Request:', config.method.toUpperCase(), config.url);
  return config;
});

// Handle responses
api.interceptors.response.use(
  (response) => {
    console.log('📥 Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });
    return Promise.reject(error);
  }
);

export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  checkEmail: (data) => api.post('/auth/check-email', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  verifyCode: (data) => api.post('/auth/verify-code', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getCurrentUser: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout')
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  createUser: (data) => api.post('/admin/users', data),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getLogs: (params) => api.get('/admin/logs', { params })
};

export default api;
