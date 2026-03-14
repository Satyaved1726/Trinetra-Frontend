export interface LoginCredentials {
  email: string;
  password: string;
}

export type UserRole = 'ADMIN' | 'EMPLOYEE';

export interface AuthUser {
  id?: string;
  name?: string;
  email: string;
  role: UserRole;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface RegisterEmployeePayload extends RegisterPayload {
  department?: string;
}

export interface AuthResponse {
  token?: string;
  jwt?: string;
  accessToken?: string;
  role?: UserRole;
  user?: Partial<AuthUser>;
}