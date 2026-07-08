export type UserRole = 'developer' | 'administrator' | 'teacher' | 'parent';

export type AllowedPlatform = 'web' | 'mobile' | 'all';

export type TenantStatus = 'active' | 'suspended';
export type AccountStatus = 'active' | 'suspended';

export type RegistrationChannel = 'web' | 'internal';

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

export interface Student {
  id: string;
  schoolId: string;
  classId: string | null;
  nisn: string;
  fullName: string;
  status: StudentStatus;
  statusChangedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClassEntity {
  id: string;
  schoolId: string;
  name: string;
  gradeLevel?: string | null;
  createdAt: string;
}

export interface AcademicTerm {
  id: string;
  schoolId: string;
  /** Format "2025/2026". */
  yearLabel: string;
  semester: Semester;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Subject {
  id: string;
  schoolId: string;
  name: string;
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