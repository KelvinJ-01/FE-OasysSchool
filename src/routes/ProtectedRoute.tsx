import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types/entities';

const DASHBOARD_ROLES: UserRole[] = ['administrator', 'teacher'];

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null; // TODO: ganti dengan komponen spinner/skeleton bila sudah ada
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  const effectiveRoles = allowedRoles ?? DASHBOARD_ROLES;

  if (!effectiveRoles.includes(user.role)) {
    return <Navigate to="/signin" replace />;
  }

  return <Outlet />;
}