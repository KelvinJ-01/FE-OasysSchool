import { useEffect, useMemo, useState } from 'react';
import { apiClient, getApiErrorCode, getApiErrorMessage } from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';

// TODO: pindahkan ke types/entities.ts saat file itu dibuat.
interface ClassOption {
  id: string;
  name: string;
}

interface AcademicTermOption {
  id: string;
  label: string;
}

type ExportFormat = 'csv' | 'xlsx';

export function ReportsExportFilter() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [terms, setTerms] = useState<AcademicTermOption[]>([]);
  const [classId, setClassId] = useState<string>('');
  const [academicTermId, setAcademicTermId] = useState<string>('');
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get<{ items: ClassOption[] }>('/classes', { params: { pageSize: 100 } })
      .then((res) => setClasses(res.data.items))
      .catch(() => setClasses([]));

    apiClient.get<{ items: AcademicTermOption[] }>('/academic-terms', { params: { pageSize: 100 } })
      .then((res) => setTerms(res.data.items))
      .catch(() => setTerms([]));
  }, []);

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

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="academicTermId">
          Semester &amp; Tahun Ajaran <span className="text-red-600">*</span>
        </label>
        <select
          id="academicTermId"
          className="w-full rounded border px-3 py-2"
          value={academicTermId}
          onChange={(e) => setAcademicTermId(e.target.value)}
        >
          <option value="">Pilih semester...</option>
          {terms.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="classId">
          Kelas {isClassRequired ? <span className="text-red-600">*</span> : <span className="text-gray-400">(opsional — kosongkan untuk seluruh sekolah)</span>}
        </label>
        <select
          id="classId"
          className="w-full rounded border px-3 py-2"
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
        <span className="block text-sm font-medium mb-1">Format</span>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input type="radio" checked={format === 'xlsx'} onChange={() => setFormat('xlsx')} />
            Excel (.xlsx)
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={format === 'csv'} onChange={() => setFormat('csv')} />
            CSV (.csv)
          </label>
        </div>
      </div>

      {errorMessage && (
        <p className="text-sm text-red-600" role="alert">{errorMessage}</p>
      )}

      <button
        type="button"
        className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        disabled={!canSubmit || isSubmitting}
        onClick={handleExport}
      >
        {isSubmitting ? 'Mengekspor...' : 'Ekspor Laporan'}
      </button>
    </div>
  );
}