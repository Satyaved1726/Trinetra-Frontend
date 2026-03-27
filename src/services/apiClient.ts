import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string) ||
  'https://trinetra-backend-lzk9.onrender.com';

const TOKEN_KEYS = ['token', 'trinetra_token'] as const;

function getToken() {
  for (const key of TOKEN_KEYS) {
    const token = window.localStorage.getItem(key);
    if (token) {
      return token;
    }
  }

  return null;
}

function clearToken() {
  for (const key of TOKEN_KEYS) {
    window.localStorage.removeItem(key);
  }
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
    delete axios.defaults.headers.common.Authorization;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearToken();
      window.dispatchEvent(new CustomEvent('trinetra:unauthorized'));

      if (!window.location.pathname.startsWith('/auth/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
