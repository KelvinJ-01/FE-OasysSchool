import type { Semester, StudentStatus } from './entities';

// --- Siswa -------------------------------------------------------------
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

// --- Kelas ---------------------------------------------------------------
export interface CreateClassRequest {
  name: string;
  gradeLevel?: string;
}

export type UpdateClassRequest = Partial<CreateClassRequest>;

// --- Tahun Ajaran ----------------------------------------------------------
export interface CreateAcademicTermRequest {
  yearLabel: string;
  semester: Semester;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export type UpdateAcademicTermRequest = Partial<CreateAcademicTermRequest>;

// --- Mata Pelajaran --------------------------------------------------------
export interface CreateSubjectRequest {
  name: string;
}

export type UpdateSubjectRequest = Partial<CreateSubjectRequest>;

// --- Direktori Guru & Orang Tua (baca, baru — v1.7, API Spec §3.2a) --------

export interface LinkedStudentSummary {
  id: string;
  fullName: string;
  nisn: string;
}

export interface UserDirectoryEntry {
  id: string;
  role: 'teacher' | 'parent';
  fullName: string;
  email: string;
  phone: string | null;
  accountStatus: 'active' | 'suspended' | 'pending_verification';
  createdAt: string;
  linkedStudents?: LinkedStudentSummary[];
}