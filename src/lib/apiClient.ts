import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorDetail, ApiErrorResponse } from '../types/api';
import type { RefreshTokenRequest, RefreshTokenResponse, LogoutRequest } from '../types/auth';

const AUTH_TOKEN_KEY = 'oasys_access_token';
const REFRESH_TOKEN_KEY = 'oasys_refresh_token';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://api.oasysschool.id/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function getStoredToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setStoredRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function clearStoredRefreshToken(): void {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function clearAllTokens(): void {
  clearStoredToken();
  clearStoredRefreshToken();
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function registerUnauthorizedHandler(handler: UnauthorizedHandler): void {
  onUnauthorized = handler;
}

let isRefreshing = false;
let pendingQueue: {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}[] = [];

function resolveQueue(token: string): void {
  pendingQueue.forEach((p) => p.resolve(token));
  pendingQueue = [];
}

function rejectQueue(err: unknown): void {
  pendingQueue.forEach((p) => p.reject(err));
  pendingQueue = [];
}

async function performRefresh(): Promise<string> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    throw new Error('NO_REFRESH_TOKEN');
  }

  const body: RefreshTokenRequest = { refreshToken, platform: 'web' };
  const { data } = await axios.post<RefreshTokenResponse>(`${BASE_URL}/auth/refresh-token`, body);

  setStoredToken(data.accessToken);
  setStoredRefreshToken(data.refreshToken);
  return data.accessToken;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    const isAuthEndpoint = originalRequest?.url?.includes('/auth/');
    if (status !== 401 || !originalRequest || isAuthEndpoint || originalRequest._retry) {
      if (status === 401 && isAuthEndpoint) {
        clearAllTokens();
        onUnauthorized?.();
      }
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            originalRequest.headers.set('Authorization', `Bearer ${token}`);
            resolve(apiClient(originalRequest));
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      const newAccessToken = await performRefresh();
      resolveQueue(newAccessToken);
      originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
      return apiClient(originalRequest);
    } catch (refreshError) {
      rejectQueue(refreshError);
      clearAllTokens();
      onUnauthorized?.();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// --- Logout (baru — v1.1, API Spec §3.1 POST /auth/logout) -----------------
// Mencabut refreshToken di server. Best-effort: kalau request gagal (mis. offline),
// sesi lokal tetap dibersihkan oleh pemanggil (lihat AuthContext.logout()).
export async function revokeSession(allDevices = false): Promise<void> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return;
  const body: LogoutRequest = { refreshToken, allDevices };
  await apiClient.post('/auth/logout', body);
}

export function getApiErrorCode(error: unknown): string | undefined {
  const axiosError = error as AxiosError<ApiErrorResponse>;
  return axiosError.response?.data?.error?.code;
}

export function getApiErrorMessage(error: unknown, fallback = 'Terjadi kesalahan. Coba lagi.'): string {
  const axiosError = error as AxiosError<ApiErrorResponse>;
  return axiosError.response?.data?.error?.message ?? fallback;
}

export function getApiErrorDetails(error: unknown): ApiErrorDetail[] {
  const axiosError = error as AxiosError<ApiErrorResponse>;
  return axiosError.response?.data?.error?.details ?? [];
}