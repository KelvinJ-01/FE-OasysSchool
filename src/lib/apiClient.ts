import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { jwtDecode } from 'jwt-decode';
import { env } from '../config/env';
import type { ApiErrorDetail, ApiErrorResponse } from '../types/api';
import type { JwtPayload, RefreshTokenRequest, RefreshTokenResponse, LogoutRequest } from '../types/auth';
import {
  clearAllTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from './tokenStorage';

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
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

  if (!isAuthEndpoint && getRefreshToken() && accessTokenNeedsRefresh()) {
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
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('NO_REFRESH_TOKEN');
  }

  const body: RefreshTokenRequest = { refreshToken, platform: env.appPlatform };
  const { data } = await axios.post<RefreshTokenResponse>(`${env.apiBaseUrl}/auth/refresh-token`, body);

  setAccessToken(data.accessToken);
  setRefreshToken(data.refreshToken);
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
  const refreshToken = getRefreshToken();
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
