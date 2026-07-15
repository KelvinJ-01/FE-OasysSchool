import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  fetchAttendanceRecords,
  fetchAttendanceHistory,
  updateAttendanceStatus,
  fetchStudentsByClass,
  fetchSchedulesByClass,
  fetchStaffDirectory,
  type AttendanceQuery,
} from '../../services/attendanceService';
import type { UpdateAttendanceStatusRequest } from '../../types/attendance';

export function useAttendanceRecordsQuery(query: AttendanceQuery, enabled: boolean) {
  return useQuery({
    queryKey: ['attendance-records', query],
    queryFn: () => fetchAttendanceRecords(query),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useAttendanceHistoryQuery(recordId: string | null) {
  return useQuery({
    queryKey: ['attendance-history', recordId],
    queryFn: () => fetchAttendanceHistory(recordId!),
    enabled: recordId !== null,
    staleTime: 0,
  });
}

export function useAttendanceMutations() {
  const queryClient = useQueryClient();

  const correctStatus = useMutation({
    mutationFn: ({ recordId, payload }: { recordId: string; payload: UpdateAttendanceStatusRequest }) =>
      updateAttendanceStatus(recordId, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      void queryClient.invalidateQueries({ queryKey: ['attendance-history', variables.recordId] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  return { correctStatus };
}

export function useClassStudentsQuery(classId: string) {
  return useQuery({
    queryKey: ['students', 'by-class', classId],
    queryFn: () => fetchStudentsByClass(classId),
    enabled: Boolean(classId),
    staleTime: 60_000,
  });
}

export function useClassSchedulesQuery(classId: string) {
  return useQuery({
    queryKey: ['schedules', 'by-class', classId],
    queryFn: () => fetchSchedulesByClass(classId),
    enabled: Boolean(classId),
    staleTime: 60_000,
  });
}

export function useStaffDirectoryQuery(role: 'teacher' | 'administrator', enabled: boolean) {
  return useQuery({
    queryKey: ['directory', 'staff', role],
    queryFn: () => fetchStaffDirectory(role),
    enabled,
    staleTime: 5 * 60_000,
  });
}
