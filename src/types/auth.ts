import type { UserRole } from './entities';

export type Platform = 'web' | 'mobile';

export interface LoginRequest {
  email: string;
  password: string;
  platform: Platform;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  refreshToken: string; // baru — v1.1
  refreshExpiresIn: number; // baru — v1.1, detik (rekomendasi 30 hari = 2592000)
  role: UserRole;
  schoolId: string | null;
}

// --- Refresh Token (baru — v1.1, API Spec §3.1 & §6.1) --------------------

export interface RefreshTokenRequest {
  refreshToken: string;
  platform: Platform;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
  refreshToken: string; // token baru hasil rotasi — WAJIB menggantikan yang lama
  refreshExpiresIn: number;
}

export interface LogoutRequest {
  refreshToken: string;
  allDevices?: boolean;
}

// --- Reset Kata Sandi (API Spec §3.1b, FR-13) -------------------------------

export interface PasswordResetRequest {
  email: string;
  platform: Platform;
}

export interface PasswordResetVerifyOtpRequest {
  email: string;
  otp: string;
}

export interface PasswordResetVerifyOtpResponse {
  resetToken: string;
  expiresIn: number;
}

export interface PasswordResetConfirmRequest {
  resetToken: string;
  newPassword: string;
}

// --- Verifikasi Email Registrasi Orang Tua (API Spec §3.1, FR-1) -----------

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface VerifyEmailResponse {
  accountStatus: 'active';
  message: string;
}

export interface ResendOtpRequest {
  email: string;
}

export interface MessageResponse {
  message: string;
}

// --- Kebijakan Privasi (baru — v1.3, API Spec §3.1a) -----------------------

export interface PrivacyPolicyResponse {
  version: string;
  effectiveDate: string;
  content: string;
  updatedAt: string;
}

// --- Lupa Kata Sandi (API Spec §3.1b, FR-13) --------------------------------

export interface PasswordResetRequest {
  email: string;
  platform: Platform;
}

export interface PasswordResetVerifyRequest {
  email: string;
  otp: string;
}

export interface PasswordResetVerifyResponse {
  resetToken: string;
  expiresIn: number;
}

export interface PasswordResetConfirmRequest {
  resetToken: string;
  newPassword: string;
}

// --- Verifikasi Email Registrasi Orang Tua (API Spec §3.1, FR-1) -----------

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface VerifyEmailResponse {
  accountStatus: 'active';
  message: string;
}

export interface ResendOtpRequest {
  email: string;
}

export interface ParentRegistrationConsent {
  policyVersion: string;
  accepted: boolean;
}

export interface ParentRegistrationRequest {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  studentNisn: string;
  consent: ParentRegistrationConsent;
}

export interface ParentRegistrationResponse {
  id: string;
  fullName: string;
  email: string;
  role: 'parent';
  allowedPlatform: 'mobile';
  schoolId: string;
  affiliatedStudent: {
    id: string;
    fullName: string;
    nisn: string;
  };
  consentRecordedAt: string;
  nextStep: string;
}

export interface JwtPayload {
  sub: string;
  role: UserRole;
  schoolId: string | null;
  fullName: string; // baru — v1.5
  photoUrl?: string | null; // baru — v1.9
  platform?: Platform;
  exp: number;
  iat?: number;
}

export interface AuthUser {
  id: string;
  role: UserRole;
  schoolId: string | null;
  fullName?: string;
  photoUrl?: string | null;
  email?: string;
}

// --- Ringkasan Dasbor (baru — v1.4, API Spec §3.10) -------------------------

export interface AttendanceCounts {
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  belumTercatat: number;
}

export interface DashboardSummaryResponse {
  date: string;
  academicTermId: string;
  scope: 'school' | 'class';
  totalStudents: number;
  attendance: AttendanceCounts;
}