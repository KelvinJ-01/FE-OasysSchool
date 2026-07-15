import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  fetchStudents,
  createStudent,
  updateStudent,
  updateStudentStatus,
  type StudentsQuery,
} from '../services/studentsService';
import { getAllClasses } from '../services/classesService';
import type {
  CreateStudentRequest,
  UpdateStudentRequest,
  UpdateStudentStatusRequest,
} from '../types/dataMaster';

const studentsKey = (q: StudentsQuery) => ['students', q] as const;

export function useStudentsQuery(query: StudentsQuery) {
  return useQuery({
    queryKey: studentsKey(query),
    queryFn: () => fetchStudents(query),
    placeholderData: keepPreviousData,
  });
}

export function useClassesQuery() {
  return useQuery({
    queryKey: ['classes', 'all'],
    queryFn: getAllClasses,
    staleTime: 5 * 60_000,
  });
}

export function useStudentMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['students'] });
    // Kolom "Jumlah Murid" pada Data Kelas dihitung dari siswa aktif.
    void qc.invalidateQueries({ queryKey: ['classes'] });
    // Ringkasan Dashboard & daftar presensi bergantung pada daftar siswa.
    void qc.invalidateQueries({ queryKey: ['attendance-records'] });
    void qc.invalidateQueries({ queryKey: ['dashboard-summary'] });
  };

  const create = useMutation({
    mutationFn: (payload: CreateStudentRequest) => createStudent(payload),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateStudentRequest }) => updateStudent(id, payload),
    onSuccess: invalidate,
  });

  const changeStatus = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateStudentStatusRequest }) => updateStudentStatus(id, payload),
    onSuccess: invalidate,
  });

  return { create, update, changeStatus };
}
