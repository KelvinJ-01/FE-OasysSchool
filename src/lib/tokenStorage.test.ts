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

  it('menyimpan access token hanya di memori, bukan di web storage', () => {
    setAccessToken('acc-123');
    expect(getAccessToken()).toBe('acc-123');

    // Token TIDAK boleh bocor ke storage yang dapat dibaca JavaScript.
    expect(sessionStorage.getItem('oasys_access_token')).toBeNull();
    expect(localStorage.getItem('oasys_access_token')).toBeNull();
  });

  it('menghapus access token dari memori', () => {
    setAccessToken('acc-123');
    clearAccessToken();
    expect(getAccessToken()).toBeNull();
  });

  it('tidak mengekspos API refresh token ke JavaScript', async () => {
    const mod = await import('./tokenStorage');
    expect('getRefreshToken' in mod).toBe(false);
    expect('setRefreshToken' in mod).toBe(false);
    expect('clearRefreshToken' in mod).toBe(false);
  });

  it('clearAllTokens membuang sisa token versi lama dari web storage', () => {
    sessionStorage.setItem('oasys_access_token', 'legacy-access');
    localStorage.setItem('oasys_refresh_token', 'legacy-refresh');
    localStorage.setItem('oasys_access_token', 'legacy-access');
    setAccessToken('acc-123');

    clearAllTokens();

    expect(sessionStorage.getItem('oasys_access_token')).toBeNull();
    expect(localStorage.getItem('oasys_refresh_token')).toBeNull();
    expect(localStorage.getItem('oasys_access_token')).toBeNull();
    expect(getAccessToken()).toBeNull();
  });
});
