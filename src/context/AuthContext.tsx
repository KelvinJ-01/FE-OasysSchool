import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import {
  apiClient,
  clearStoredToken,
  clearStoredRefreshToken,
  getApiErrorCode,
  getApiErrorMessage,
  getStoredToken,
  registerUnauthorizedHandler,
  revokeSession,
  setStoredToken,
  setStoredRefreshToken,
} from '../lib/apiClient';
import type { AuthUser, JwtPayload, LoginRequest, LoginResponse } from '../types/auth';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
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
      fullName: payload.fullName,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const clearLocalSession = useCallback(() => {
    clearStoredToken();
    clearStoredRefreshToken();
    setUser(null);
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      const decoded = decodeUserFromToken(token);
      if (decoded) {
        setUser(decoded);
      } else {
        clearStoredToken();
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(clearLocalSession);
  }, [clearLocalSession]);

  const login = useCallback(async (email: string, password: string) => {
    const payload: LoginRequest = { email, password, platform: 'web' };

    try {
      const { data } = await apiClient.post<LoginResponse>('/auth/login', payload);
      setStoredToken(data.accessToken);
      setStoredRefreshToken(data.refreshToken);

      const decoded = decodeUserFromToken(data.accessToken);
      setUser(decoded ?? { id: '', role: data.role, schoolId: data.schoolId });
    } catch (err) {
      const code = getApiErrorCode(err);

      if (code === 'ROLE_NOT_ALLOWED_ON_PLATFORM') {
        throw new Error(
          'Akun ini terdaftar sebagai Orang Tua dan hanya dapat digunakan pada Aplikasi Mobile Oasys School. Silakan unduh aplikasinya untuk login.',
        );
      }

      throw new Error(getApiErrorMessage(err, 'Email atau kata sandi salah.'));
    }
  }, []);

  const logout = useCallback(() => {
    revokeSession().catch(() => {
    });
    clearLocalSession();
  }, [clearLocalSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, isLoading, login, logout }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}