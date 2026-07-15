import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { DatePicker } from '../../components/common/DatePicker';
import { ActionIcons } from '../../components/common/ActionIcons';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useSchedulesQuery, useAllTermsQuery, useScheduleMutations } from '../../hooks/queries/useSchedules';
import { useAllClassesQuery, useAllSubjectsQuery } from '../../hooks/queries/useFilters';
import { useStaffDirectoryQuery } from '../../hooks/queries/useAttendance';
import { scheduleSchema } from '../../lib/schemas';
import { parseFormData, firstError } from '../../lib/validateForm';
import { todayIso, dayOfWeekFromIso, dayName, formatDayAndDate, nextDateForDayOfWeek } from '../../lib/dateUtils';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Spinner } from '../../components/common/Spinner';
import { getApiErrorCode, getApiErrorDetails, getApiErrorMessage } from '../../lib/apiClient';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Modal } from '../../components/ui/modal';
import { useModal } from '../../hooks/useModal';
import PageMeta from '../../components/common/PageMeta';
import PageBreadCrumb from '../../components/common/PageBreadCrumb';
import type { Schedule, ClassEntity, Subject, AcademicTerm } from '../../types/entities';
import type { UserDirectoryEntry } from '../../types/dataMaster';
import type { CreateScheduleRequest, UpdateScheduleRequest } from '../../types/schedule';

const PAGE_SIZE = 15;

export default function SchedulesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'administrator';


  const [classFilter, setClassFilter] = useState('');
  const [termFilter, setTermFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(todayIso);
  const [pageNumber, setPageNumber] = useState(1);

  const { isOpen, openModal, closeModal } = useModal();
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Schedule | null>(null);

  const classesQuery = useAllClassesQuery();
  const subjectsQuery = useAllSubjectsQuery();
  const teachersQuery = useStaffDirectoryQuery('teacher', isAdmin);
  const termsQuery = useAllTermsQuery();
  const classes = useMemo(() => classesQuery.data ?? [], [classesQuery.data]);
  const subjects = useMemo(() => subjectsQuery.data ?? [], [subjectsQuery.data]);
  const teachers = useMemo(() => teachersQuery.data ?? [], [teachersQuery.data]);
  const academicTerms = useMemo(() => termsQuery.data ?? [], [termsQuery.data]);

  useEffect(() => {
    if (termFilter) return;
    const active = academicTerms.find((t) => t.isActive);
    if (active) setTermFilter(active.id);
  }, [academicTerms, termFilter]);

  const listQuery = useSchedulesQuery({
    page: pageNumber,
    pageSize: PAGE_SIZE,
    classId: classFilter || undefined,
    academicTermId: termFilter || undefined,
    dayOfWeek: dayOfWeekFromIso(dateFilter),
  });
  const { remove } = useScheduleMutations();
  const items = useMemo(() => listQuery.data?.items ?? [], [listQuery.data]);
  const totalPages = listQuery.data?.totalPages ?? 1;
  const isLoading = listQuery.isPending;
  const listError = listQuery.isError ? getApiErrorMessage(listQuery.error, 'Gagal memuat data jadwal.') : null;

  const classNameById = useMemo(() => Object.fromEntries(classes.map((c) => [c.id, c.name])), [classes]);
  const subjectNameById = useMemo(() => Object.fromEntries(subjects.map((s) => [s.id, s.name])), [subjects]);
  const teacherNameById = useMemo(() => Object.fromEntries(teachers.map((t) => [t.id, t.fullName])), [teachers]);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)),
    [items],
  );

  function openCreate() {
    setEditing(null);
    openModal();
  }

  function openEdit(schedule: Schedule) {
    setEditing(schedule);
    openModal();
  }

  function scheduleLabel(schedule: Schedule): string {
    return `${dayName(schedule.dayOfWeek)} ${schedule.startTime}–${schedule.endTime} · ${classNameById[schedule.classId] ?? ''}`;
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const schedule = pendingDelete;
    try {
      await remove.mutateAsync(schedule.id);
      toast.success('Jadwal berhasil dihapus.');
      setPendingDelete(null);
    } catch (err) {
      const code = getApiErrorCode(err);
      toast.error(
        code === 'HAS_ATTENDANCE_HISTORY'
          ? 'Jadwal ini tidak bisa dihapus karena sudah memiliki riwayat presensi terkait.'
          : getApiErrorMessage(err, 'Gagal menghapus jadwal.'),
      );
      setPendingDelete(null);
    }
  }

  const columns: Column<Schedule>[] = [
    {
      key: 'day',
      header: 'Hari & Tanggal',
      render: (s) => (dayOfWeekFromIso(dateFilter) === s.dayOfWeek ? formatDayAndDate(dateFilter) : dayName(s.dayOfWeek)),
    },
    { key: 'time', header: 'Waktu', render: (s) => `${s.startTime}–${s.endTime}` },
    { key: 'class', header: 'Kelas', render: (s) => classNameById[s.classId] ?? '—' },
    { key: 'subject', header: 'Mata Pelajaran', render: (s) => subjectNameById[s.subjectId] ?? '—' },
    { key: 'teacher', header: 'Guru', render: (s) => s.teacherName ?? teacherNameById[s.teacherId] ?? '—' },
    ...(isAdmin
      ? [
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (s: Schedule) => (
              <ActionIcons
                label={scheduleLabel(s)}
                onEdit={() => openEdit(s)}
                onDelete={() => setPendingDelete(s)}
              />
            ),
          } as Column<Schedule>,
        ]
      : []),
  ];

  return (
    <>
      <PageMeta title="Jadwal Pembelajaran | Oasys School" description="Kelola jadwal pembelajaran sekolah" />
      <PageBreadCrumb pageTitle="Jadwal Pembelajaran" />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <select
            value={termFilter}
            onChange={(e) => { setTermFilter(e.target.value); setPageNumber(1); }}
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-theme-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            <option value="">Semua Tahun Ajaran</option>
            {academicTerms.map((t) => (
              <option key={t.id} value={t.id}>{t.yearLabel} · {t.semester === 'ganjil' ? 'Ganjil' : 'Genap'}{t.isActive ? ' (Aktif)' : ''}</option>
            ))}
          </select>
          <select
            value={classFilter}
            onChange={(e) => { setClassFilter(e.target.value); setPageNumber(1); }}
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-theme-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            <option value="">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <DatePicker
            value={dateFilter}
            onChange={(v) => { setDateFilter(v); setPageNumber(1); }}
            ariaLabel="Filter tanggal jadwal"
          />
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={openCreate}
            className="flex h-10 items-center gap-1.5 rounded-md bg-brand-500 px-4 text-theme-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            <Plus size={16} aria-hidden="true" />
            Tambah Jadwal
          </button>
        )}
      </div>

      {listError && <div role="alert" className="mb-4 rounded-md border border-error-200 bg-error-50 px-3.5 py-3 text-[13.5px] text-error-700">{listError}</div>}

      <DataTable
        columns={columns}
        rows={sortedItems}
        getRowId={(s) => s.id}
        isLoading={isLoading}
        emptyMessage="Belum ada jadwal untuk filter yang dipilih."
        pageNumber={pageNumber}
        totalPages={totalPages}
        onPageChange={setPageNumber}
      />

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title="Hapus Jadwal"
        description={pendingDelete ? `Jadwal "${scheduleLabel(pendingDelete)}" akan dihapus. Tindakan ini tidak dapat dibatalkan.` : ''}
        confirmLabel="Ya, Hapus"
        tone="danger"
        isProcessing={remove.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      {isAdmin && (
        <ScheduleFormModal
          isOpen={isOpen}
          onClose={closeModal}
          schedule={editing}
          classes={classes}
          subjects={subjects}
          teachers={teachers}
          academicTerms={academicTerms}
          defaultTermId={termFilter}
          onSaved={() => {
            closeModal();
            toast.success(editing ? 'Jadwal berhasil diubah.' : 'Jadwal baru berhasil ditambahkan.');
          }}
        />
      )}
    </>
  );
}

function ScheduleFormModal({
  isOpen,
  onClose,
  schedule,
  classes,
  subjects,
  teachers,
  academicTerms,
  defaultTermId,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule | null;
  classes: ClassEntity[];
  subjects: Subject[];
  teachers: UserDirectoryEntry[];
  academicTerms: AcademicTerm[];
  defaultTermId: string;
  onSaved: () => void;
}) {
  const isEdit = !!schedule;
  const { toast } = useToast();
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [academicTermId, setAcademicTermId] = useState(defaultTermId);
  const [sessionDate, setSessionDate] = useState(todayIso());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const { create, update } = useScheduleMutations();

  useEffect(() => {
    if (!isOpen) return;
    setClassId(schedule?.classId ?? '');
    setSubjectId(schedule?.subjectId ?? '');
    setTeacherId(schedule?.teacherId ?? '');
    setAcademicTermId(schedule?.academicTermId ?? defaultTermId);
    setSessionDate(schedule ? nextDateForDayOfWeek(schedule.dayOfWeek) : todayIso());
    setStartTime(schedule?.startTime ?? '');
    setEndTime(schedule?.endTime ?? '');
    setConflictError(null);
  }, [isOpen, schedule, defaultTermId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setConflictError(null);

    const parsed = parseFormData(scheduleSchema, {
      classId, subjectId, teacherId, academicTermId, sessionDate, startTime, endTime,
    });
    if (!parsed.success) {
      toast.error(firstError(parsed.errors) ?? 'Periksa kembali isian jadwal.');
      return;
    }

    const dayOfWeek = dayOfWeekFromIso(sessionDate);
    if (!dayOfWeek) {
      toast.error('Tanggal wajib dipilih.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit && schedule) {
        const payload: UpdateScheduleRequest = {
          classId, subjectId, teacherId, academicTermId, dayOfWeek, startTime, endTime,
        };
        await update.mutateAsync({ id: schedule.id, payload });
      } else {
        const payload: CreateScheduleRequest = {
          classId, subjectId, teacherId, academicTermId, dayOfWeek, startTime, endTime,
        };
        await create.mutateAsync(payload);
      }
      onSaved();
    } catch (err) {
      const code = getApiErrorCode(err);
      if (code === 'SCHEDULE_CONFLICT') {
        const details = getApiErrorDetails(err);
        setConflictError(details[0]?.message ?? 'Jadwal bentrok dengan entri lain.');
      } else {
        toast.error(getApiErrorMessage(err, 'Gagal menyimpan jadwal.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectClass = 'h-11 w-full rounded-md border border-gray-300 bg-white px-3.5 text-[14px] text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90';

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-lg">
      <div className="p-6">
        <h3 className="mb-5 pr-10 text-theme-sm font-semibold text-gray-800 dark:text-white/90">
          {isEdit ? 'Ubah Jadwal' : 'Tambah Jadwal'}
        </h3>

        {conflictError && (
          <div role="alert" className="mb-4 rounded-md border border-error-200 bg-error-50 px-3.5 py-3 text-[13.5px] text-error-700">
            {conflictError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90">Tahun Ajaran<span aria-hidden="true" className="text-error-500"> *</span></label>
              <select required value={academicTermId} onChange={(e) => setAcademicTermId(e.target.value)} className={selectClass}>
                <option value="">Pilih...</option>
                {academicTerms.map((t) => (
                  <option key={t.id} value={t.id}>{t.yearLabel} · {t.semester === 'ganjil' ? 'Ganjil' : 'Genap'}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90">Kelas<span aria-hidden="true" className="text-error-500"> *</span></label>
              <select required value={classId} onChange={(e) => setClassId(e.target.value)} className={selectClass}>
                <option value="">Pilih...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90">Mata Pelajaran<span aria-hidden="true" className="text-error-500"> *</span></label>
              <select required value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={selectClass}>
                <option value="">Pilih...</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90">Guru<span aria-hidden="true" className="text-error-500"> *</span></label>
              <select required value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className={selectClass}>
                <option value="">Pilih...</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.fullName}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90">Tanggal<span aria-hidden="true" className="text-error-500"> *</span></label>
            <DatePicker
              value={sessionDate}
              onChange={setSessionDate}
              ariaLabel="Tanggal jadwal"
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90">Jam Mulai<span aria-hidden="true" className="text-error-500"> *</span></label>
              <input type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} className={selectClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90">Jam Selesai<span aria-hidden="true" className="text-error-500"> *</span></label>
              <input type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} className={selectClass} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="h-10 rounded-md px-4 text-theme-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5">Batal</button>
            <button type="submit" disabled={isSubmitting} className="h-10 rounded-md bg-brand-500 px-5 text-theme-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60">
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