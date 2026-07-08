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
  role: UserRole;
  schoolId: string | null;
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
  platform?: Platform;
  exp: number;
  iat?: number;
}

export interface AuthUser {
  id: string;
  role: UserRole;
  schoolId: string | null;
  fullName?: string;
  email?: string;
}