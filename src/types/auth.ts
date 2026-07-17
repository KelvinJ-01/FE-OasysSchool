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

  refreshToken?: string;
  refreshExpiresIn: number;
  role: UserRole;
  schoolId: string | null;
}

export interface RefreshTokenRequest {
  refreshToken?: string;

  platform: Platform;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;

  refreshToken?: string;
  refreshExpiresIn: number;
}

export interface LogoutRequest {
  refreshToken?: string;
  allDevices?: boolean;
}

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

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface VerifyEmailResponse {
  accountStatus: 'active' | 'pending_verification';
  message: string;
}

export interface ResendOtpRequest {
  email: string;
}

export interface MessageResponse {
  message: string;
}

export interface PrivacyPolicySection {
  heading: string;
  body: string;
  items: string[];
}

export interface PrivacyPolicyResponse {
  version: string;
  effectiveDate: string;
  intro: string;
  sections: PrivacyPolicySection[];
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
  channel: Platform;
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
  fullName: string;
  photoUrl?: string | null;
  email?: string;
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
