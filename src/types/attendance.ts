import type { AttendanceStatus, AttendanceStatusHistoryEntry } from './entities';

export interface UpdateAttendanceStatusRequest {
  status: AttendanceStatus;
}

export type AttendanceHistoryResponse = AttendanceStatusHistoryEntry[];