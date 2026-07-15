import { apiClient } from '../lib/apiClient';
import { env } from '../config/env';
import type { PaginatedResponse } from '../types/api';
import type { Student, Schedule, AttendanceRecord } from '../types/entities';
import type { UpdateAttendanceStatusRequest, AttendanceHistoryResponse } from '../types/attendance';
import type { UserDirectoryEntry } from '../types/dataMaster';

export interface AttendanceQuery {
  classId: string;
  sessionDate: string;
  subjectId?: string;
  status?: string;
  page: number;
  pageSize: number;
}

export async function fetchAttendanceRecords(query: AttendanceQuery): Promise<PaginatedResponse<AttendanceRecord>> {
  const { data } = await apiClient.get<PaginatedResponse<AttendanceRecord>>('/attendance-records', {
    params: {
      classId: query.classId,
      sessionDate: query.sessionDate,
      subjectId: query.subjectId || undefined,
      status: query.status || undefined,
      page: query.page,
      pageSize: query.pageSize,
    },
  });
  return data;
}

export async function fetchAttendanceHistory(recordId: string): Promise<AttendanceHistoryResponse> {
  const { data } = await apiClient.get<AttendanceHistoryResponse>(`/attendance-records/${recordId}/history`);
  return data;
}

export async function updateAttendanceStatus(
  recordId: string,
  payload: UpdateAttendanceStatusRequest,
): Promise<void> {
  await apiClient.patch(`/attendance-records/${recordId}/status`, payload);
}

export async function fetchStudentsByClass(classId: string): Promise<Student[]> {
  const { data } = await apiClient.get<PaginatedResponse<Student>>('/students', {
    params: { classId, pageSize: env.maxPageSize },
  });
  return data.items;
}

export async function fetchSchedulesByClass(classId: string): Promise<Schedule[]> {
  const { data } = await apiClient.get<PaginatedResponse<Schedule>>('/schedules', {
    params: { classId, pageSize: env.maxPageSize },
  });
  return data.items;
}

export async function fetchStaffDirectory(role: 'teacher' | 'administrator'): Promise<UserDirectoryEntry[]> {
  const { data } = await apiClient.get<PaginatedResponse<UserDirectoryEntry>>('/users', {
    params: { role, pageSize: env.maxPageSize },
  });
  return data.items;
}
