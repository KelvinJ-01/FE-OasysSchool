import type { AttendanceStatus, AttendanceStatusHistoryEntry } from './entities';

export interface UpdateAttendanceStatusRequest {
  status: AttendanceStatus;
  previousStatus?: AttendanceStatus;
}

export type AttendanceHistoryResponse = AttendanceStatusHistoryEntry[];