import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  clearAllTokens,
} from './tokenStorage';

describe('tokenStorage', () => {
  beforeEach(() => {
    clearAllTokens();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('menyimpan access token di memori dengan cadangan sessionStorage', () => {
    setAccessToken('acc-123');
    expect(getAccessToken()).toBe('acc-123');
    // Cadangan sessionStorage menjaga sesi saat tab dimuat ulang; isinya ikut
    // hilang saat tab ditutup, dan umurnya pendek (1 jam).
    expect(sessionStorage.getItem('oasys_access_token')).toBe('acc-123');
    // Access token TIDAK BOLEH mendarat di localStorage (persisten lintas tab).
    expect(localStorage.getItem('oasys_access_token')).toBeNull();
  });

  it('menghapus access token dari memori dan sessionStorage', () => {
    setAccessToken('acc-123');
    clearAccessToken();
    expect(getAccessToken()).toBeNull();
    expect(sessionStorage.getItem('oasys_access_token')).toBeNull();
  });

  it('tidak lagi mengekspos API refresh token ke JavaScript', async () => {
    // Refresh token kini milik peramban (cookie httpOnly), bukan milik kode ini.
    // Menyimpannya kembali di JavaScript akan membuka lagi jalur pencurian sesi
    // lewat XSS — inilah jaring pengaman terhadap regresi itu.
    const mod = await import('./tokenStorage');
    expect('getRefreshToken' in mod).toBe(false);
    expect('setRefreshToken' in mod).toBe(false);
    expect('clearRefreshToken' in mod).toBe(false);
  });

  it('clearAllTokens membuang sisa token versi lama dari localStorage', () => {
    // Pengguna yang memutakhirkan aplikasi masih menyimpan refresh token lama
    // di localStorage. Token itu harus ikut terbuang, bukan ditinggalkan.
    localStorage.setItem('oasys_refresh_token', 'legacy-refresh');
    localStorage.setItem('oasys_access_token', 'legacy-access');
    setAccessToken('acc-123');

    clearAllTokens();

    expect(localStorage.getItem('oasys_refresh_token')).toBeNull();
    expect(localStorage.getItem('oasys_access_token')).toBeNull();
    expect(getAccessToken()).toBeNull();
  });
});
