import type { Semester, StudentStatus } from './entities';

export interface CreateStudentRequest {
  fullName: string;
  nisn: string;
  classId?: string;
}

export interface UpdateStudentRequest {
  fullName?: string;
  classId?: string;
}

export interface UpdateStudentStatusRequest {
  status: StudentStatus;
  effectiveDate: string;
}

export interface CreateClassRequest {
  name: string;
  gradeLevel?: string;
}

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
  name: string;
}

export type UpdateSubjectRequest = Partial<CreateSubjectRequest>;

export interface LinkedStudentSummary {
  id: string;
  fullName: string;
  nisn: string;
}

export interface UserDirectoryEntry {
  id: string;
  role: 'teacher' | 'parent' | 'administrator'; // administrator baru — v2.2
  fullName: string;
  email: string;
  phone: string | null;
  accountStatus: 'active' | 'suspended' | 'pending_verification';
  createdAt: string;
  linkedStudents?: LinkedStudentSummary[];
}