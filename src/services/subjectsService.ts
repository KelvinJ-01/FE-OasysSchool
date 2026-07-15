import { apiClient } from '../lib/apiClient';
import { env } from '../config/env';
import type { PaginatedResponse } from '../types/api';
import type { Subject, UserRole } from '../types/entities';

export interface MySubjectsResponse {
  items: Subject[];
  totalCount: number;
}

export async function getMySubjects(classId?: string): Promise<Subject[]> {
  const { data } = await apiClient.get<MySubjectsResponse>('/users/me/subjects', {
    params: classId ? { classId } : undefined,
  });
  return data.items;
}

export async function getAllSubjects(): Promise<Subject[]> {
  const { data } = await apiClient.get<PaginatedResponse<Subject>>('/subjects', {
    params: { pageSize: env.maxPageSize },
  });
  return data.items;
}

export async function getSelectableSubjects(role: UserRole | undefined, classId?: string): Promise<Subject[]> {
  if (role === 'teacher') {
    return getMySubjects(classId);
  }
  if (!classId) {
    return getAllSubjects();
  }
  const { data } = await apiClient.get<MySubjectsResponse>('/users/me/subjects', { params: { classId } });
  return data.items;
}
