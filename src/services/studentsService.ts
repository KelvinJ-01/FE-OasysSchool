import { apiClient } from '../lib/apiClient';
import type { PaginatedResponse } from '../types/api';
import type { Student } from '../types/entities';
import type {
  CreateStudentRequest,
  UpdateStudentRequest,
  UpdateStudentStatusRequest,
} from '../types/dataMaster';

export interface StudentsQuery {
  page: number;
  pageSize: number;
  search?: string;
  classId?: string;
}

export async function fetchStudents(query: StudentsQuery): Promise<PaginatedResponse<Student>> {
  const { data } = await apiClient.get<PaginatedResponse<Student>>('/students', {
    params: {
      page: query.page,
      pageSize: query.pageSize,
      search: query.search || undefined,
      classId: query.classId || undefined,
    },
  });
  return data;
}

export async function createStudent(payload: CreateStudentRequest): Promise<Student> {
  const { data } = await apiClient.post<Student>('/students', payload);
  return data;
}

export async function updateStudent(id: string, payload: UpdateStudentRequest): Promise<Student> {
  const { data } = await apiClient.patch<Student>(`/students/${id}`, payload);
  return data;
}

export async function updateStudentStatus(id: string, payload: UpdateStudentStatusRequest): Promise<Student> {
  const { data } = await apiClient.patch<Student>(`/students/${id}/status`, payload);
  return data;
}
