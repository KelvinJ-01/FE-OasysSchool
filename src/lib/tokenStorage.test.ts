import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  getRefreshToken,
  setRefreshToken,
  clearRefreshToken,
  clearAllTokens,
} from './tokenStorage';

describe('tokenStorage', () => {
  beforeEach(() => {
    clearAllTokens();
    localStorage.clear();
  });

  it('menyimpan access token hanya di memori (bukan localStorage)', () => {
    setAccessToken('acc-123');
    expect(getAccessToken()).toBe('acc-123');
    expect(localStorage.getItem('oasys_access_token')).toBeNull();
  });

  it('menghapus access token dari memori', () => {
    setAccessToken('acc-123');
    clearAccessToken();
    expect(getAccessToken()).toBeNull();
  });

  it('mempertahankan refresh token lintas pemanggilan (persisted)', () => {
    setRefreshToken('ref-abc');
    expect(getRefreshToken()).toBe('ref-abc');
  });

  it('clearAllTokens membersihkan access dan refresh sekaligus', () => {
    setAccessToken('acc-123');
    setRefreshToken('ref-abc');
    clearAllTokens();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it('clearRefreshToken juga membersihkan sisa key access-token lama', () => {
    localStorage.setItem('oasys_access_token', 'legacy');
    setRefreshToken('ref-abc');
    clearRefreshToken();
    expect(localStorage.getItem('oasys_access_token')).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });
});
