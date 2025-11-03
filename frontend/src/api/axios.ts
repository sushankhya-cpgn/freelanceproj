import axios from "axios";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Inject Authorization header if token exists
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && !config.headers?.Authorization) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle errors globally
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network Error:', error.message);
      // Don't show toast here - let individual components handle it
      return Promise.reject(error);
    }

    // Log HTTP errors but don't show toast (components will handle it)
    const status = error.response?.status;
    console.error('API Error:', status, error.response.data);

    // If unauthorized, clear local auth and redirect to login
    if (status === 401) {
      try {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('sessionData');
      } catch {}
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
