import { env } from '../config/env';

/**
 * Access token disimpan HANYA di memori (variabel modul), tidak pernah di
 * sessionStorage/localStorage. Alasannya: apa pun yang tersimpan di web storage
 * dapat dibaca oleh JavaScript apa pun yang berjalan pada origin ini — satu
 * celah XSS dari satu dependensi sudah cukup untuk mencuri token.
 *
 * Persistensi lintas-refresh TIDAK hilang: refresh token disimpan sebagai cookie
 * httpOnly oleh backend, dan AuthProvider memanggil /auth/refresh-token saat
 * aplikasi dibuka untuk memulihkan sesi. Token akses cukup hidup di memori.
 */
let accessTokenInMemory: string | null = null;

export function getAccessToken(): string | null {
  return accessTokenInMemory;
}

export function setAccessToken(token: string): void {
  accessTokenInMemory = token;
}

export function clearAccessToken(): void {
  accessTokenInMemory = null;
}

/**
 * Membersihkan token dari memori sekaligus menghapus sisa token versi lama yang
 * mungkin pernah tersimpan di web storage oleh rilis sebelumnya, agar tidak ada
 * token basah yang tertinggal di perangkat pengguna setelah pembaruan.
 */
export function clearAllTokens(): void {
  clearAccessToken();
  try {
    sessionStorage.removeItem(env.tokenStorageKey);
    localStorage.removeItem(env.tokenStorageKey);
    localStorage.removeItem(env.refreshTokenStorageKey);
  } catch {
    void 0;
  }
}
