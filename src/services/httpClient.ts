import axios, { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';

const TOKEN_KEY = 'trinetra_token';
const API_URL: string =
  (import.meta.env.VITE_API_URL as string) ||
  'https://trinetra-backend-lzk9.onrender.com/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: unknown
  ) {
    super(message);
  }
}

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000
});

export function getStoredToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

function mapStatusMessage(status?: number) {
  if (status === 400) return 'Invalid request. Please review your input.';
  if (status === 401) return 'Your session has expired. Please log in again.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'The requested resource was not found.';
  if (status === 413) return 'One or more files exceed the maximum upload size.';
  if (status === 422) return 'Some fields are invalid. Please correct and retry.';
  if (status && status >= 500) return 'Server is currently unavailable. Please try again shortly.';
  return 'Request failed.';
}

export function toApiError(error: unknown) {
  if (error instanceof ApiError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as { message?: string; error?: string } | undefined;
    const message =
      responseData?.message ??
      responseData?.error ??
      (error.code === AxiosError.ERR_NETWORK ? 'Network error. Check your internet connection.' : undefined) ??
      mapStatusMessage(error.response?.status) ??
      error.message;

    return new ApiError(message, error.response?.status, error.response?.data);
  }

  if (error instanceof Error) {
    return new ApiError(error.message);
  }

  return new ApiError('Unexpected error.');
}

export async function requestWithFallback<T>(requests: Array<() => Promise<AxiosResponse<T>>>) {
  let lastError: unknown;

  for (const request of requests) {
    try {
      const response = await request();
      return response.data;
    } catch (error) {
      lastError = error;
      const parsed = toApiError(error);
      if (parsed.status && ![404, 405].includes(parsed.status)) {
        // Avoid falling through on permission/server errors; report immediately.
        throw parsed;
      }
    }
  }

  throw toApiError(lastError);
}

apiClient.interceptors.request.use((config) => {
  const headers = AxiosHeaders.from(config.headers);
  const url = config.url ?? '';
  const skipAuth = [
    '/auth/admin/login',
    '/auth/employee/login',
    '/auth/login',
    '/auth/register',
    '/auth/employee/register'
  ].some((path) => url.includes(path));

  if (!skipAuth) {
    const token = getStoredToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  config.headers = headers;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearStoredToken();
      window.dispatchEvent(new CustomEvent('trinetra:unauthorized'));
    }

    return Promise.reject(toApiError(error));
  }
);

export { API_URL, TOKEN_KEY };
