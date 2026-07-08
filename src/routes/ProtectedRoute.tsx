import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types/entities';

interface ProtectedRouteProps {
  /**
   * Jika diisi, hanya role yang ada di daftar ini yang boleh mengakses.
   * Jika kosong/undefined, cukup butuh login (peran apa pun boleh masuk).
   *
   * Contoh pemakaian di App.tsx:
   *   <Route element={<ProtectedRoute allowedRoles={['administrator']} />}>
   *     <Route path="/students" element={<StudentsList />} />
   *   </Route>
   */
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Tunggu proses restorasi sesi selesai (lihat AuthContext) sebelum memutuskan
  // redirect — kalau tidak, refresh halaman akan selalu melempar ke /signin
  // sesaat sebelum token sempat divalidasi.
  if (isLoading) {
    return null; // TODO: ganti dengan komponen spinner/skeleton bila sudah ada
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Catatan penting (BR-1.6/NFR-SEC.5): akun role 'parent' seharusnya TIDAK
  // PERNAH sampai ke titik ini, karena backend sudah menolak login mereka di
  // Dasbor Web (kode ROLE_NOT_ALLOWED_ON_PLATFORM). Guard di bawah ini
  // adalah lapisan pertahanan kedua di sisi UI, bukan yang utama.
  if (user.role === 'parent') {
    return <Navigate to="/signin" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Login sah, tapi bukan peran yang diizinkan untuk rute ini
    // (mis. Guru mencoba akses halaman khusus Administrator).
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}