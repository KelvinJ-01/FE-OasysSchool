import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Spinner } from '../../components/common/Spinner';
import { apiClient, getApiErrorMessage } from '../../lib/apiClient';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Modal } from '../../components/ui/modal';
import { useModal } from '../../hooks/useModal';
import type { PaginatedResponse } from '../../types/api';
import type { AcademicTerm, Semester } from '../../types/entities';
import type { CreateAcademicTermRequest, UpdateAcademicTermRequest } from '../../types/dataMaster';

const SEMESTER_LABEL: Record<Semester, string> = { ganjil: 'Ganjil', genap: 'Genap' };
const PAGE_SIZE = 10;

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AcademicTermsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'administrator';

  const [items, setItems] = useState<AcademicTerm[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const { isOpen, openModal, closeModal } = useModal();
  const [editing, setEditing] = useState<AcademicTerm | null>(null);

  function load() {
    setIsLoading(true);
    setListError(null);
    apiClient
      .get<PaginatedResponse<AcademicTerm>>('/academic-terms', { params: { page: pageNumber, pageSize: PAGE_SIZE } })
      .then((res) => {
        setItems(res.data.items);
        setTotalPages(res.data.totalPages);
      })
      .catch((err) => setListError(getApiErrorMessage(err, 'Gagal memuat data tahun ajaran.')))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [pageNumber]);

  function openCreate() {
    setEditing(null);
    openModal();
  }

  function openEdit(term: AcademicTerm) {
    setEditing(term);
    openModal();
  }

  const columns: Column<AcademicTerm>[] = [
    {
      key: 'yearLabel',
      header: 'Tahun Ajaran',
      render: (t) => (
        <span className="flex items-center gap-2 font-medium text-gray-800 dark:text-white/90">
          {t.yearLabel} · {SEMESTER_LABEL[t.semester]}
          {t.isActive && <span className="rounded-full bg-secondary-50 px-2 py-0.5 text-theme-xs font-medium text-secondary-700">Aktif</span>}
        </span>
      ),
    },
    { key: 'startDate', header: 'Mulai', render: (t) => formatDate(t.startDate) },
    { key: 'endDate', header: 'Selesai', render: (t) => formatDate(t.endDate) },
    ...(isAdmin
      ? [
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (t: AcademicTerm) => (
              <button type="button" onClick={() => openEdit(t)} aria-label={`Ubah ${t.yearLabel}`} className="text-gray-400 hover:text-brand-500">
                <Pencil size={16} aria-hidden="true" />
              </button>
            ),
          } as Column<AcademicTerm>,
        ]
      : []),
  ];

  return (
    <div>
      {isAdmin && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={openCreate}
            className="flex h-10 items-center gap-1.5 rounded-md bg-brand-500 px-4 text-theme-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            <Plus size={16} aria-hidden="true" />
            Tambah Tahun Ajaran
          </button>
        </div>
      )}

      {listError && <div role="alert" className="mb-4 rounded-md border border-error-200 bg-error-50 px-3.5 py-3 text-[13.5px] text-error-700">{listError}</div>}

      <DataTable
        columns={columns}
        rows={items}
        getRowId={(t) => t.id}
        isLoading={isLoading}
        emptyMessage="Belum ada data tahun ajaran."
        pageNumber={pageNumber}
        totalPages={totalPages}
        onPageChange={setPageNumber}
      />

      {isAdmin && (
        <AcademicTermFormModal
          isOpen={isOpen}
          onClose={closeModal}
          term={editing}
          onSaved={() => {
            closeModal();
            toast.success(editing ? 'Tahun ajaran berhasil diubah.' : 'Tahun ajaran baru berhasil ditambahkan.');
            load();
          }}
        />
      )}
    </div>
  );
}

function AcademicTermFormModal({
  isOpen,
  onClose,
  term,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  term: AcademicTerm | null;
  onSaved: () => void;
}) {
  const isEdit = !!term;
  const [yearLabel, setYearLabel] = useState('');
  const [semester, setSemester] = useState<Semester>('ganjil');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setYearLabel(term?.yearLabel ?? '');
    setSemester(term?.semester ?? 'ganjil');
    setStartDate(term?.startDate?.slice(0, 10) ?? '');
    setEndDate(term?.endDate?.slice(0, 10) ?? '');
    setIsActive(term?.isActive ?? false);
    setError(null);
  }, [term, isOpen]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{4}\/\d{4}$/.test(yearLabel.trim())) { setError('Tahun ajaran wajib berformat 2025/2026.'); return; }
    if (!startDate || !endDate) { setError('Tanggal mulai dan selesai wajib diisi.'); return; }
    if (endDate <= startDate) { setError('Tanggal selesai harus setelah tanggal mulai.'); return; }
    setIsSubmitting(true);
    try {
      if (isEdit && term) {
        const payload: UpdateAcademicTermRequest = { yearLabel, semester, startDate, endDate, isActive };
        await apiClient.patch(`/academic-terms/${term.id}`, payload);
      } else {
        const payload: CreateAcademicTermRequest = { yearLabel, semester, startDate, endDate, isActive };
        await apiClient.post('/academic-terms', payload);
      }
      onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Gagal menyimpan data tahun ajaran.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-md">
      <div className="p-6">
        <h3 className="mb-5 pr-10 text-theme-sm font-semibold text-gray-800 dark:text-white/90">
          {isEdit ? 'Ubah Tahun Ajaran' : 'Tambah Tahun Ajaran'}
        </h3>
        {error && <div role="alert" className="mb-4 rounded-md border border-error-200 bg-error-50 px-3.5 py-3 text-[13.5px] text-error-700">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90">Label Tahun<span aria-hidden="true" className="text-error-500"> *</span></label>
            <input
              type="text"
              required
              value={yearLabel}
              onChange={(e) => setYearLabel(e.target.value)}
              placeholder="2026/2027"
              className="h-11 w-full rounded-md border border-gray-300 bg-white px-3.5 text-[14px] text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90">Semester<span aria-hidden="true" className="text-error-500"> *</span></label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value as Semester)}
              className="h-11 w-full rounded-md border border-gray-300 bg-white px-3.5 text-[14px] text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              <option value="ganjil">Ganjil</option>
              <option value="genap">Genap</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90">Mulai<span aria-hidden="true" className="text-error-500"> *</span></label>
              <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-[14px] text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
            </div>
            <div>
              <label className="mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90">Selesai<span aria-hidden="true" className="text-error-500"> *</span></label>
              <input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-[14px] text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
            </div>
          </div>

          <label className="flex items-start gap-2.5 text-[13.5px] text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/30" />
            <span>
              Jadikan tahun ajaran aktif
              {isActive && <span className="block text-theme-xs text-gray-500">Tahun ajaran aktif lainnya akan otomatis dinonaktifkan.</span>}
            </span>
          </label>

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