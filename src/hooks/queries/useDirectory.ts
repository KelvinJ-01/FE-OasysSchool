import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  fetchDirectory,
  createTeacher,
  updateTeacher,
  inviteTeacher,
  createParent,
  updateParent,
  verifyParent,
  type DirectoryQuery,
  type UpdateTeacherPayload,
} from '../../services/directoryService';
import type { CreateTeacherRequest, CreateParentRequest } from '../../types/dataMaster';

const directoryKey = (q: DirectoryQuery) => ['directory', q] as const;

function useInvalidateDirectory() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['directory'] });
    // Nama guru tampil sebagai Wali Kelas, Guru Pengampu, dan kolom Guru pada
    // jadwal — semuanya di-join server, jadi ikut disegarkan.
    void queryClient.invalidateQueries({ queryKey: ['classes'] });
    void queryClient.invalidateQueries({ queryKey: ['subjects'] });
    void queryClient.invalidateQueries({ queryKey: ['schedules'] });
  };
}

export function useDirectoryQuery(query: DirectoryQuery) {
  return useQuery({
    queryKey: directoryKey(query),
    queryFn: () => fetchDirectory(query),
    placeholderData: keepPreviousData,
  });
}

export function useTeacherMutations() {
  const invalidate = useInvalidateDirectory();

  const create = useMutation({
    mutationFn: (payload: CreateTeacherRequest) => createTeacher(payload),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTeacherPayload }) => updateTeacher(id, payload),
    onSuccess: invalidate,
  });

  const invite = useMutation({
    mutationFn: (email: string) => inviteTeacher(email),
  });

  return { create, update, invite };
}

export function useParentMutations() {
  const invalidate = useInvalidateDirectory();

  const create = useMutation({
    mutationFn: (payload: CreateParentRequest) => createParent(payload),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateParentRequest> }) => updateParent(id, payload),
    onSuccess: invalidate,
  });

  const verify = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) => verifyParent(id, approve),
    onSuccess: invalidate,
  });

  return { create, update, verify };
}
