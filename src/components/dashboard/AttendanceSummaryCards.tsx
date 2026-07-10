import { useEffect, useState } from 'react';
import { CircleCheck, Thermometer, FileText, CircleX, Clock } from 'lucide-react';
import { apiClient, getApiErrorCode, getApiErrorMessage } from '../../lib/apiClient';
import type { DashboardSummaryResponse } from '../../types/auth';

interface StatDef {
  key: keyof DashboardSummaryResponse['attendance'];
  label: string;
  icon: React.ReactNode;
  bg: string;
  text: string;
}

const STATS: StatDef[] = [
  { key: 'hadir', label: 'Hadir', icon: <CircleCheck size={20} aria-hidden="true" />, bg: 'bg-secondary-50', text: 'text-secondary-600' },
  { key: 'sakit', label: 'Sakit', icon: <Thermometer size={20} aria-hidden="true" />, bg: 'bg-warning-50', text: 'text-warning-600' },
  { key: 'izin', label: 'Izin', icon: <FileText size={20} aria-hidden="true" />, bg: 'bg-blue-light-50', text: 'text-blue-light-600' },
  { key: 'alpa', label: 'Alpa', icon: <CircleX size={20} aria-hidden="true" />, bg: 'bg-error-50', text: 'text-error-600' },
  { key: 'belumTercatat', label: 'Belum Tercatat', icon: <Clock size={20} aria-hidden="true" />, bg: 'bg-gray-100', text: 'text-gray-500' },
];

export function AttendanceSummaryCards() {
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<DashboardSummaryResponse>('/dashboard/summary')
      .then((res) => setSummary(res.data))
      .catch((err) => {
        const code = getApiErrorCode(err);
        setErrorMessage(
          code === 'NO_ACTIVE_ACADEMIC_TERM'
            ? 'Belum ada tahun ajaran aktif untuk sekolah Anda — hubungi Tim Pengembang untuk mengaktifkannya.'
            : getApiErrorMessage(err, 'Gagal memuat ringkasan presensi.'),
        );
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {STATS.map((s) => (
          <div key={s.key} className="h-[104px] animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
        ))}
      </div>
    );
  }

  if (errorMessage || !summary) {
    return (
      <div role="alert" className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
        {errorMessage ?? 'Ringkasan presensi tidak tersedia.'}
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-theme-xs font-medium uppercase text-gray-400">
        {summary.scope === 'class' ? 'Kelas yang Anda ampu' : 'Seluruh sekolah'} · {summary.totalStudents} siswa
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {STATS.map((s) => {
          const count = summary.attendance[s.key];
          const pct = summary.totalStudents > 0 ? Math.round((count / summary.totalStudents) * 100) : 0;
          return (
            <div key={s.key} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <span className={`flex size-9 items-center justify-center rounded-lg ${s.bg} ${s.text}`}>{s.icon}</span>
              <p className="mt-3 text-title-sm font-semibold text-gray-800 dark:text-white/90">{count}</p>
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                {s.label} · {pct}%
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}