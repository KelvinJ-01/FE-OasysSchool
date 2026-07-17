import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  fetchClassesPage,
  createClass,
  updateClass,
  deleteClass,
  fetchSubjectsPage,
  createSubject,
  updateSubject,
  deleteSubject,
  fetchTermsPage,
  createTerm,
  updateTerm,
  deleteTerm,
  type PagedQuery,
} from '../../services/academicService';
import type {
  CreateClassRequest,
  UpdateClassRequest,
  CreateSubjectRequest,
  UpdateSubjectRequest,
  CreateAcademicTermRequest,
  UpdateAcademicTermRequest,
} from '../../types/dataMaster';

export function useClassesPageQuery(query: PagedQuery) {
  return useQuery({
    queryKey: ['classes', 'page', query],
    queryFn: () => fetchClassesPage(query),
    placeholderData: keepPreviousData,
  });
}

export function useClassMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['classes'] });

    void queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
  };

  return {
    create: useMutation({ mutationFn: (p: CreateClassRequest) => createClass(p), onSuccess: invalidate }),
    update: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: UpdateClassRequest }) => updateClass(id, payload),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: (id: string) => deleteClass(id), onSuccess: invalidate }),
  };
}

export function useSubjectsPageQuery(query: PagedQuery) {
  return useQuery({
    queryKey: ['subjects', 'page', query],
    queryFn: () => fetchSubjectsPage(query),
    placeholderData: keepPreviousData,
  });
}

export function useSubjectMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['subjects'] });

    void queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
  };

  return {
    create: useMutation({ mutationFn: (p: CreateSubjectRequest) => createSubject(p), onSuccess: invalidate }),
    update: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: UpdateSubjectRequest }) => updateSubject(id, payload),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: (id: string) => deleteSubject(id), onSuccess: invalidate }),
  };
}

export function useTermsPageQuery(query: PagedQuery) {
  return useQuery({
    queryKey: ['academic-terms', 'page', query],
    queryFn: () => fetchTermsPage(query),
    placeholderData: keepPreviousData,
  });
}

export function useTermMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['academic-terms'] });

  return {
    create: useMutation({ mutationFn: (p: CreateAcademicTermRequest) => createTerm(p), onSuccess: invalidate }),
    update: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: UpdateAcademicTermRequest }) => updateTerm(id, payload),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: (id: string) => deleteTerm(id), onSuccess: invalidate }),
  };
}
