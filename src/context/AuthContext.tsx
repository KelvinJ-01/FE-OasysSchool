import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useToast } from '../hooks/useToast';
import { env } from '../config/env';
import {
  apiClient,
  getApiErrorCode,
  getApiErrorMessage,
  registerUnauthorizedHandler,
  revokeSession,
} from '../lib/apiClient';
import {
  clearAllTokens,
  getAccessToken,
  setAccessToken,
} from '../lib/tokenStorage';
import type { AuthUser, JwtPayload, LoginRequest, LoginResponse } from '../types/auth';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (partial: Partial<AuthUser>) => void;
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
      photoUrl: payload.photoUrl,
      email: payload.email,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const clearLocalSession = useCallback(() => {
    clearAllTokens();
    setUser(null);
  }, []);

  const handleForcedLogout = useCallback(() => {
    clearLocalSession();
    toast.error('Sesi Anda berakhir. Silakan masuk kembali.');
  }, [clearLocalSession, toast]);

  useEffect(() => {
    registerUnauthorizedHandler(handleForcedLogout);
  }, [handleForcedLogout]);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const accessToken = getAccessToken();
      if (accessToken) {
        const decoded = decodeUserFromToken(accessToken);
        if (decoded && !cancelled) {
          setUser(decoded);
          setIsLoading(false);
          return;
        }
      }

      // Refresh token kini cookie httpOnly, sehingga JavaScript TIDAK dapat
      // memeriksa keberadaannya lebih dulu. Satu-satunya cara mengetahui apakah
      // sesi masih hidup adalah mencoba menukarkannya: 401 berarti tidak ada
      // sesi. Justru inilah yang membuat token tersebut aman dari XSS.
      try {
        const { data } = await axios.post<LoginResponse>(
          `${env.apiBaseUrl}/auth/refresh-token`,
          { platform: env.appPlatform },
          { withCredentials: true },
        );
        setAccessToken(data.accessToken);
        const decoded = decodeUserFromToken(data.accessToken);
        if (!cancelled) setUser(decoded);
      } catch {
        if (!cancelled) clearAllTokens();
      }

      if (!cancelled) setIsLoading(false);
    }

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const payload: LoginRequest = { email, password, platform: env.appPlatform };

    try {
      const { data } = await apiClient.post<LoginResponse>('/auth/login', payload);
      // Hanya access token yang dipegang klien; refresh token dipasang backend
      // sebagai cookie httpOnly pada respons ini.
      setAccessToken(data.accessToken);

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
    void revokeSession().catch(() => undefined);
    clearLocalSession();
  }, [clearLocalSession]);

  const updateUser = useCallback((partial: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...partial } : prev));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, isLoading, login, logout, updateUser }),
    [user, isLoading, login, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
