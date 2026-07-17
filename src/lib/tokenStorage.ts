import { env } from '../config/env';

/**
 * Penyimpanan token sesi.
 *
 * Pembagian tanggung jawab:
 *
 *  - Access token: memori, dengan cadangan sessionStorage agar sesi bertahan
 *    saat tab dimuat ulang. Umurnya pendek (1 jam) dan ikut hilang saat tab
 *    ditutup, sehingga paparannya terbatas.
 *
 *  - Refresh token: TIDAK LAGI disimpan di sini. Sejak Revisi v2.10 token itu
 *    dikirim backend sebagai cookie httpOnly, yang secara desain tidak dapat
 *    dibaca maupun ditulis JavaScript — itulah inti perlindungannya. Peramban
 *    melampirkannya otomatis selama `withCredentials: true`.
 *
 * Alasan pemindahan: refresh token berumur panjang (30 hari) dan dapat ditukar
 * menjadi access token baru. Bila terbaca lewat XSS, penyerang memegang sesi
 * jauh melewati masa hidup access token, dan mencabut satu access token tidak
 * menolong.
 *
 * Klien mobile TIDAK memakai berkas ini: aplikasi native tidak punya cookie
 * jar, sehingga refresh token tetap dikirim lewat body. Backend menjembatani
 * keduanya dengan custom extractor (cookie dulu, lalu body).
 */

let accessTokenInMemory: string | null = null;

function readAccessBackup(): string | null {
  try {
    return sessionStorage.getItem(env.tokenStorageKey);
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return accessTokenInMemory ?? readAccessBackup();
}

export function setAccessToken(token: string): void {
  accessTokenInMemory = token;
  try {
    sessionStorage.setItem(env.tokenStorageKey, token);
  } catch {
    void 0;
  }
}

export function clearAccessToken(): void {
  accessTokenInMemory = null;
  try {
    sessionStorage.removeItem(env.tokenStorageKey);
  } catch {
    void 0;
  }
}

/**
 * Bersihkan seluruh jejak sesi di sisi klien.
 *
 * Refresh token dicabut backend lewat /auth/logout (Set-Cookie Max-Age=0);
 * klien tidak dapat — dan tidak perlu — menghapusnya sendiri. Kunci lama di
 * localStorage ikut dibuang agar token sisa versi sebelumnya tidak tertinggal
 * di peramban pengguna setelah pembaruan.
 */
export function clearAllTokens(): void {
  clearAccessToken();
  try {
    localStorage.removeItem(env.refreshTokenStorageKey);
    localStorage.removeItem(env.tokenStorageKey);
  } catch {
    void 0;
  }
}
