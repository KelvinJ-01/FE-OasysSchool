import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { apiClient, getApiErrorMessage } from '../../lib/apiClient';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Modal } from '../../components/ui/modal';
import { useModal } from '../../hooks/useModal';
import type { PaginatedResponse } from '../../types/api';
import type { Student, ClassEntity, StudentStatus } from '../../types/entities';
import type { CreateStudentRequest, UpdateStudentRequest, UpdateStudentStatusRequest } from '../../types/dataMaster';

const STATUS_LABEL: Record<StudentStatus, string> = {
  aktif: 'Aktif',
  pindah_sekolah: 'Pindah Sekolah',
  keluar: 'Keluar',
};

const PAGE_SIZE = 10;

export default function StudentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'administrator';

  const [items, setItems] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const { isOpen: isFormOpen, openModal: openFormModal, closeModal: closeFormModal } = useModal();
  const { isOpen: isStatusOpen, openModal: openStatusModal, closeModal: closeStatusModal } = useModal();
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  function loadStudents() {
    setIsLoading(true);
    setListError(null);
    apiClient
      .get<PaginatedResponse<Student>>('/students', {
        params: {
          page: pageNumber,
          pageSize: PAGE_SIZE,
          search: search || undefined,
          classId: classFilter || undefined,
        },
      })
      .then((res) => {
        setItems(res.data.items);
        setTotalPages(res.data.totalPages);
      })
      .catch((err) => setListError(getApiErrorMessage(err, 'Gagal memuat data siswa.')))
      .finally(() => setIsLoading(false));
  }

  useEffect(loadStudents, [pageNumber, classFilter]);

  useEffect(() => {
    apiClient
      .get<PaginatedResponse<ClassEntity>>('/classes', { params: { pageSize: 100 } })
      .then((res) => setClasses(res.data.items))
      .catch(() => setClasses([]));
  }, []);

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    setPageNumber(1);
    loadStudents();
  }

  function openCreate() {
    setEditingStudent(null);
    openFormModal();
  }

  function openEdit(student: Student) {
    setEditingStudent(student);
    openFormModal();
  }

  const columns: Column<Student>[] = [
    { key: 'fullName', header: 'Nama', render: (s) => <span className="font-medium text-gray-800 dark:text-white/90">{s.fullName}</span> },
    { key: 'nisn', header: 'NISN', render: (s) => s.nisn },
    { key: 'classId', header: 'Kelas', render: (s) => classes.find((c) => c.id === s.classId)?.name ?? '—' },
    {
      key: 'status',
      header: 'Status',
      render: (s) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-theme-xs font-medium ${
            s.status === 'aktif' ? 'bg-secondary-50 text-secondary-700' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {STATUS_LABEL[s.status]}
        </span>
      ),
    },
    ...(isAdmin
      ? [
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (s: Student) => (
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => openEdit(s)} className="text-theme-xs font-medium text-brand-500 hover:underline">
                  Ubah
                </button>
                {s.status === 'aktif' && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingStudent(s);
                      openStatusModal();
                    }}
                    className="text-theme-xs font-medium text-error-600 hover:underline"
                  >
                    Ubah Status
                  </button>
                )}
              </div>
            ),
          } as Column<Student>,
        ]
      : []),
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
              <Search size={16} aria-hidden="true" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau NISN..."
              className="h-10 w-56 rounded-md border border-gray-300 bg-white pl-9 pr-3 text-theme-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>
          <select
            value={classFilter}
            onChange={(e) => {
              setClassFilter(e.target.value);
              setPageNumber(1);
            }}
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-theme-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            <option value="">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </form>

        {isAdmin && (
          <button
            type="button"
            onClick={openCreate}
            className="flex h-10 items-center gap-1.5 rounded-md bg-brand-500 px-4 text-theme-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            <Plus size={16} aria-hidden="true" />
            Tambah Siswa
          </button>
        )}
      </div>

      {listError && (
        <div role="alert" className="mb-4 rounded-md border border-error-200 bg-error-50 px-3.5 py-3 text-[13.5px] text-error-700">
          {listError}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={items}
        getRowId={(s) => s.id}
        isLoading={isLoading}
        emptyMessage="Belum ada data siswa."
        pageNumber={pageNumber}
        totalPages={totalPages}
        onPageChange={setPageNumber}
      />

      {isAdmin && (
        <StudentFormModal
          isOpen={isFormOpen}
          onClose={closeFormModal}
          student={editingStudent}
          classes={classes}
          onSaved={() => {
            closeFormModal();
            toast.success(editingStudent ? 'Data siswa berhasil diubah.' : 'Siswa baru berhasil ditambahkan.');
            loadStudents();
          }}
        />
      )}

      {isAdmin && editingStudent && (
        <StudentStatusModal
          isOpen={isStatusOpen}
          onClose={closeStatusModal}
          student={editingStudent}
          onSaved={() => {
            closeStatusModal();
            toast.success('Status siswa berhasil diubah.');
            loadStudents();
          }}
        />
      )}
    </div>
  );
}

// --- Modal Tambah/Ubah Siswa -------------------------------------------------

function StudentFormModal({
  isOpen,
  onClose,
  student,
  classes,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  classes: ClassEntity[];
  onSaved: () => void;
}) {
  const isEdit = !!student;
  const [fullName, setFullName] = useState(student?.fullName ?? '');
  const [nisn, setNisn] = useState(student?.nisn ?? '');
  const [classId, setClassId] = useState(student?.classId ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFullName(student?.fullName ?? '');
    setNisn(student?.nisn ?? '');
    setClassId(student?.classId ?? '');
    setError(null);
  }, [student, isOpen]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (isEdit && student) {
        const payload: UpdateStudentRequest = { fullName, classId: classId || undefined };
        await apiClient.patch(`/students/${student.id}`, payload);
      } else {
        const payload: CreateStudentRequest = { fullName, nisn, classId: classId || undefined };
        await apiClient.post('/students', payload);
      }
      onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Gagal menyimpan data siswa.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-md">
      <div className="p-6">
        <h3 className="mb-5 text-theme-sm font-semibold text-gray-800 dark:text-white/90">
          {isEdit ? 'Ubah Siswa' : 'Tambah Siswa'}
        </h3>

        {error && (
          <div role="alert" className="mb-4 rounded-md border border-error-200 bg-error-50 px-3.5 py-3 text-[13.5px] text-error-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90">Nama Lengkap</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-11 w-full rounded-md border border-gray-300 bg-white px-3.5 text-[14px] text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>

          {!isEdit && (
            <div>
              <label className="mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90">NISN</label>
              <input
                type="text"
                required
                inputMode="numeric"
                maxLength={10}
                value={nisn}
                onChange={(e) => setNisn(e.target.value.replace(/\D/g, ''))}
                className="h-11 w-full rounded-md border border-gray-300 bg-white px-3.5 text-[14px] text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90">Kelas</label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="h-11 w-full rounded-md border border-gray-300 bg-white px-3.5 text-[14px] text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              <option value="">Belum ditentukan</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="h-10 rounded-md px-4 text-theme-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5">
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 rounded-md bg-brand-500 px-5 text-theme-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

// --- Modal Ubah Status Siswa -------------------------------------------------

function StudentStatusModal({
  isOpen,
  onClose,
  student,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState<Extract<StudentStatus, 'pindah_sekolah' | 'keluar'>>('pindah_sekolah');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const payload: UpdateStudentStatusRequest = { status, effectiveDate };
      await apiClient.patch(`/students/${student.id}/status`, payload);
      onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Gagal mengubah status siswa.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-md">
      <div className="p-6">
        <h3 className="mb-2 text-theme-sm font-semibold text-gray-800 dark:text-white/90">Ubah Status Siswa</h3>
        <p className="mb-5 text-[13px] text-gray-500 dark:text-gray-400">
          Data <span className="font-medium text-gray-700 dark:text-gray-300">{student.fullName}</span> dan riwayat
          presensinya tetap tersimpan (BR-5.3) — hanya statusnya yang berubah, tidak dihapus.
        </p>

        {error && (
          <div role="alert" className="mb-4 rounded-md border border-error-200 bg-error-50 px-3.5 py-3 text-[13.5px] text-error-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90">Status Baru</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="h-11 w-full rounded-md border border-gray-300 bg-white px-3.5 text-[14px] text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              <option value="pindah_sekolah">Pindah Sekolah</option>
              <option value="keluar">Keluar</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90">Tanggal Efektif</label>
            <input
              type="date"
              required
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className="h-11 w-full rounded-md border border-gray-300 bg-white px-3.5 text-[14px] text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="h-10 rounded-md px-4 text-theme-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5">
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 rounded-md bg-error-600 px-5 text-theme-sm font-medium text-white transition-colors hover:bg-error-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Menyimpan...' : 'Ubah Status'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}