import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { apiClient, getApiErrorCode, getApiErrorMessage } from '../../lib/apiClient';
import { Skeleton } from '../common/Skeleton';
import type { DashboardSummaryResponse } from '../../types/auth';

type StatKey = keyof DashboardSummaryResponse['attendance'];

const SEGMENTS: Array<{ key: StatKey; label: string; bar: string; dot: string }> = [
  { key: 'hadir', label: 'Hadir', bar: 'bg-secondary-500', dot: 'bg-secondary-500' },
  { key: 'sakit', label: 'Sakit', bar: 'bg-warning-400', dot: 'bg-warning-400' },
  { key: 'izin', label: 'Izin', bar: 'bg-blue-light-400', dot: 'bg-blue-light-400' },
  { key: 'alpa', label: 'Alpa', bar: 'bg-error-500', dot: 'bg-error-500' },
  { key: 'belumTercatat', label: 'Belum Tercatat', bar: 'bg-gray-300 dark:bg-gray-600', dot: 'bg-gray-300 dark:bg-gray-600' },
];

export function AttendanceSummaryCards() {
  const summaryQuery = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const { data } = await apiClient.get<DashboardSummaryResponse>('/dashboard/summary');
      return data;
    },
  });

  const summary = summaryQuery.data ?? null;
  const isLoading = summaryQuery.isPending;
  const errorMessage = summaryQuery.isError
    ? getApiErrorCode(summaryQuery.error) === 'NO_ACTIVE_ACADEMIC_TERM'
      ? 'Sekolah Anda belum punya tahun ajaran yang aktif. Silakan hubungi Tim Pengembang untuk mengaktifkannya.'
      : getApiErrorMessage(summaryQuery.error, 'Gagal memuat ringkasan presensi.')
    : null;

  if (isLoading) {
    return <Skeleton className="h-[220px] rounded-2xl" />;
  }

  if (errorMessage || !summary) {
    return (
      <div role="alert" className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
        {errorMessage ?? 'Ringkasan presensi tidak tersedia.'}
      </div>

    );
  }

  const total = summary.totalStudents;
  const hadir = summary.attendance.hadir;
  const rate = total > 0 ? Math.round((hadir / total) * 100) : 0;
  const scopeLabel = summary.scope === 'class' ? 'Kelas yang Anda ampu' : 'Seluruh sekolah';

  return (
    <div>
      <div className="rounded-2xl bg-[#1b3a6b] p-7 text-white dark:bg-[#16305a] sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-theme-xs font-medium uppercase tracking-wide text-white/60">Tingkat Kehadiran Hari Ini</p>

            <p className="mt-2 flex items-baseline gap-2">
              <span className="text-[56px] font-semibold leading-none sm:text-[64px]">{rate}%</span>

              <span className="text-theme-sm text-white/70">{hadir} dari {total} siswa hadir</span>

            </p>

          </div>

          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <Users size={22} aria-hidden="true" />

          </span>

        </div>

        <div className="mt-8 flex h-3.5 w-full overflow-hidden rounded-full bg-white/10" role="img" aria-label={`Proporsi status presensi: ${SEGMENTS.map((s) => `${s.label} ${summary.attendance[s.key]}`).join(', ')}`}>
          {SEGMENTS.map((s) => {
            const count = summary.attendance[s.key];
            if (count <= 0 || total <= 0) return null;
            return <div key={s.key} className={s.bar} style={{ width: `${(count / total) * 100}%` }} />;
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {SEGMENTS.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-theme-xs text-white/70">
              <span className={`size-2 rounded-full ${s.dot}`} aria-hidden="true" />

              {s.label} {summary.attendance[s.key]}
            </span>

          ))}
        </div>

        <p className="mt-4 text-theme-xs text-white/50">{scopeLabel} · {total} siswa aktif</p>

      </div>

    </div>

  );
}
