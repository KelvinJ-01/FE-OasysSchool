import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { CalendarDays, ArrowRight } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { Skeleton } from '../common/Skeleton';
import type { PaginatedResponse } from '../../types/api';
import type { Schedule, ClassEntity, Subject } from '../../types/entities';

export function TodaySchedule() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const [items, setItems] = useState<Array<{ id: string; time: string; subject: string; className: string; teacherName?: string | null }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const jsDay = new Date().getDay();
    const todayDow = jsDay === 0 ? 7 : jsDay;

    Promise.all([
      apiClient.get<PaginatedResponse<Schedule>>('/schedules', { params: { pageSize: 100 } }),
      apiClient.get<PaginatedResponse<ClassEntity>>('/classes', { params: { pageSize: 100 } }),
      apiClient.get<PaginatedResponse<Subject>>('/subjects', { params: { pageSize: 100 } }),
    ])
      .then(([schedRes, classRes, subjRes]) => {
        const classById = new Map(classRes.data.items.map((c) => [c.id, c.name]));
        const subjById = new Map(subjRes.data.items.map((s) => [s.id, s.name]));
        const todays = schedRes.data.items
          .filter((s) => s.dayOfWeek === todayDow)
          .filter((s) => (user?.role === 'teacher' ? s.teacherId === user.id : true))
          .sort((a, b) => a.startTime.localeCompare(b.startTime))
          .map((s) => ({
            id: s.id,
            time: `${s.startTime}–${s.endTime}`,
            subject: subjById.get(s.subjectId) ?? 'Mata pelajaran',
            className: classById.get(s.classId) ?? 'Kelas',
            teacherName: s.teacherName ?? null,
          }));
        setItems(todays);
      })
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }, [user]);

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
