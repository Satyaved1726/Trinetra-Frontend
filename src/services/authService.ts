import { apiClient, requestWithFallback } from '@/services/httpClient';
import type {
  AuthResponse,
  AuthSession,
  AuthUser,
  LoginCredentials,
  RegisterEmployeePayload,
  RegisterPayload,
  UserRole
} from '@/types/auth';

function parseJwtClaims(token: string) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(normalized);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function inferRole(response: AuthResponse, token: string, fallback: UserRole): UserRole {
  if (response.role) {
    return response.role;
  }

  const claims = parseJwtClaims(token);
  const claimRole =
    (claims?.role as string | undefined) ??
    (claims?.roles as string | undefined) ??
    (claims?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] as string | undefined);

  if (claimRole) {
    if (/admin/i.test(claimRole)) return 'ADMIN';
    if (/employee|user/i.test(claimRole)) return 'EMPLOYEE';
  }

  return fallback;
}

export function extractToken(response: AuthResponse) {
  return response.token ?? response.jwt ?? response.accessToken ?? null;
}

function toSession(response: AuthResponse, fallbackRole: UserRole) {
  const token = extractToken(response);
  if (!token) {
    throw new Error('Login succeeded but no token was returned by the server.');
  }

  const role = inferRole(response, token, fallbackRole);
  const user: AuthUser = {
    id: response.user?.id,
    name: response.user?.name,
    email: response.user?.email ?? '',
    role
  };

  const session: AuthSession = { token, user };
  return session;
}

export const authService = {
  async loginAdmin(payload: LoginCredentials) {
    const response = await requestWithFallback<AuthResponse>([
      () => apiClient.post('/api/auth/login', payload),
      () => apiClient.post('/auth/admin/login', payload),
      () => apiClient.post('/auth/login', payload)
    ]);

    return toSession(response, 'ADMIN');
  },

  async loginEmployee(payload: LoginCredentials) {
    const response = await requestWithFallback<AuthResponse>([
      () => apiClient.post('/api/auth/login', payload),
      () => apiClient.post('/auth/employee/login', payload),
      () => apiClient.post('/auth/login', payload)
    ]);

    return toSession(response, 'EMPLOYEE');
  },

  async registerAdmin(payload: RegisterPayload) {
    return requestWithFallback([
      () => apiClient.post('/api/auth/register', payload),
      () => apiClient.post('/auth/register', payload)
    ]);
  },

  async registerEmployee(payload: RegisterEmployeePayload) {
    return requestWithFallback([
      () => apiClient.post('/api/auth/register', payload),
      () => apiClient.post('/auth/employee/register', payload),
      () => apiClient.post('/auth/register', payload)
    ]);
  }
};
