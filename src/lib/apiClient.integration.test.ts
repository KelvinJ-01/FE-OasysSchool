import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { apiClient, registerUnauthorizedHandler } from './apiClient';
import { setAccessToken, clearAllTokens, getAccessToken } from './tokenStorage';
import { env } from '../config/env';

const BASE = env.apiBaseUrl;

function jwt(expiresInSeconds: number): string {
  const encode = (obj: unknown) =>
    btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(obj))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: 'user-1',
    role: 'teacher',
    schoolId: 'school-001',
    fullName: 'Guru',
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };
  return `${encode(header)}.${encode(payload)}.sig`;
}

describe('interceptor apiClient (integrasi via MSW)', () => {
  beforeEach(() => {
    clearAllTokens();
  });

  afterEach(() => {
    clearAllTokens();
    vi.restoreAllMocks();
  });

  it('melampirkan Authorization: Bearer pada request terproteksi', async () => {
    setAccessToken(jwt(900)); // masih lama berlakunya
    let seenAuth: string | null = null;

    server.use(
      http.get(`${BASE}/ping`, ({ request }) => {
        seenAuth = request.headers.get('Authorization');
        return HttpResponse.json({ ok: true });
      }),
    );

    const { data } = await apiClient.get('/ping');
    expect(data).toEqual({ ok: true });
    expect(seenAuth).toMatch(/^Bearer /);
  });

  it('melakukan refresh otomatis saat access token hampir kedaluwarsa', async () => {
    setAccessToken(jwt(5)); // di bawah buffer 60 detik -> harus refresh dulu
    let refreshCalled = 0;

    server.use(
      http.post(`${BASE}/auth/refresh-token`, () => {
        refreshCalled++;
        return HttpResponse.json({ accessToken: jwt(900) });
      }),
      http.get(`${BASE}/ping`, () => HttpResponse.json({ ok: true })),
    );

    await apiClient.get('/ping');
    expect(refreshCalled).toBe(1);
    // Token di memori harus sudah diganti dengan yang baru (berlaku lama).
    expect(getAccessToken()).not.toBeNull();
  });

  it('me-refresh lalu mengulang request saat menerima 401', async () => {
    setAccessToken(jwt(900));
    let attempt = 0;
    let refreshCalled = 0;

    server.use(
      http.get(`${BASE}/protected`, () => {
        attempt++;
        // Panggilan pertama 401, panggilan kedua (setelah refresh) sukses.
        if (attempt === 1) {
          return HttpResponse.json(
            { error: { code: 'TOKEN_EXPIRED', message: 'kedaluwarsa' } },
            { status: 401 },
          );
        }
        return HttpResponse.json({ ok: true });
      }),
      http.post(`${BASE}/auth/refresh-token`, () => {
        refreshCalled++;
        return HttpResponse.json({ accessToken: jwt(900) });
      }),
    );

    const { data } = await apiClient.get('/protected');
    expect(data).toEqual({ ok: true });
    expect(attempt).toBe(2);
    expect(refreshCalled).toBe(1);
  });

  it('memanggil handler unauthorized saat refresh token dipakai ulang', async () => {
    setAccessToken(jwt(900));
    const onUnauthorized = vi.fn();
    registerUnauthorizedHandler(onUnauthorized);

    server.use(
      http.get(`${BASE}/protected`, () =>
        HttpResponse.json(
          { error: { code: 'REFRESH_TOKEN_REUSED', message: 'dipakai ulang' } },
          { status: 401 },
        ),
      ),
    );

    await expect(apiClient.get('/protected')).rejects.toBeTruthy();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull(); // sesi lokal harus dibersihkan
  });
});