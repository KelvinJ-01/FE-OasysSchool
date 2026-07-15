import { apiClient } from '../lib/apiClient';
import { env } from '../config/env';
import type { PaginatedResponse } from '../types/api';
import type { ClassEntity, UserRole } from '../types/entities';

export interface MyClassesResponse {
  items: ClassEntity[];
  totalCount: number;
}

export async function getMyClasses(): Promise<ClassEntity[]> {
  const { data } = await apiClient.get<MyClassesResponse>('/users/me/classes');
  return data.items;
}

export async function getAllClasses(): Promise<ClassEntity[]> {
  const { data } = await apiClient.get<PaginatedResponse<ClassEntity>>('/classes', {
    params: { pageSize: env.maxPageSize },
  });
  return data.items;
}

export async function getSelectableClasses(role: UserRole | undefined): Promise<ClassEntity[]> {
  if (role === 'teacher') {
    return getMyClasses();
  }
  return getAllClasses();
}
