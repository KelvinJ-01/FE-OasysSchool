import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Upload } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Spinner } from '../../components/common/Spinner';
import { apiClient, getApiErrorMessage } from '../../lib/apiClient';
import { useQueryClient } from '@tanstack/react-query';
import { useClassesPageQuery, useClassMutations } from '../../hooks/queries/useAcademic';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Modal } from '../../components/ui/modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ActionIcons } from '../../components/common/ActionIcons';
import { ImportModal } from '../../components/common/ImportModal';
import { useModal } from '../../hooks/useModal';
import type { ClassEntity } from '../../types/entities';
import { EDUCATION_LEVEL_LABEL, GRADE_OPTIONS, type CreateClassRequest, type UpdateClassRequest } from '../../types/dataMaster';
import type { EducationLevel } from '../../types/entities';
import { toUpperCaseClean } from '../../lib/format';
import { classSchema } from '../../lib/schemas';
import { parseFormData, firstError } from '../../lib/validateForm';

const PAGE_SIZE = 10;

export default function ClassesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'administrator';

  const [pageNumber, setPageNumber] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<ClassEntity | null>(null);

  const listQuery = useClassesPageQuery({ page: pageNumber, pageSize: PAGE_SIZE });
  const { remove } = useClassMutations();
  const queryClient = useQueryClient();
  const items = listQuery.data?.items ?? [];
  const totalPages = listQuery.data?.totalPages ?? 1;
  const isLoading = listQuery.isPending;
  const listError = listQuery.isError ? getApiErrorMessage(listQuery.error, 'Gagal memuat data kelas.') : null;
  const isDeleting = remove.isPending;

  const { isOpen, openModal, closeModal } = useModal();
  const { isOpen: isImportOpen, openModal: openImportModal, closeModal: closeImportModal } = useModal();
  const [editing, setEditing] = useState<ClassEntity | null>(null);

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await remove.mutateAsync(pendingDelete.id);
      toast.success(`Kelas "${pendingDelete.name}" dihapus.`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Gagal menghapus kelas.'));
    } finally {
      setPendingDelete(null);
    }
  }

  const columns: Column<ClassEntity>[] = [
    { key: 'name', header: 'Nama Kelas', render: (c) => <span className="font-medium text-gray-800 dark:text-white/90">{c.name}</span> },

    { key: 'educationLevel', header: 'Jenjang', render: (c) => (c.educationLevel ? EDUCATION_LEVEL_LABEL[c.educationLevel] : '—') },
    { key: 'gradeLevel', header: 'Tingkat', render: (c) => c.gradeLevel ?? '—' },
    { key: 'studentCount', header: 'Jumlah Murid', render: (c) => (c.studentCount !== undefined ? `${c.studentCount} siswa` : '—') },
    { key: 'homeroom', header: 'Wali Kelas', render: (c) => c.homeroomTeacherName ?? '—' },
    ...(isAdmin
      ? [
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (c: ClassEntity) => (
              <ActionIcons
                label={c.name}
                onEdit={() => { setEditing(c); openModal(); }}
                onDelete={() => setPendingDelete(c)}
              />
            ),
          } as Column<ClassEntity>,
        ]
      : []),
  ];

  return (
    <div>
      {isAdmin && (
        <div className="mb-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={openImportModal}
            className="flex h-10 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 text-theme-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
          >
            <Upload size={16} aria-hidden="true" />

            Impor
          </button>

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
          }}
        />
      )}
      <ImportModal
        isOpen={isImportOpen}
        onClose={closeImportModal}
        resource="classes"
        resourceLabel="Kelas"
        onImported={(result) => {
          closeImportModal();
          toast.success(result.message);
          void queryClient.invalidateQueries({ queryKey: ['classes'] });
        }}
      />

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title="Hapus Kelas"
        description={pendingDelete ? `Anda akan menghapus kelas "${pendingDelete.name}". Tindakan ini tidak dapat dibatalkan.` : ''}
        confirmLabel="Ya, Hapus"
        tone="danger"
        isProcessing={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>

  );
}

function ClassFormModal({ isOpen, onClose, cls, onSaved }: { isOpen: boolean; onClose: () => void; cls: ClassEntity | null; onSaved: () => void }) {
  const isEdit = !!cls;
  const [name, setName] = useState(cls?.name ?? '');
  const [educationLevel, setEducationLevel] = useState<'' | EducationLevel>(cls?.educationLevel ?? '');
  const [gradeLevel, setGradeLevel] = useState(cls?.gradeLevel ?? '');
  const [homeroomTeacherId, setHomeroomTeacherId] = useState(cls?.homeroomTeacherId ?? '');
  const [teachers, setTeachers] = useState<Array<{ id: string; fullName: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { create, update } = useClassMutations();

  useEffect(() => {
    setName(cls?.name ?? '');
    setEducationLevel(cls?.educationLevel ?? '');
    setGradeLevel(cls?.gradeLevel ?? '');
    setHomeroomTeacherId(cls?.homeroomTeacherId ?? '');
    setError(null);
  }, [cls, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    apiClient
      .get<{ items: Array<{ id: string; fullName: string }> }>('/users', { params: { role: 'teacher', pageSize: 100 } })
      .then((res) => setTeachers(res.data.items))
      .catch(() => setTeachers([]));
  }, [isOpen]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = parseFormData(classSchema, {
      name, educationLevel: educationLevel || undefined,
      gradeLevel: gradeLevel || undefined,
      homeroomTeacherId: homeroomTeacherId || undefined,
    });
    if (!parsed.success) { setError(firstError(parsed.errors)); return; }
    setIsSubmitting(true);
    try {
      if (isEdit && cls) {
        const payload: UpdateClassRequest = { name: toUpperCaseClean(name), educationLevel: educationLevel || undefined, gradeLevel: gradeLevel || undefined, homeroomTeacherId: homeroomTeacherId || undefined };
        await update.mutateAsync({ id: cls.id, payload });
      } else {
        const payload: CreateClassRequest = { name: toUpperCaseClean(name), educationLevel: educationLevel || undefined, gradeLevel: gradeLevel || undefined, homeroomTeacherId: homeroomTeacherId || undefined };
        await create.mutateAsync(payload);
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
        <h3 className="mb-5 pr-10 text-theme-sm font-semibold text-gray-800 dark:text-white/90">{isEdit ? 'Ubah Kelas' : 'Tambah Kelas'}</h3>

        {error && <div role="alert" className="mb-4 rounded-md border border-error-200 bg-error-50 px-3.5 py-3 text-[13.5px] text-error-700">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90">Nama Kelas<span aria-hidden="true" className="text-error-500"> *</span></label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={(e) => setName(toUpperCaseClean(e.target.value))}
              placeholder="mis. 7A, XII IPA 1"
              className="h-11 w-full rounded-md border border-gray-300 bg-white px-3.5 text-[14px] text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />

          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90">Jenjang<span aria-hidden="true" className="text-error-500"> *</span></label>
              <select
                value={educationLevel}
                onChange={(e) => { setEducationLevel(e.target.value as EducationLevel | ''); setGradeLevel(''); }}
                className="h-11 w-full rounded-md border border-gray-300 bg-white px-3.5 text-[14px] text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="">Pilih jenjang</option>

                {(Object.keys(EDUCATION_LEVEL_LABEL) as EducationLevel[]).map((lv) => (
                  <option key={lv} value={lv}>{EDUCATION_LEVEL_LABEL[lv]}</option>

                ))}
              </select>

            </div>

            <div>
              <label className="mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90">Tingkat</label>

              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                disabled={!educationLevel}
                className="h-11 w-full rounded-md border border-gray-300 bg-white px-3.5 text-[14px] text-gray-900 outline-none focus:border-brand-500 disabled:cursor-not-allowed disabled:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:disabled:bg-white/5"
              >
                <option value="">{educationLevel ? 'Pilih tingkat' : 'Pilih jenjang dahulu'}</option>

                {educationLevel && GRADE_OPTIONS[educationLevel].map((g) => (
                  <option key={g} value={g}>{g}</option>

                ))}
              </select>

            </div>

          </div>

          <div>
            <label className="mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90">Wali Kelas</label>

            <select
              value={homeroomTeacherId}
              onChange={(e) => setHomeroomTeacherId(e.target.value)}
              className="h-11 w-full rounded-md border border-gray-300 bg-white px-3.5 text-[14px] text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              <option value="">Belum ditentukan</option>

              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.fullName}</option>

              ))}
            </select>

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
