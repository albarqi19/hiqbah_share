import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// ── Request Interceptor ──
client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const lang = localStorage.getItem('language') || 'ar';
    config.headers['Accept-Language'] = lang;

    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor ──
client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    // Log errors in development for debugging
    if (import.meta.env.DEV && error.response) {
      console.error(`API Error ${error.response.status}:`, error.response.data);
    }
    return Promise.reject(error);
  },
);

export default client;
