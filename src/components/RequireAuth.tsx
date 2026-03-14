import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/auth';

interface RequireAuthProps {
  children?: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    const nextLogin = location.pathname.startsWith('/employee') ? '/auth/employee-login' : '/auth/admin-login';
    return <Navigate to={nextLogin} replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    const redirectTarget = role === 'EMPLOYEE' ? '/employee/dashboard' : '/admin/dashboard';
    return <Navigate to={redirectTarget} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
