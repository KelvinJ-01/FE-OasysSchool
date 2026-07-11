import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types/entities';

// Peran yang dasarnya boleh mengakses Dasbor Web ini (lihat API Spec v1.1 §2,
// Tabel Ringkasan Endpoint dan Peran, dan PRD Bagian 6). `developer` punya
// Panel Pengembang terpisah dan `parent` eksklusif Aplikasi Mobile (NFR-SEC.5)
// — keduanya SHALL NOT lolos ke sini meski suatu route lupa diberi allowedRoles.
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
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}