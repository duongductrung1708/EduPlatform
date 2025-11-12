import axios from 'axios';
import { clearAuth, isAuthenticated } from '../utils/auth';

export const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Don't handle 401 for public auth endpoints (login, register, etc.)
    const isPublicAuthEndpoint = originalRequest?.url?.includes('/api/auth/login') ||
                                 originalRequest?.url?.includes('/api/auth/register') ||
                                 originalRequest?.url?.includes('/api/auth/forgot-password') ||
                                 originalRequest?.url?.includes('/api/auth/reset-password') ||
                                 originalRequest?.url?.includes('/api/auth/verify-otp') ||
                                 originalRequest?.url?.includes('/api/auth/resend-otp');

    if (error.response?.status === 401 && !originalRequest._retry && !isPublicAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        } else {
          // No refresh token, clear everything and redirect
          clearAuth();
          // Only redirect if not already on login page
          if (!window.location.pathname.includes('/auth/login')) {
            window.location.href = '/auth/login';
          }
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        clearAuth();
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/auth/login')) {
          window.location.href = '/auth/login';
        }
      }
    }

    return Promise.reject(error);
  }
);
