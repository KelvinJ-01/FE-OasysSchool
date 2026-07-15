import { apiClient } from '../lib/apiClient';
import type { PaginatedResponse } from '../types/api';
import type {
  UserDirectoryEntry,
  CreateTeacherRequest,
  CreateParentRequest,
} from '../types/dataMaster';

export interface DirectoryQuery {
  role: 'teacher' | 'parent';
  page: number;
  pageSize: number;
  search?: string;
}

export async function fetchDirectory(query: DirectoryQuery): Promise<PaginatedResponse<UserDirectoryEntry>> {
  const { data } = await apiClient.get<PaginatedResponse<UserDirectoryEntry>>('/users', {
    params: {
      role: query.role,
      page: query.page,
      pageSize: query.pageSize,
      search: query.search || undefined,
    },
  });
  return data;
}

export type UpdateTeacherPayload = Partial<CreateTeacherRequest> & {
  accountStatus?: 'active' | 'suspended';
};

export async function createTeacher(payload: CreateTeacherRequest): Promise<void> {
  await apiClient.post('/teachers', payload);
}

export async function updateTeacher(id: string, payload: UpdateTeacherPayload): Promise<void> {
  await apiClient.patch(`/teachers/${id}`, payload);
}

export async function inviteTeacher(email: string): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>('/teachers/invitations', { email });
  return data;
}

export async function createParent(payload: CreateParentRequest): Promise<void> {
  await apiClient.post('/parents', payload);
}

export async function updateParent(id: string, payload: Partial<CreateParentRequest>): Promise<void> {
  await apiClient.patch(`/parents/${id}`, payload);
}

export async function verifyParent(id: string, approve: boolean): Promise<{ message: string }> {
  const { data } = await apiClient.patch<{ message: string }>(`/parents/${id}/verify`, { approve });
  return data;
}
