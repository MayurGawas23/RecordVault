import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/api` : '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

let accessToken = localStorage.getItem('rv_access_token') || null;

export const setAccessToken = (token) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('rv_access_token', token);
  } else {
    localStorage.removeItem('rv_access_token');
  }
};

export const getAccessToken = () => accessToken;

// Request Interceptor: Attach JWT Access Token
apiClient.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 & Automatic Refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('rv_refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const newAccessToken = res.data.accessToken;
          setAccessToken(newAccessToken);
          if (res.data.refreshToken) {
            localStorage.setItem('rv_refresh_token', res.data.refreshToken);
          }
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        } catch (refreshErr) {
          // Token refresh failed -> Clear session
          setAccessToken(null);
          localStorage.removeItem('rv_refresh_token');
          localStorage.removeItem('rv_user');
          window.location.href = '/login';
          return Promise.reject(refreshErr);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
