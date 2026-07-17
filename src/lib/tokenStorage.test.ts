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

    expect(sessionStorage.getItem('oasys_access_token')).toBe('acc-123');

    expect(localStorage.getItem('oasys_access_token')).toBeNull();
  });

  it('menghapus access token dari memori dan sessionStorage', () => {
    setAccessToken('acc-123');
    clearAccessToken();
    expect(getAccessToken()).toBeNull();
    expect(sessionStorage.getItem('oasys_access_token')).toBeNull();
  });

  it('tidak lagi mengekspos API refresh token ke JavaScript', async () => {
    const mod = await import('./tokenStorage');
    expect('getRefreshToken' in mod).toBe(false);
    expect('setRefreshToken' in mod).toBe(false);
    expect('clearRefreshToken' in mod).toBe(false);
  });

  it('clearAllTokens membuang sisa token versi lama dari localStorage', () => {
    localStorage.setItem('oasys_refresh_token', 'legacy-refresh');
    localStorage.setItem('oasys_access_token', 'legacy-access');
    setAccessToken('acc-123');

    clearAllTokens();

    expect(localStorage.getItem('oasys_refresh_token')).toBeNull();
    expect(localStorage.getItem('oasys_access_token')).toBeNull();
    expect(getAccessToken()).toBeNull();
  });
});
