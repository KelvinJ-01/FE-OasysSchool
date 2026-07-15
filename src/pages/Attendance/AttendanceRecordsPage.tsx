import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Pencil, History, CircleCheck, Thermometer, FileText, CircleX } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { getAllClasses } from '../../services/classesService';
import { getAllSubjects } from '../../services/subjectsService';
import { env } from '../../config/env';
import { Spinner } from '../../components/common/Spinner';
import { DatePicker } from '../../components/common/DatePicker';
import { todayIso } from '../../lib/dateUtils';
import { Download } from 'lucide-react';
import { ReportsExportFilter } from '../../components/reports/ReportsExportFilter';
import { apiClient, getApiErrorCode, getApiErrorMessage } from '../../lib/apiClient';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Skeleton } from '../../components/common/Skeleton';
import { Modal } from '../../components/ui/modal';
import { useModal } from '../../hooks/useModal';
import PageMeta from '../../components/common/PageMeta';
import PageBreadCrumb from '../../components/common/PageBreadCrumb';
import type { PaginatedResponse } from '../../types/api';
import type { AttendanceRecord, AttendanceStatus, ClassEntity, Schedule, Student, Subject } from '../../types/entities';
import type { UserDirectoryEntry } from '../../types/dataMaster';
import type { UpdateAttendanceStatusRequest, AttendanceHistoryResponse } from '../../types/attendance';

const ROLE_LABEL: Record<string, string> = {
  administrator: 'Administrator',
  teacher: 'Guru',
  parent: 'Orang Tua',
  developer: 'Tim Pengembang',
};

const STATUS_META: Record<AttendanceStatus, { label: string; className: string; icon: React.ReactNode }> = {
  hadir: { label: 'Hadir', className: 'bg-secondary-50 text-secondary-700', icon: <CircleCheck size={13} aria-hidden="true" /> },
  sakit: { label: 'Sakit', className: 'bg-warning-50 text-warning-700', icon: <Thermometer size={13} aria-hidden="true" /> },
  izin: { label: 'Izin', className: 'bg-blue-light-50 text-blue-light-700', icon: <FileText size={13} aria-hidden="true" /> },
  alpa: { label: 'Alpa', className: 'bg-error-50 text-error-700', icon: <CircleX size={13} aria-hidden="true" /> },
};

const PAGE_SIZE = 20;

export default function AttendanceRecordsPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [sessionDate, setSessionDate] = useState(todayIso());
  const { isOpen: isExportOpen, openModal: openExportModal, closeModal: closeExportModal } = useModal();
  const [statusFilter, setStatusFilter] = useState('');

  const [students, setStudents] = useState<Student[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<UserDirectoryEntry[]>([]);
  const [administrators, setAdministrators] = useState<UserDirectoryEntry[]>([]);

  const [items, setItems] = useState<AttendanceRecord[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const { isOpen: isCorrectOpen, openModal: openCorrectModal, closeModal: closeCorrectModal } = useModal();
  const { isOpen: isHistoryOpen, openModal: openHistoryModal, closeModal: closeHistoryModal } = useModal();
  const [activeRecord, setActiveRecord] = useState<AttendanceRecord | null>(null);

  const loadFilters = useCallback(() => {
    getAllClasses()
      .then((items) => setClasses(items)).catch(() => setClasses([]));
    getAllSubjects()
      .then((items) => setSubjects(items)).catch(() => setSubjects([]));
  }, []);

  useEffect(() => {
    loadFilters();

    if (user?.role === 'administrator') {
      apiClient.get<PaginatedResponse<UserDirectoryEntry>>('/users', { params: { role: 'teacher', pageSize: env.maxPageSize } })
        .then((res) => setTeachers(res.data.items)).catch(() => setTeachers([]));
      apiClient.get<PaginatedResponse<UserDirectoryEntry>>('/users', { params: { role: 'administrator', pageSize: env.maxPageSize } })
        .then((res) => setAdministrators(res.data.items)).catch(() => setAdministrators([]));
    }
  }, [user?.role, loadFilters]);

  useEffect(() => {
    function onFocus() { loadFilters(); }
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [loadFilters]);

  useEffect(() => {
    if (!classId) {
      setStudents([]);
      setSchedules([]);
      return;
    }
    apiClient.get<PaginatedResponse<Student>>('/students', { params: { classId, pageSize: env.maxPageSize } })
      .then((res) => setStudents(res.data.items)).catch(() => setStudents([]));
    apiClient.get<PaginatedResponse<Schedule>>('/schedules', { params: { classId, pageSize: env.maxPageSize } })
      .then((res) => setSchedules(res.data.items)).catch(() => setSchedules([]));
  }, [classId]);

  function load() {
    if (!classId) return;
    setIsLoading(true);
    setListError(null);
    apiClient
      .get<PaginatedResponse<AttendanceRecord>>('/attendance-records', {
        params: {
          classId,
          sessionDate,
          subjectId: subjectId || undefined,
          status: statusFilter || undefined,
          page: pageNumber,
          pageSize: PAGE_SIZE,
        },
      })
      .then((res) => {
        setItems(res.data.items);
        setTotalPages(res.data.totalPages);
      })
      .catch((err) => setListError(getApiErrorMessage(err, 'Gagal memuat data presensi.')))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [classId, sessionDate, subjectId, statusFilter, pageNumber]);

  const studentById = useMemo(() => Object.fromEntries(students.map((s) => [s.id, s])), [students]);
  const scheduleById = useMemo(() => Object.fromEntries(schedules.map((s) => [s.id, s])), [schedules]);
  const subjectNameById = useMemo(() => Object.fromEntries(subjects.map((s) => [s.id, s.name])), [subjects]);

  const staffNameById = useMemo(
    () => Object.fromEntries([...teachers, ...administrators].map((t) => [t.id, t.fullName])),
    [teachers, administrators],
  );

  function openCorrect(record: AttendanceRecord) {
    setActiveRecord(record);
    openCorrectModal();
  }

  function openHistory(record: AttendanceRecord) {
    setActiveRecord(record);
    openHistoryModal();
  }

  const columns: Column<AttendanceRecord>[] = [
    { key: 'student', header: 'Siswa', render: (r) => studentById[r.studentId]?.fullName ?? '—' },
    {
      key: 'schedule',
      header: 'Mata Pelajaran',
      render: (r) => {
        const sch = scheduleById[r.scheduleId];
        return sch ? `${subjectNameById[sch.subjectId] ?? '—'} (${sch.startTime}–${sch.endTime})` : '—';
      },
    },
    { key: 'scannedAt', header: 'Waktu Pindai', render: (r) => (r.scannedAt ? new Date(r.scannedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—') },
    {
      key: 'status',
      header: 'Status',
      render: (r) => {
        const meta = STATUS_META[r.status];
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-theme-xs font-medium ${meta.className}`}>
            {meta.icon}
            {meta.label}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (r) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => openHistory(r)}
            aria-label="Lihat riwayat perubahan"
            title="Riwayat"
            className="flex size-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-gray-200"
          >
            <History size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => openCorrect(r)}
            aria-label="Koreksi status"
            title="Koreksi"
            className="flex size-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10"
          >
            <Pencil size={16} aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ];

  const selectClass = 'h-10 rounded-md border border-gray-300 bg-white px-3 text-theme-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300';

  return (
    <>
      <PageMeta title="Presensi | Oasys School" description="Lihat dan koreksi presensi siswa" />
      <PageBreadCrumb pageTitle="Presensi" />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select value={classId} onChange={(e) => { setClassId(e.target.value); setPageNumber(1); }} className={selectClass}>
          <option value="">Pilih kelas...</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={subjectId}
          onChange={(e) => { setSubjectId(e.target.value); setPageNumber(1); }}
          aria-label="Filter mata pelajaran"
          className={selectClass}
        >
          <option value="">Semua Mata Pelajaran</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <DatePicker
          value={sessionDate}
          onChange={(v) => { setSessionDate(v); setPageNumber(1); }}
          ariaLabel="Filter tanggal presensi"
        />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPageNumber(1); }} className={selectClass}>
          <option value="">Semua Status</option>
          {(Object.keys(STATUS_META) as AttendanceStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_META[s].label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={openExportModal}
          className="ml-auto flex h-10 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 text-theme-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
        >
          <Download size={16} aria-hidden="true" />
          Ekspor Laporan
        </button>
      </div>

      <Modal isOpen={isExportOpen} onClose={closeExportModal} className="m-4 max-w-xl">
        <div className="max-h-[85vh] overflow-y-auto p-6">
          <h3 className="mb-1 pr-10 text-theme-sm font-semibold text-gray-800 dark:text-white/90">Ekspor Laporan Presensi</h3>
          <p className="mb-4 text-[13px] text-gray-500 dark:text-gray-400">Unduh rekap presensi dalam format Excel atau CSV.</p>
          <ReportsExportFilter />
        </div>
      </Modal>

      {!classId && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-10 text-center text-theme-sm text-gray-400 dark:border-gray-800 dark:bg-white/[0.02]">
          Pilih kelas terlebih dahulu untuk melihat presensi.
        </div>
      )}

      {classId && listError && (
        <div role="alert" className="mb-4 rounded-md border border-error-200 bg-error-50 px-3.5 py-3 text-[13.5px] text-error-700">
          {listError}
        </div>
      )}

      {classId && (
        <DataTable
          columns={columns}
          rows={items}
          getRowId={(r) => r.id}
          isLoading={isLoading}
          emptyMessage="Belum ada rekaman presensi untuk filter yang dipilih."
          pageNumber={pageNumber}
          totalPages={totalPages}
          onPageChange={setPageNumber}
        />
      )}

      {activeRecord && (
        <CorrectStatusModal
          isOpen={isCorrectOpen}
          onClose={closeCorrectModal}
          record={activeRecord}
          studentName={studentById[activeRecord.studentId]?.fullName ?? 'siswa ini'}
          onSaved={() => {
            closeCorrectModal();
            toast.success('Status presensi berhasil diubah.');
            load();
          }}
        />
      )}

      {activeRecord && (
        <HistoryModal
          isOpen={isHistoryOpen}
          onClose={closeHistoryModal}
          record={activeRecord}
          studentName={studentById[activeRecord.studentId]?.fullName ?? 'siswa ini'}
          staffNameById={staffNameById}
        />
      )}
    </>
  );
}

function CorrectStatusModal({
  isOpen,
  onClose,
  record,
  studentName,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecord;
  studentName: string;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [status, setStatus] = useState<AttendanceStatus>('hadir');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStatus(record.status);
    }
  }, [isOpen, record]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: UpdateAttendanceStatusRequest = { status, previousStatus: record.status };
      await apiClient.patch(`/attendance-records/${record.id}/status`, payload);
      onSaved();
    } catch (err) {
      const code = getApiErrorCode(err);
      toast.error(code === 'STATUS_UNCHANGED' ? 'Status yang dipilih sama dengan status saat ini.' : getApiErrorMessage(err, 'Gagal mengubah status.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-sm">
      <div className="p-6">
        <h3 className="mb-2 pr-10 text-theme-sm font-semibold text-gray-800 dark:text-white/90">Koreksi Status Presensi</h3>
        <p className="mb-5 text-[13px] text-gray-500 dark:text-gray-400">
          Mengubah status kehadiran <span className="font-medium text-gray-700 dark:text-gray-300">{studentName}</span>{' '}
          (saat ini: <span className="font-medium">{STATUS_META[record.status].label}</span>).
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-2.5">
            {(Object.keys(STATUS_META) as AttendanceStatus[]).map((opt) => (
              <label key={opt} className={`cursor-pointer rounded-md border px-3.5 py-2.5 text-center text-theme-sm font-medium transition-colors ${
                status === opt ? 'border-brand-500 bg-brand-25 text-brand-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300'
              }`}>
                <input type="radio" name="status" value={opt} checked={status === opt} onChange={() => setStatus(opt)} className="sr-only" />
                {STATUS_META[opt].label}
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="h-10 rounded-md px-4 text-theme-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5">Batal</button>
            <button type="submit" disabled={isSubmitting || status === record.status} className="h-10 rounded-md bg-brand-500 px-5 text-theme-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60">
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function HistoryModal({
  isOpen,
  onClose,
  record,
  studentName,
  staffNameById,
}: {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecord;
  studentName: string;
  staffNameById: Record<string, string>;
}) {
  const [history, setHistory] = useState<AttendanceHistoryResponse>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    setError(null);
    apiClient
      .get<AttendanceHistoryResponse>(`/attendance-records/${record.id}/history`)
      .then((res) => setHistory(res.data))
      .catch((err) => setError(getApiErrorMessage(err, 'Gagal memuat riwayat.')))
      .finally(() => setIsLoading(false));
  }, [isOpen, record.id]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-md">
      <div className="p-6">
        <h3 className="mb-1 text-theme-sm font-semibold text-gray-800 dark:text-white/90">Riwayat Perubahan Status</h3>
        <p className="mb-5 text-[13px] text-gray-500 dark:text-gray-400">{studentName}</p>

        {isLoading && <Skeleton className="h-20 rounded-md" />}
        {error && <p className="text-[13.5px] text-error-600">{error}</p>}

        {!isLoading && !error && history.length === 0 && (
          <p className="text-theme-sm text-gray-400">Belum ada perubahan status untuk rekaman ini.</p>
        )}

        {!isLoading && !error && history.length > 0 && (
          <ul className="space-y-3">
            {history.map((h) => (
              <li key={h.id} className="rounded-md border border-gray-100 px-3.5 py-2.5 text-theme-sm dark:border-gray-800">
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">{STATUS_META[h.oldStatus].label}</span> →{' '}
                  <span className="font-medium">{STATUS_META[h.newStatus].label}</span>
                </p>
                <p className="mt-0.5 text-theme-xs text-gray-400">
                  {h.changedByName ?? staffNameById[h.changedBy] ?? 'Staf sekolah'}
                  {h.changedByRole ? ` (${ROLE_LABEL[h.changedByRole] ?? h.changedByRole})` : ''}
                  {' · '}
                  {new Date(h.changedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}