import axios from 'axios';

// Auto-detect environment: use production backend URL or localhost
const baseURL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:8080/api'
    : 'https://skill-sculptor-1.onrender.com/api');

const API = axios.create({
  baseURL,
});

// Attach auth token on every request
API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global 401 handler so that after server restarts (or token expires)
// we clean up stale auth and send the user back to login.
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      // Clear any stale auth data
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');

      // Avoid infinite redirect loops
      const currentPath = window.location.pathname;
      const isAuthRoute =
        currentPath.startsWith('/login') || currentPath.startsWith('/signup');

      if (!isAuthRoute) {
        // Hard redirect so app state resets cleanly
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default API;
