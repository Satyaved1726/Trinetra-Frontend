import axios, { AxiosError, type AxiosResponse } from 'axios';
import API from '@/services/apiClient';

const TOKEN_KEY = 'token';
const API_URL: string =
  (import.meta.env.VITE_API_URL as string) ||
  'https://trinetra-backend-lzk9.onrender.com';

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: unknown
  ) {
    super(message);
  }
}

export const apiClient = API;
apiClient.defaults.timeout = 30000;

export function getStoredToken() {
  return window.localStorage.getItem(TOKEN_KEY) ?? window.localStorage.getItem('trinetra_token');
}

export function setStoredToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem('trinetra_token', token);
}

export function clearStoredToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem('trinetra_token');
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

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    return Promise.reject(toApiError(error));
  }
);

export { API_URL, TOKEN_KEY };
