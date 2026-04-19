import axios from 'axios';
import { installMockApi } from './mockApi';

const DEMO_MODE = !process.env.REACT_APP_USE_BACKEND;

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  headers: { 'Content-Type': 'application/json' },
});

if (DEMO_MODE) {
  // Use local mock data — no backend needed
  installMockApi(api);
} else {
  // Attach token to every request
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Redirect to login on 401
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
}

export default api;
