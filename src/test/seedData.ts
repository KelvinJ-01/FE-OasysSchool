import type { UserRole, StudentStatus } from '../types/entities';

export const TEACHER_ACCOUNT = {
  id: 'user-teacher-001',
  email: 'guru@oasys.sch.id',
  password: 'password123',
  role: 'teacher' as UserRole,
  schoolId: 'school-001',
  fullName: 'Ibu Sartika',
  phone: '081200000001',
  photoUrl: null as string | null,
  accountStatus: 'active',
  createdAt: '2025-01-10T08:00:00.000Z',
};

export const ADMIN_ACCOUNT = {
  id: 'user-admin-001',
  email: 'admin@oasys.sch.id',
  password: 'password123',
  role: 'administrator' as UserRole,
  schoolId: 'school-001',
  fullName: 'Pak Hendra',
  phone: '081200000002',
  photoUrl: null as string | null,
  accountStatus: 'active',
  createdAt: '2025-01-05T08:00:00.000Z',
};

export interface MockStudent {
  id: string;
  schoolId: string;
  classId: string | null;
  className: string | null;
  nisn: string;
  fullName: string;
  status: StudentStatus;
  photoUrl: string | null;
  createdAt: string;
}

export const mockStudents: MockStudent[] = [
  {
    id: 'student-001',
    schoolId: 'school-001',
    classId: 'class-001',
    className: 'VII-A',
    nisn: '0012345678',
    fullName: 'Andi Pratama',
    status: 'aktif',
    photoUrl: null,
    createdAt: '2025-02-01T08:00:00.000Z',
  },
  {
    id: 'student-002',
    schoolId: 'school-001',
    classId: 'class-001',
    className: 'VII-A',
    nisn: '0012345679',
    fullName: 'Bunga Lestari',
    status: 'aktif',
    photoUrl: null,
    createdAt: '2025-02-01T08:05:00.000Z',
  },
];

export interface MockClass {
  id: string;
  schoolId: string;
  name: string;
  educationLevel: 'sd' | 'smp' | 'sma' | 'smk';
  gradeLevel: number;
  createdAt: string;
}

export const mockClasses: MockClass[] = [
  {
    id: 'class-001',
    schoolId: 'school-001',
    name: 'VII-A',
    educationLevel: 'smp',
    gradeLevel: 7,
    createdAt: '2025-01-15T08:00:00.000Z',
  },
];

export interface MockSubject {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  createdAt: string;
}

export const mockSubjects: MockSubject[] = [
  { id: 'subject-001', schoolId: 'school-001', name: 'Matematika', code: 'MTK', createdAt: '2025-01-15T08:00:00.000Z' },
  { id: 'subject-002', schoolId: 'school-001', name: 'Bahasa Indonesia', code: 'BIN', createdAt: '2025-01-15T08:00:00.000Z' },
];