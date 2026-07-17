import type { UserRole, AccountStatus } from './entities';

export interface UserProfileResponse {
  id: string;
  role: UserRole;
  fullName: string;
  email: string;
  phone: string | null;
  photoUrl: string | null;
  accountStatus: AccountStatus;
  createdAt: string;
}

export interface UploadPhotoResponse {
  photoUrl: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  email?: string;
  phone?: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
