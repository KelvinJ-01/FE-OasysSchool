import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { env } from '../../config/env';
import type { PaginatedResponse } from '../../types/api';
import type { Schedule, AcademicTerm } from '../../types/entities';
import type { CreateScheduleRequest, UpdateScheduleRequest } from '../../types/schedule';

export interface SchedulesQuery {
  page: number;
  pageSize: number;
  classId?: string;
  academicTermId?: string;
  dayOfWeek?: number;
}

async function fetchSchedules(query: SchedulesQuery): Promise<PaginatedResponse<Schedule>> {
  const { data } = await apiClient.get<PaginatedResponse<Schedule>>('/schedules', {
    params: {
      page: query.page,
      pageSize: query.pageSize,
      classId: query.classId || undefined,
      academicTermId: query.academicTermId || undefined,
      dayOfWeek: query.dayOfWeek,
    },
  });
  return data;
}

export function useSchedulesQuery(query: SchedulesQuery) {
  return useQuery({
    queryKey: ['schedules', 'list', query],
    queryFn: () => fetchSchedules(query),
    placeholderData: keepPreviousData,
  });
}

export function useAllTermsQuery() {
  return useQuery({
    queryKey: ['academic-terms', 'all'],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<AcademicTerm>>('/academic-terms', {
        params: { pageSize: env.maxPageSize },
      });
      return data.items;
    },
    staleTime: 5 * 60_000,
  });
}

export function useScheduleMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['schedules'] });

    void queryClient.invalidateQueries({ queryKey: ['classes'] });
    void queryClient.invalidateQueries({ queryKey: ['subjects'] });

    void queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
  };

  return {
    create: useMutation({
      mutationFn: async (payload: CreateScheduleRequest) => {
        await apiClient.post('/schedules', payload);
      },
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: async ({ id, payload }: { id: string; payload: UpdateScheduleRequest }) => {
        await apiClient.patch(`/schedules/${id}`, payload);
      },
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        await apiClient.delete(`/schedules/${id}`);
      },
      onSuccess: invalidate,
    }),
  };
}
