import { useEffect, useMemo, useState } from 'react';
import { apiClient, getApiErrorCode, getApiErrorMessage } from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { useAllClassesQuery, useAllSubjectsQuery } from '../../hooks/queries/useFilters';
import { env } from '../../config/env';
import { Spinner } from '../common/Spinner';
import type { PaginatedResponse } from '../../types/api';
import type { AcademicTerm } from '../../types/entities';

type ExportFormat = 'csv' | 'xlsx';

const SEMESTER_LABEL: Record<AcademicTerm['semester'], string> = { ganjil: 'Ganjil', genap: 'Genap' };

function termLabel(t: AcademicTerm): string {
  return `${t.yearLabel} · ${SEMESTER_LABEL[t.semester]}${t.isActive ? ' (Aktif)' : ''}`;
}

export function ReportsExportFilter() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const classesQuery = useAllClassesQuery();
  const subjectsQuery = useAllSubjectsQuery();
  const classes = useMemo(() => classesQuery.data ?? [], [classesQuery.data]);
  const subjects = useMemo(() => subjectsQuery.data ?? [], [subjectsQuery.data]);
  const [subjectId, setSubjectId] = useState<string>('');
  const [classId, setClassId] = useState<string>('');
  const [academicTermId, setAcademicTermId] = useState<string>('');
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {


    apiClient.get<PaginatedResponse<AcademicTerm>>('/academic-terms', { params: { pageSize: env.maxPageSize } })
      .then((res) => setTerms(res.data.items))
      .catch(() => setTerms([]));


  }, [user?.role]);

  const isClassRequired = isTeacher;
  const canSubmit = useMemo(() => {
    if (!academicTermId) return false;
    if (isClassRequired && !classId) return false;
    return true;
  }, [academicTermId, isClassRequired, classId]);

  async function handleExport() {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const response = await apiClient.get('/reports/attendance/export', {
        params: {
          academicTermId,
          format,
          ...(classId ? { classId } : {}),
          ...(subjectId ? { subjectId } : {}),
        },
        responseType: 'blob',
      });

      const disposition = response.headers['content-disposition'] as string | undefined;
      const filenameMatch = disposition?.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch?.[1] ?? `presensi.${format}`;

      const url = window.URL.createObjectURL(response.data as Blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const code = getApiErrorCode(err);
      if (code === 'CLASS_ID_REQUIRED_FOR_TEACHER') {
        setErrorMessage('Pilih kelas yang Anda ampu terlebih dahulu sebelum mengekspor laporan.');
      } else if (code === 'SCOPE_FORBIDDEN') {
        setErrorMessage('Anda hanya dapat mengekspor laporan untuk kelas yang Anda ampu.');
      } else if (code === 'FILTER_REQUIRED') {
        setErrorMessage('Pilih Semester dan Tahun Ajaran terlebih dahulu.');
      } else {
        setErrorMessage(getApiErrorMessage(err, 'Gagal mengekspor laporan. Coba lagi.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectClass = 'h-11 w-full rounded-md border border-gray-300 bg-white px-3.5 text-[14px] text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90';

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90" htmlFor="academicTermId">
          Semester &amp; Tahun Ajaran <span className="text-error-500">*</span>
        </label>
        <select
          id="academicTermId"
          className={selectClass}
          value={academicTermId}
          onChange={(e) => setAcademicTermId(e.target.value)}
        >
          <option value="">Pilih semester...</option>
          {terms.map((t) => (
            <option key={t.id} value={t.id}>{termLabel(t)}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90" htmlFor="classId">
          Kelas{' '}
          {isClassRequired ? (
            <span className="text-error-500">*</span>
          ) : (
            <span className="text-theme-xs font-normal text-gray-400">(opsional — kosongkan untuk seluruh sekolah)</span>
          )}
        </label>
        <select
          id="classId"
          className={selectClass}
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
        >
          <option value="">{isClassRequired ? 'Pilih kelas yang Anda ampu...' : 'Seluruh sekolah'}</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90" htmlFor="subjectId">
          Mata Pelajaran{' '}
          <span className="text-theme-xs font-normal text-gray-400">(opsional — kosongkan untuk semua mapel)</span>
        </label>
        <select
          id="subjectId"
          className={selectClass}
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
        >
          <option value="">Semua Mata Pelajaran</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div>
        <span className="mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90">Format</span>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-[14px] text-gray-700 dark:text-gray-300">
            <input type="radio" checked={format === 'xlsx'} onChange={() => setFormat('xlsx')} className="text-brand-500 focus:ring-brand-500/30" />
            Excel (.xlsx)
          </label>
          <label className="flex items-center gap-2 text-[14px] text-gray-700 dark:text-gray-300">
            <input type="radio" checked={format === 'csv'} onChange={() => setFormat('csv')} className="text-brand-500 focus:ring-brand-500/30" />
            CSV (.csv)
          </label>
        </div>
      </div>

      {errorMessage && (
        <p className="text-[13.5px] text-error-600" role="alert">{errorMessage}</p>
      )}

      <button
        type="button"
        className="flex h-11 items-center justify-center rounded-md bg-brand-500 px-5 text-[14px] font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
        disabled={!canSubmit || isSubmitting}
        onClick={handleExport}
      >
        {isSubmitting ? (
          <>
            <Spinner size="sm" className="mr-2" />
            Mengekspor...
          </>
        ) : (
          'Ekspor Laporan'
        )}
      </button>
    </div>
  );
}