import { useMemo } from 'react';
import { Link } from 'react-router';
import { CalendarDays, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSchedulesQuery } from '../../hooks/queries/useSchedules';
import { useAllClassesQuery, useAllSubjectsQuery } from '../../hooks/queries/useFilters';
import { Skeleton } from '../common/Skeleton';

export function TodaySchedule() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  const jsDay = new Date().getDay();
  const todayDow = jsDay === 0 ? 7 : jsDay;

  const schedulesQuery = useSchedulesQuery({ page: 1, pageSize: 100, dayOfWeek: todayDow });
  const classesQuery = useAllClassesQuery();
  const subjectsQuery = useAllSubjectsQuery();

  const isLoading = schedulesQuery.isPending || classesQuery.isPending || subjectsQuery.isPending;
  const hasError = schedulesQuery.isError || classesQuery.isError || subjectsQuery.isError;

  const items = useMemo(() => {
    const classById = new Map((classesQuery.data ?? []).map((c) => [c.id, c.name]));
    const subjById = new Map((subjectsQuery.data ?? []).map((s) => [s.id, s.name]));
    return (schedulesQuery.data?.items ?? [])
      .filter((s) => (isTeacher && user ? s.teacherId === user.id : true))
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map((s) => ({
        id: s.id,
        time: `${s.startTime}–${s.endTime}`,
        subject: subjById.get(s.subjectId) ?? 'Mata pelajaran',
        className: classById.get(s.classId) ?? 'Kelas',
        teacherName: s.teacherName ?? null,
      }));
  }, [schedulesQuery.data, classesQuery.data, subjectsQuery.data, isTeacher, user]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-theme-sm font-medium text-gray-700 dark:text-gray-300">
          <CalendarDays size={16} className="text-gray-400" aria-hidden="true" />

          Jadwal Hari Ini
          {!isTeacher && <span className="text-theme-xs font-normal text-gray-400">· seluruh sekolah</span>}

        </h2>

        <Link to="/schedules" className="flex items-center gap-1 text-theme-xs font-medium text-brand-500 hover:underline">
          Lihat semua
          <ArrowRight size={13} aria-hidden="true" />

        </Link>

      </div>

      <div className="mt-4">
        {isLoading && (
          <div className="space-y-2.5">
            <Skeleton className="h-12 rounded-lg" />

            <Skeleton className="h-12 rounded-lg" />

          </div>

        )}

        {!isLoading && hasError && (
          <p className="py-6 text-center text-theme-sm text-gray-400">Jadwal tidak dapat dimuat.</p>

        )}

        {!isLoading && !hasError && items.length === 0 && (
          <p className="py-6 text-center text-theme-sm text-gray-400">
            {isTeacher ? 'Anda tidak punya jadwal mengajar hari ini.' : 'Tidak ada jadwal pembelajaran di sekolah hari ini.'}
          </p>

        )}

        {!isLoading && !hasError && items.length > 0 && (
          <ol className="space-y-1">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-3.5 rounded-lg px-2 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-white/5">
                <span className="w-[104px] shrink-0 font-mono text-theme-xs text-gray-500 dark:text-gray-400">{it.time}</span>

                <span className="h-8 w-px bg-gray-200 dark:bg-gray-700" aria-hidden="true" />

                <span className="min-w-0">
                  <span className="block truncate text-theme-sm font-medium text-gray-800 dark:text-white/90">{it.subject}</span>

                  <span className="block truncate text-theme-xs text-gray-400">
                    {it.className}
                    {!isTeacher && it.teacherName ? ` · ${it.teacherName}` : ''}
                  </span>

                </span>

              </li>

            ))}
          </ol>

        )}
      </div>

    </div>

  );
}
