export type UserRole = 'developer' | 'administrator' | 'teacher' | 'parent';

export type AllowedPlatform = 'web' | 'mobile' | 'all';

export type TenantStatus = 'active' | 'suspended';
export type AccountStatus = 'active' | 'suspended' | 'pending_verification';

export type RegistrationChannel = 'web' | 'mobile' | 'internal';

export type StudentStatus = 'aktif' | 'pindah_sekolah' | 'keluar';

export type Semester = 'ganjil' | 'genap';

export type AttendanceStatus = 'hadir' | 'alpa' | 'sakit' | 'izin';

export type SyncSource = 'online' | 'offline';

export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'failed';

export type LogSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface School {
  id: string;
  name: string;
  npsn: string;
  legalityRef: string;
  accreditation: string;
  tenantStatus: TenantStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserAccount {
  id: string;
  schoolId: string | null;
  role: UserRole;
  allowedPlatform: AllowedPlatform;
  fullName: string;
  email: string;
  phone?: string | null;
  accountStatus: AccountStatus;
  registrationChannel: RegistrationChannel;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type Gender = 'laki_laki' | 'perempuan';
export type Religion = 'islam' | 'kristen' | 'katolik' | 'hindu' | 'buddha' | 'konghucu';

export interface StudentGuardian {
  name: string;
  relation: 'wali';
  phone?: string | null;
}

export interface Student {
  id: string;
  schoolId: string;
  classId: string | null;
  nisn: string;
  fullName: string;
  gender?: Gender | null;
  religion?: Religion | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  fatherName?: string | null;
  motherName?: string | null;
  guardian1?: StudentGuardian | null;
  guardian2?: StudentGuardian | null;
  photoUrl?: string | null;
  qrCode?: string | null;
  status: StudentStatus;
  statusChangedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type EducationLevel = 'sd' | 'smp' | 'sma' | 'smk';

export interface ClassEntity {
  id: string;
  schoolId: string;
  name: string;
  educationLevel?: EducationLevel | null;
  gradeLevel?: string | null;
  homeroomTeacherId?: string | null;
  homeroomTeacherName?: string | null;
  studentCount?: number;
  createdAt: string;
}

export interface AcademicTerm {
  id: string;
  schoolId: string;
  yearLabel: string;
  semester: Semester;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Subject {
  id: string;
  schoolId: string;
  code?: string | null;
  name: string;
  teacherIds?: string[];
  teacherNames?: string[];
}

export interface Schedule {
  id: string;
  schoolId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  academicTermId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  createdAt: string;
  teacherName?: string;
}

export interface AttendanceRecord {
  id: string;
  schoolId: string;
  scheduleId: string;
  studentId: string;
  sessionDate: string;
  scannedAt?: string | null;
  status: AttendanceStatus;
  syncSource: SyncSource;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceStatusHistoryEntry {
  id: string;
  attendanceRecordId: string;
  oldStatus: AttendanceStatus;
  newStatus: AttendanceStatus;
  changedBy: string;
  changedByName?: string;
  changedByRole?: UserRole;
  changedAt: string;
}

export interface ParentStudentLink {
  id: string;
  parentUserId: string;
  studentId: string;
  createdAt: string;
}

export interface ParentConsent {
  id: string;
  parentUserId: string;
  policyVersion: string;
  consentedAt: string;
}

export interface Donation {
  id: string;
  recordedBy: string;
  schoolId?: string | null;
  amount: number;
  transactionDate: string;
  note?: string | null;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  parentUserId: string;
  studentId: string;
  attendanceDate: string;
  deliveryStatus: DeliveryStatus;
  sentAt?: string | null;
  createdAt: string;
}

export interface ActivityLogEntry {
  id: string;
  schoolId?: string | null;
  actorUserId: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  createdAt: string;
}

export interface ErrorLogEntry {
  id: string;
  schoolId?: string | null;
  severity: LogSeverity;
  module: string;
  message: string;
  createdAt: string;
}

export interface AttendanceReportRow {
  studentId: string;
  studentFullName: string;
  hadirCount: number;
  sakitCount: number;
  izinCount: number;
  alpaCount: number;
}

export interface DailyAttendanceSummary {
  sessionDate: string;
  hadirCount: number;
  sakitCount: number;
  izinCount: number;
  alpaCount: number;
}
