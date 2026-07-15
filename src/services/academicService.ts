import { apiClient } from '../lib/apiClient';
import { env } from '../config/env';
import type { PaginatedResponse } from '../types/api';
import type { ClassEntity, Subject, AcademicTerm } from '../types/entities';
import type {
  CreateClassRequest,
  UpdateClassRequest,
  CreateSubjectRequest,
  UpdateSubjectRequest,
  CreateAcademicTermRequest,
  UpdateAcademicTermRequest,
} from '../types/dataMaster';

export interface PagedQuery {
  page: number;
  pageSize?: number;
}

export async function fetchClassesPage(query: PagedQuery): Promise<PaginatedResponse<ClassEntity>> {
  const { data } = await apiClient.get<PaginatedResponse<ClassEntity>>('/classes', {
    params: { page: query.page, pageSize: query.pageSize ?? env.defaultPageSize },
  });
  return data;
}

export async function createClass(payload: CreateClassRequest): Promise<void> {
  await apiClient.post('/classes', payload);
}

export async function updateClass(id: string, payload: UpdateClassRequest): Promise<void> {
  await apiClient.patch(`/classes/${id}`, payload);
}

export async function deleteClass(id: string): Promise<void> {
  await apiClient.delete(`/classes/${id}`);
}

export async function fetchSubjectsPage(query: PagedQuery): Promise<PaginatedResponse<Subject>> {
  const { data } = await apiClient.get<PaginatedResponse<Subject>>('/subjects', {
    params: { page: query.page, pageSize: query.pageSize ?? env.defaultPageSize },
  });
  return data;
}

export async function createSubject(payload: CreateSubjectRequest): Promise<void> {
  await apiClient.post('/subjects', payload);
}

export async function updateSubject(id: string, payload: UpdateSubjectRequest): Promise<void> {
  await apiClient.patch(`/subjects/${id}`, payload);
}

export async function deleteSubject(id: string): Promise<void> {
  await apiClient.delete(`/subjects/${id}`);
}

export async function fetchTermsPage(query: PagedQuery): Promise<PaginatedResponse<AcademicTerm>> {
  const { data } = await apiClient.get<PaginatedResponse<AcademicTerm>>('/academic-terms', {
    params: { page: query.page, pageSize: query.pageSize ?? env.defaultPageSize },
  });
  return data;
}

export async function createTerm(payload: CreateAcademicTermRequest): Promise<void> {
  await apiClient.post('/academic-terms', payload);
}

export async function updateTerm(id: string, payload: UpdateAcademicTermRequest): Promise<void> {
  await apiClient.patch(`/academic-terms/${id}`, payload);
}

export async function deleteTerm(id: string): Promise<void> {
  await apiClient.delete(`/academic-terms/${id}`);
}
