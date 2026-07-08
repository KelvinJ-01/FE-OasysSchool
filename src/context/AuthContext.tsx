import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import {
  apiClient,
  clearStoredToken,
  getApiErrorCode,
  getApiErrorMessage,
  getStoredToken,
  registerUnauthorizedHandler,
  setStoredToken,
} from '../lib/apiClient';
import type { AuthUser, JwtPayload, LoginRequest, LoginResponse } from '../types/auth';

interface AuthContextValue {
  /** null jika belum login atau sesi kedaluwarsa. */
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** true selama proses restorasi sesi dari localStorage saat aplikasi pertama kali dimuat. */
  isLoading: boolean;
  /**
   * Login khusus untuk Administrator/Guru dari Dasbor Web.
   * SELALU mengirim platform: "web" — lihat NFR-SEC.5 (FSD) dan BR-1.6.
   * Melempar Error dengan pesan siap-tampil jika gagal, termasuk kasus
   * akun Orang Tua yang salah tempat login (kode ROLE_NOT_ALLOWED_ON_PLATFORM).
   */
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function decodeUserFromToken(token: string): AuthUser | null {
  try {
    const payload = jwtDecode<JwtPayload>(token);
    const isExpired = payload.exp * 1000 < Date.now();
    if (isExpired) return null;

    return {
      id: payload.sub,
      role: payload.role,
      schoolId: payload.schoolId,
    };
  } catch {
    // Token rusak/tidak bisa di-decode — perlakukan sebagai tidak login.
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    clearStoredToken();
    setUser(null);
  }, []);

  // Restorasi sesi saat aplikasi pertama kali dimuat (refresh halaman, dsb).
  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      const decoded = decodeUserFromToken(token);
      if (decoded) {
        setUser(decoded);
      } else {
        // Token ada tapi sudah kedaluwarsa/rusak — bersihkan supaya tidak nyangkut.
        clearStoredToken();
      }
    }
    setIsLoading(false);
  }, []);

  // Daftarkan diri sebagai handler 401 terpusat dari apiClient (lihat lib/apiClient.ts).
  // Dengan ini, response 401 dari endpoint MANAPUN otomatis men-logout user,
  // tanpa setiap halaman perlu menangani sendiri.
  useEffect(() => {
    registerUnauthorizedHandler(logout);
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const payload: LoginRequest = { email, password, platform: 'web' };

    try {
      const { data } = await apiClient.post<LoginResponse>('/auth/login', payload);
      setStoredToken(data.accessToken);

      const decoded = decodeUserFromToken(data.accessToken);
      // Fallback ke data dari body response kalau decode gagal karena alasan
      // apa pun — tetap prioritaskan hasil decode karena itu sumber kebenaran.
      setUser(decoded ?? { id: '', role: data.role, schoolId: data.schoolId });
    } catch (err) {
      const code = getApiErrorCode(err);

      // Kasus spesifik BR-1.6: akun Orang Tua mencoba login di Dasbor Web.
      // Pesan ini SHALL mengarahkan ke Aplikasi Mobile, bukan pesan generik
      // "kredensial salah" — lihat FSD ERR-1.3.
      if (code === 'ROLE_NOT_ALLOWED_ON_PLATFORM') {
        throw new Error(
          'Akun ini terdaftar sebagai Orang Tua dan hanya dapat digunakan pada Aplikasi Mobile Oasys School. Silakan unduh aplikasinya untuk login.',
        );
      }

      throw new Error(getApiErrorMessage(err, 'Email atau kata sandi salah.'));
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, isLoading, login, logout }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}