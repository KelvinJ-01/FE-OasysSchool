import type { EducationLevel, Gender, Religion, Semester, StudentGuardian, StudentStatus } from './entities';

export interface CreateStudentRequest {
  fullName: string;
  nisn: string;
  classId?: string;
  gender?: Gender;
  religion?: Religion;
  email?: string;
  phone?: string;
  address?: string;
  fatherName?: string;
  motherName?: string;
  guardian1?: StudentGuardian;
  guardian2?: StudentGuardian;
  photoDataUrl?: string;
}

export interface UpdateStudentWithStatusRequest extends Partial<CreateStudentRequest> {
  status?: StudentStatus;
}

export type UpdateStudentRequest = Partial<CreateStudentRequest>;

export interface UpdateStudentStatusRequest {
  status: StudentStatus;
  effectiveDate: string;
}

export interface CreateClassRequest {
  name: string;
  educationLevel?: EducationLevel;
  gradeLevel?: string;
  homeroomTeacherId?: string;
}

export const EDUCATION_LEVEL_LABEL: Record<EducationLevel, string> = {
  sd: 'SD', smp: 'SMP', sma: 'SMA', smk: 'SMK',
};

export const GRADE_OPTIONS: Record<EducationLevel, string[]> = {
  sd: ['1', '2', '3', '4', '5', '6'],
  smp: ['VII', 'VIII', 'IX'],
  sma: ['X', 'XI', 'XII'],
  smk: ['X', 'XI', 'XII'],
};

export type UpdateClassRequest = Partial<CreateClassRequest>;

export interface CreateAcademicTermRequest {
  yearLabel: string;
  semester: Semester;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export type UpdateAcademicTermRequest = Partial<CreateAcademicTermRequest>;

export interface CreateSubjectRequest {
  code?: string;
  name: string;
  teacherIds?: string[];
}

export type UpdateSubjectRequest = Partial<CreateSubjectRequest>;

export type EmploymentStatus = 'pns' | 'pppk' | 'gty' | 'gtt' | 'honorer';

export const EMPLOYMENT_STATUS_LABEL: Record<EmploymentStatus, string> = {
  pns: 'PNS',
  pppk: 'PPPK',
  gty: 'Guru Tetap Yayasan (GTY)',
  gtt: 'Guru Tidak Tetap (GTT)',
  honorer: 'Honorer',
};

export interface TeacherProfile {
  nip?: string | null;
  nuptk?: string | null;
  employmentStatus?: EmploymentStatus | null;
  expertiseField?: string | null;
  expertiseType?: string | null;
  address?: string | null;
}

export interface CreateTeacherRequest extends TeacherProfile {
  fullName: string;
  email: string;
  phone?: string;
}

export type UpdateTeacherRequest = Partial<CreateTeacherRequest> & {
  accountStatus?: 'active' | 'suspended';
};

export interface ParentProfile {
  address?: string | null;
  occupation?: string | null;
  photoUrl?: string | null;
}

export interface CreateParentRequest extends ParentProfile {
  fullName: string;
  email: string;
  phone?: string;
  studentNisns?: string[];
}

export type UpdateParentRequest = Partial<CreateParentRequest>;

export interface LinkedStudentSummary {
  id: string;
  fullName: string;
  nisn: string;
}

export interface UserDirectoryEntry extends TeacherProfile, ParentProfile {
  id: string;
  role: 'teacher' | 'parent' | 'administrator';
  fullName: string;
  email: string;
  phone: string | null;
  accountStatus: 'active' | 'suspended' | 'pending_verification';
  createdAt: string;
  linkedStudents?: LinkedStudentSummary[];
}

export interface ImportResult {
  imported: number;
  skipped: number;
  message: string;
}
