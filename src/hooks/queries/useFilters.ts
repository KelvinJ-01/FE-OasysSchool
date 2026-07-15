import { useQuery } from '@tanstack/react-query';
import { getAllClasses } from '../../services/classesService';
import { getAllSubjects } from '../../services/subjectsService';

export const filterKeys = {
  classes: ['classes', 'all'] as const,
  subjects: ['subjects', 'all'] as const,
};

export function useAllClassesQuery() {
  return useQuery({
    queryKey: filterKeys.classes,
    queryFn: getAllClasses,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}

export function useAllSubjectsQuery() {
  return useQuery({
    queryKey: filterKeys.subjects,
    queryFn: getAllSubjects,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}
