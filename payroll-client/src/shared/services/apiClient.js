import axios from 'axios';
import { API_ENDPOINTS } from './endpoints';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add access token to requests
apiClient.interceptors.request.use(
  (config) => {
    console.log("Axios Request BaseURL:", config.baseURL, "URL:", config.url);
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const selectedCompany = localStorage.getItem('selectedCompany');
    if (selectedCompany) {
      config.headers['x-company-id'] = selectedCompany;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle responses and token refresh or unauthorized state
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if token expired and can be refreshed
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to call refresh token endpoint with cookie + localStorage fallback
        const storedRefreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(
          `${apiClient.defaults.baseURL}${API_ENDPOINTS.USERS.REFRESH}`,
          { refreshToken: storedRefreshToken },
          { 
            withCredentials: true,
            headers: {
              'x-refresh-token': storedRefreshToken || ''
            }
          }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // If refresh fails, clear token and logout
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
