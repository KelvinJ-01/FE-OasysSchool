import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { jwtDecode } from 'jwt-decode';
import { env } from '../config/env';
import type { ApiErrorDetail, ApiErrorResponse } from '../types/api';
import type { JwtPayload, RefreshTokenRequest, RefreshTokenResponse, LogoutRequest } from '../types/auth';
import { clearAllTokens, getAccessToken, setAccessToken } from './tokenStorage';

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

function accessTokenNeedsRefresh(): boolean {
  const token = getAccessToken();
  if (!token) return true;
  try {
    const { exp } = jwtDecode<JwtPayload>(token);
    const expiresAtMs = exp * 1000;
    return expiresAtMs - Date.now() <= env.tokenExpiryBufferMs;
  } catch {
    return true;
  }
}

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const isAuthEndpoint = config.url?.includes('/auth/');

  if (!isAuthEndpoint && getAccessToken() && accessTokenNeedsRefresh()) {
    try {
      await ensureFreshAccessToken();
    } catch {
      void 0;
    }
  }

  const token = getAccessToken();
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

let refreshPromise: Promise<string> | null = null;

async function performRefresh(): Promise<string> {
  const body: RefreshTokenRequest = { platform: env.appPlatform };
  const { data } = await axios.post<RefreshTokenResponse>(
    `${env.apiBaseUrl}/auth/refresh-token`,
    body,
    { withCredentials: true },
  );

  setAccessToken(data.accessToken);
  return data.accessToken;
}

function ensureFreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean; _netRetry?: boolean }) | undefined;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url ?? '';

    if (!error.response && originalRequest && !originalRequest._netRetry) {
      originalRequest._netRetry = true;
      await new Promise((resolve) => setTimeout(resolve, 400));
      return apiClient(originalRequest);
    }

    const isLoginOrLogout = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/logout');
    const isRefreshEndpoint = requestUrl.includes('/auth/refresh-token');

    if (isLoginOrLogout) {
      return Promise.reject(error);
    }

    const errorCode = error.response?.data?.error?.code;

    if (errorCode === 'REFRESH_TOKEN_REUSED') {
      clearAllTokens();
      onUnauthorized?.();
      return Promise.reject(error);
    }

    if (status === 401 && isRefreshEndpoint) {
      clearAllTokens();
      onUnauthorized?.();
      return Promise.reject(error);
    }

    if (status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    try {
      const newAccessToken = await ensureFreshAccessToken();
      originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
      return apiClient(originalRequest);
    } catch (refreshError) {
      clearAllTokens();
      onUnauthorized?.();
      return Promise.reject(refreshError);
    }
  },
);

export async function revokeSession(allDevices = false): Promise<void> {
  const body: LogoutRequest = { allDevices };
  await apiClient.post('/auth/logout', body);
}

export function getApiErrorCode(error: unknown): string | undefined {
  const axiosError = error as AxiosError<ApiErrorResponse>;
  return axiosError.response?.data?.error?.code;
}

export function getApiErrorMessage(error: unknown, fallback = 'Terjadi kesalahan. Coba lagi.'): string {
  const axiosError = error as AxiosError<ApiErrorResponse>;

  const apiMessage = axiosError.response?.data?.error?.message;
  if (apiMessage) return apiMessage;

  if (!axiosError.response) {
    if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
      return 'Server terlalu lama merespons. Periksa koneksi Anda lalu coba lagi.';
    }
    if (axiosError.request) {
      return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda, atau hubungi Tim Pengembang bila masalah berlanjut.';
    }
  }

  if (axiosError.response && axiosError.response.status >= 500) {
    return 'Server sedang bermasalah. Coba beberapa saat lagi atau hubungi Tim Pengembang.';
  }

  return fallback;
}

export function getApiErrorDetails(error: unknown): ApiErrorDetail[] {
  const axiosError = error as AxiosError<ApiErrorResponse>;
  return axiosError.response?.data?.error?.details ?? [];
}
