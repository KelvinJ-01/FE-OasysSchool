import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorResponse } from '../types/api';

const AUTH_TOKEN_KEY = 'oasys_access_token';

/**
 * Instance axios terpusat. SELURUH pemanggilan API (via React Query) SHALL
 * lewat instance ini, bukan axios langsung — supaya token dan penanganan
 * 401 konsisten di seluruh aplikasi.
 *
 * Set VITE_API_BASE_URL di file .env (lihat .env.example).
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'https://api.oasysschool.id/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Penyimpanan token -------------------------------------------------
// localStorage dipilih karena ini kode aplikasi produksi sesungguhnya
// (berjalan di browser pengguna akhir), bukan pratinjau artifact.

export function getStoredToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

// --- Interceptor: sisipkan token ke setiap request ----------------------

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// --- Interceptor: tangani 401 secara terpusat ---------------------------
// AuthContext mendaftarkan handler-nya sendiri di sini (lihat AuthContext.tsx)
// supaya apiClient.ts tidak perlu tahu apa pun tentang React/Context.

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function registerUnauthorizedHandler(handler: UnauthorizedHandler): void {
  onUnauthorized = handler;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.status === 401) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

/**
 * Helper untuk mengekstrak kode error dari ApiErrorResponse secara aman.
 * Dipakai di form-form (mis. cek 'NISN_NOT_FOUND', 'SCHEDULE_CONFLICT').
 */
export function getApiErrorCode(error: unknown): string | undefined {
  const axiosError = error as AxiosError<ApiErrorResponse>;
  return axiosError.response?.data?.error?.code;
}

export function getApiErrorMessage(error: unknown, fallback = 'Terjadi kesalahan. Coba lagi.'): string {
  const axiosError = error as AxiosError<ApiErrorResponse>;
  return axiosError.response?.data?.error?.message ?? fallback;
}