import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Spinner } from '../../components/common/Spinner';
import { apiClient, getApiErrorMessage } from '../../lib/apiClient';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Modal } from '../../components/ui/modal';
import { useModal } from '../../hooks/useModal';
import type { PaginatedResponse } from '../../types/api';
import type { ClassEntity } from '../../types/entities';
import type { CreateClassRequest, UpdateClassRequest } from '../../types/dataMaster';

const PAGE_SIZE = 10;

export default function ClassesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'administrator';

  const [items, setItems] = useState<ClassEntity[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { isOpen, openModal, closeModal } = useModal();
  const [editing, setEditing] = useState<ClassEntity | null>(null);

  function load() {
    setIsLoading(true);
    setListError(null);
    apiClient
      .get<PaginatedResponse<ClassEntity>>('/classes', { params: { page: pageNumber, pageSize: PAGE_SIZE } })
      .then((res) => {
        setItems(res.data.items);
        setTotalPages(res.data.totalPages);
      })
      .catch((err) => setListError(getApiErrorMessage(err, 'Gagal memuat data kelas.')))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [pageNumber]);

  async function handleDelete(cls: ClassEntity) {
    setDeleteError(null);
    if (!window.confirm(`Hapus kelas "${cls.name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      await apiClient.delete(`/classes/${cls.id}`);
      toast.success(`Kelas "${cls.name}" berhasil dihapus.`);
      load();
    } catch (err) {
      setDeleteError(getApiErrorMessage(err, `Gagal menghapus "${cls.name}" — kemungkinan masih ada siswa aktif di kelas ini.`));
    }
  }

  const columns: Column<ClassEntity>[] = [
    { key: 'name', header: 'Nama Kelas', render: (c) => <span className="font-medium text-gray-800 dark:text-white/90">{c.name}</span> },
    { key: 'gradeLevel', header: 'Tingkat', render: (c) => c.gradeLevel ?? '—' },
    ...(isAdmin
      ? [
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (c: ClassEntity) => (
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setEditing(c); openModal(); }} aria-label={`Ubah ${c.name}`} className="text-gray-400 hover:text-brand-500">
                  <Pencil size={16} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => handleDelete(c)} aria-label={`Hapus ${c.name}`} className="text-gray-400 hover:text-error-600">
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            ),
          } as Column<ClassEntity>,
        ]
      : []),
  ];

  return (
    <div>
      {isAdmin && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => { setEditing(null); openModal(); }}
            className="flex h-10 items-center gap-1.5 rounded-md bg-brand-500 px-4 text-theme-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            <Plus size={16} aria-hidden="true" />
            Tambah Kelas
          </button>
        </div>
      )}

      {listError && <div role="alert" className="mb-4 rounded-md border border-error-200 bg-error-50 px-3.5 py-3 text-[13.5px] text-error-700">{listError}</div>}
      {deleteError && <div role="alert" className="mb-4 rounded-md border border-error-200 bg-error-50 px-3.5 py-3 text-[13.5px] text-error-700">{deleteError}</div>}

      <DataTable
        columns={columns}
        rows={items}
        getRowId={(c) => c.id}
        isLoading={isLoading}
        emptyMessage="Belum ada data kelas."
        pageNumber={pageNumber}
        totalPages={totalPages}
        onPageChange={setPageNumber}
      />

      {isAdmin && (
        <ClassFormModal
          isOpen={isOpen}
          onClose={closeModal}
          cls={editing}
          onSaved={() => {
            closeModal();
            toast.success(editing ? 'Kelas berhasil diubah.' : 'Kelas baru berhasil ditambahkan.');
            load();
          }}
        />
      )}
    </div>
  );
}

function ClassFormModal({ isOpen, onClose, cls, onSaved }: { isOpen: boolean; onClose: () => void; cls: ClassEntity | null; onSaved: () => void }) {
  const isEdit = !!cls;
  const [name, setName] = useState(cls?.name ?? '');
  const [gradeLevel, setGradeLevel] = useState(cls?.gradeLevel ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(cls?.name ?? '');
    setGradeLevel(cls?.gradeLevel ?? '');
    setError(null);
  }, [cls, isOpen]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (isEdit && cls) {
        const payload: UpdateClassRequest = { name, gradeLevel: gradeLevel || undefined };
        await apiClient.patch(`/classes/${cls.id}`, payload);
      } else {
        const payload: CreateClassRequest = { name, gradeLevel: gradeLevel || undefined };
        await apiClient.post('/classes', payload);
      }
      onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Gagal menyimpan data kelas.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-md">
      <div className="p-6">
        <h3 className="mb-5 text-theme-sm font-semibold text-gray-800 dark:text-white/90">{isEdit ? 'Ubah Kelas' : 'Tambah Kelas'}</h3>
        {error && <div role="alert" className="mb-4 rounded-md border border-error-200 bg-error-50 px-3.5 py-3 text-[13.5px] text-error-700">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90">Nama Kelas</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="mis. 7A, XII IPA 1"
              className="h-11 w-full rounded-md border border-gray-300 bg-white px-3.5 text-[14px] text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90">Tingkat (opsional)</label>
            <input
              type="text"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              placeholder="mis. 7, XII"
              className="h-11 w-full rounded-md border border-gray-300 bg-white px-3.5 text-[14px] text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
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