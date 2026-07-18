/// <reference types="vite/client" />
import { http, HttpResponse, delay } from 'msw';
import {
  TEACHER_ACCOUNT,
  mockStudents,
  mockClasses,
  mockSubjects,
  type MockStudent,
} from './seedData';

const BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const url = (path: string) => `${BASE}${path}`;

function apiError(status: number, code: string, message: string, details?: unknown) {
  return HttpResponse.json(
    { error: { code, message, details, traceId: `trace-${Date.now()}` } },
    { status },
  );
}

// JWT tiruan yang cocok dengan JwtPayload milik FE (lihat src/types/auth.ts).
function fakeJwt(expiresInSeconds: number): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: TEACHER_ACCOUNT.id,
    role: TEACHER_ACCOUNT.role,
    schoolId: TEACHER_ACCOUNT.schoolId,
    fullName: TEACHER_ACCOUNT.fullName,
    email: TEACHER_ACCOUNT.email,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };
  const encode = (obj: unknown) =>
    btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(obj))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  return `${encode(header)}.${encode(payload)}.mock-signature`;
}

const REFRESH_PREFIX = 'mock-refresh';
const REFRESH_COOKIE = 'oasys_rt';
const usedRefreshTokens = new Set<string>();

function newRefreshToken(): string {
  return `${REFRESH_PREFIX}.${TEACHER_ACCOUNT.id}.${Math.random().toString(36).slice(2, 10)}`;
}

function issueSession() {
  const refreshToken = newRefreshToken();
  return HttpResponse.json(
    {
      accessToken: fakeJwt(15 * 60),
      expiresIn: 900,
      refreshExpiresIn: 72 * 3600,
      role: TEACHER_ACCOUNT.role,
      schoolId: TEACHER_ACCOUNT.schoolId,
    },
    {
      headers: {
        'Set-Cookie': `${REFRESH_COOKIE}=${refreshToken}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${72 * 3600}`,
      },
    },
  );
}

function isAuthorized(request: Request): boolean {
  return (request.headers.get('Authorization') ?? '').startsWith('Bearer ');
}

function paginate<T>(items: T[], params: URLSearchParams) {
  const pageNumber = Number(params.get('page') ?? 1);
  const pageSize = Number(params.get('pageSize') ?? 20);
  const start = (pageNumber - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    totalCount: items.length,
    pageNumber,
    pageSize,
    totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
  };
}

export const handlers = [
  http.post(url('/auth/login'), async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string; platform?: string };
    await delay(200);

    const email = (body.email ?? '').trim().toLowerCase();
    const passwordOk = body.password === TEACHER_ACCOUNT.password;
    const emailOk = email === TEACHER_ACCOUNT.email.toLowerCase();

    if (!emailOk || !passwordOk) {
      return apiError(401, 'INVALID_CREDENTIALS', 'Email atau kata sandi salah.');
    }
    if (body.platform && body.platform !== 'web') {
      return apiError(403, 'ROLE_NOT_ALLOWED_ON_PLATFORM', 'Akun ini hanya untuk aplikasi mobile.');
    }
    return issueSession();
  }),

  http.post(url('/auth/refresh-token'), async ({ request, cookies }) => {
    const body = (await request.json().catch(() => ({}))) as { refreshToken?: string };
    const token = (cookies[REFRESH_COOKIE] ?? body.refreshToken ?? '').trim();

    if (!token.startsWith(REFRESH_PREFIX)) {
      return apiError(401, 'REFRESH_TOKEN_INVALID_OR_EXPIRED', 'Sesi tidak valid. Silakan masuk kembali.');
    }
    if (usedRefreshTokens.has(token)) {
      return apiError(401, 'REFRESH_TOKEN_REUSED', 'Token sesi terdeteksi dipakai ulang. Silakan masuk kembali.');
    }
    usedRefreshTokens.add(token);
    return issueSession();
  }),

  http.post(url('/auth/logout'), async ({ request, cookies }) => {
    const body = (await request.json().catch(() => ({}))) as { refreshToken?: string };
    const token = (cookies[REFRESH_COOKIE] ?? body.refreshToken ?? '').trim();
    if (token) usedRefreshTokens.add(token);
    return HttpResponse.json(
      { message: 'Berhasil keluar.' },
      { headers: { 'Set-Cookie': `${REFRESH_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0` } },
    );
  }),

  http.get(url('/students'), ({ request }) => {
    if (!isAuthorized(request)) return apiError(401, 'UNAUTHORIZED', 'Token tidak valid.');
    const params = new URL(request.url).searchParams;
    const search = (params.get('search') ?? '').toLowerCase();
    const classId = params.get('classId');

    let list = [...mockStudents];
    if (classId) list = list.filter((s) => s.classId === classId);
    if (search) {
      list = list.filter(
        (s) => s.fullName.toLowerCase().includes(search) || s.nisn.includes(search),
      );
    }
    return HttpResponse.json(paginate(list, params));
  }),

  http.post(url('/students'), async ({ request }) => {
    if (!isAuthorized(request)) return apiError(401, 'UNAUTHORIZED', 'Token tidak valid.');
    const body = (await request.json()) as Partial<MockStudent>;
    await delay(300);

    const nisn = (body.nisn ?? '').trim();
    if (!/^\d{10}$/.test(nisn)) {
      return apiError(422, 'VALIDATION_ERROR', 'NISN harus 10 digit angka.', [
        { field: 'nisn', message: 'NISN harus 10 digit angka.' },
      ]);
    }
    if (mockStudents.some((s) => s.nisn === nisn)) {
      return apiError(409, 'NISN_ALREADY_REGISTERED', 'NISN ini sudah terdaftar.');
    }

    const created: MockStudent = {
      id: `student-${Date.now()}`,
      schoolId: TEACHER_ACCOUNT.schoolId,
      classId: body.classId ?? null,
      className: body.className ?? null,
      nisn,
      fullName: (body.fullName ?? '').trim() || '-',
      status: 'aktif',
      photoUrl: null,
      createdAt: new Date().toISOString(),
    };
    mockStudents.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.get(url('/classes'), ({ request }) => {
    if (!isAuthorized(request)) return apiError(401, 'UNAUTHORIZED', 'Token tidak valid.');
    return HttpResponse.json(paginate([...mockClasses], new URL(request.url).searchParams));
  }),

  http.get(url('/subjects'), ({ request }) => {
    if (!isAuthorized(request)) return apiError(401, 'UNAUTHORIZED', 'Token tidak valid.');
    return HttpResponse.json(paginate([...mockSubjects], new URL(request.url).searchParams));
  }),

  http.get(url('/users/me/classes'), ({ request }) => {
    if (!isAuthorized(request)) return apiError(401, 'UNAUTHORIZED', 'Token tidak valid.');
    return HttpResponse.json({ items: mockClasses });
  }),

  http.get(url('/users/me/subjects'), ({ request }) => {
    if (!isAuthorized(request)) return apiError(401, 'UNAUTHORIZED', 'Token tidak valid.');
    return HttpResponse.json({ items: mockSubjects });
  }),
];