import { useEffect, type PropsWithChildren } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { AuthStoreProvider, useAuthStore } from '@/store/authStore';
import type { AuthSession, LoginCredentials, RegisterEmployeePayload, RegisterPayload } from '@/types/auth';

interface AuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  role: 'ADMIN' | 'EMPLOYEE' | null;
  isAdmin: boolean;
  isEmployee: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthSession>;
  loginAdmin: (credentials: LoginCredentials) => Promise<AuthSession>;
  loginEmployee: (credentials: LoginCredentials) => Promise<AuthSession>;
  register: (payload: RegisterPayload) => Promise<unknown>;
  registerAdmin: (payload: RegisterPayload) => Promise<unknown>;
  registerEmployee: (payload: RegisterEmployeePayload) => Promise<unknown>;
  logout: () => void;
}

function AuthLifecycleBridge({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const location = useLocation();
  const store = useAuthStore();

  useEffect(() => {
    const handleUnauthorized = () => {
      store.logout();
      toast.error('Your session expired. Please sign in again.');
      void navigate('/auth/admin-login', {
        replace: true,
        state: { from: `${location.pathname}${location.search}` }
      });
    };

    window.addEventListener('trinetra:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('trinetra:unauthorized', handleUnauthorized);
  }, [location.pathname, location.search, navigate, store]);

  return <>{children}</>;
}

export function AuthProvider({ children }: PropsWithChildren) {
  return (
    <AuthStoreProvider>
      <AuthLifecycleBridge>{children}</AuthLifecycleBridge>
    </AuthStoreProvider>
  );
}

export function useAuth(): AuthContextValue {
  const store = useAuthStore();

  return {
    token: store.token,
    role: store.role,
    isAuthenticated: store.isAuthenticated,
    isAdmin: store.isAdmin,
    isEmployee: store.isEmployee,
    login: store.login,
    loginAdmin: store.loginAdmin,
    loginEmployee: store.loginEmployee,
    register: store.registerAdmin,
    registerAdmin: store.registerAdmin,
    registerEmployee: store.registerEmployee,
    logout: store.logout
  };
}
