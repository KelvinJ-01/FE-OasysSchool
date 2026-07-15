import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Upload } from 'lucide-react';
import { toTitleCase } from '../../lib/format';
import { subjectSchema } from '../../lib/schemas';
import { parseFormData, firstError } from '../../lib/validateForm';
import { ActionIcons } from '../../components/common/ActionIcons';
import { ImportModal } from '../../components/common/ImportModal';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Spinner } from '../../components/common/Spinner';
import { apiClient, getApiErrorMessage } from '../../lib/apiClient';
import { useQueryClient } from '@tanstack/react-query';
import { useSubjectsPageQuery, useSubjectMutations } from '../../hooks/queries/useAcademic';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Modal } from '../../components/ui/modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useModal } from '../../hooks/useModal';
import type { Subject } from '../../types/entities';
import type { CreateSubjectRequest, UpdateSubjectRequest } from '../../types/dataMaster';

const PAGE_SIZE = 10;

export default function SubjectsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'administrator';


  const [pageNumber, setPageNumber] = useState(1);
  const listQuery = useSubjectsPageQuery({ page: pageNumber, pageSize: PAGE_SIZE });
  const { remove } = useSubjectMutations();
  const queryClient = useQueryClient();
  const items = listQuery.data?.items ?? [];
  const totalPages = listQuery.data?.totalPages ?? 1;
  const isLoading = listQuery.isPending;
  const listError = listQuery.isError ? getApiErrorMessage(listQuery.error, 'Gagal memuat data mata pelajaran.') : null;
  const [pendingDelete, setPendingDelete] = useState<Subject | null>(null);
  const isDeleting = remove.isPending;

  const { isOpen, openModal, closeModal } = useModal();
  const { isOpen: isImportOpen, openModal: openImportModal, closeModal: closeImportModal } = useModal();
  const [editing, setEditing] = useState<Subject | null>(null);


  async function confirmDelete() {
    if (!pendingDelete) return;
    const subject = pendingDelete;
    try {
      await remove.mutateAsync(pendingDelete.id);
      toast.success(`Mata pelajaran "${subject.name}" berhasil dihapus.`);
      setPendingDelete(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, `Mata pelajaran "${subject.name}" tidak dapat dihapus.`));
      setPendingDelete(null);
    }
  }

  const columns: Column<Subject>[] = [
    { key: 'code', header: 'Kode', render: (s) => <span className="font-mono text-theme-xs text-gray-500">{s.code ?? '—'}</span> },
    { key: 'name', header: 'Nama Mata Pelajaran', render: (s) => <span className="font-medium text-gray-800 dark:text-white/90">{s.name}</span> },
    { key: 'teacherCount', header: 'Guru Pengampu', render: (s) => `${s.teacherNames?.length ?? 0} guru` },
    {
      key: 'teacherNames',
      header: 'Nama Guru Pengampu',
      render: (s) =>
        s.teacherNames && s.teacherNames.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {s.teacherNames.map((n) => (
              <span key={n} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-theme-xs text-gray-600 dark:bg-white/5 dark:text-gray-300">{n}</span>
            ))}
          </div>
        ) : (
          <span className="text-gray-400">Belum ada</span>
        ),
    },
    ...(isAdmin
      ? [
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (s: Subject) => (
              <ActionIcons label={s.name} onEdit={() => { setEditing(s); openModal(); }} onDelete={() => setPendingDelete(s)} />
            ),
          } as Column<Subject>,
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
            Tambah Mata Pelajaran
          </button>
        </div>
      )}

      {listError && <div role="alert" className="mb-4 rounded-md border border-error-200 bg-error-50 px-3.5 py-3 text-[13.5px] text-error-700">{listError}</div>}

      <DataTable
        columns={columns}
        rows={items}
        getRowId={(s) => s.id}
        isLoading={isLoading}
        emptyMessage="Belum ada data mata pelajaran."
        pageNumber={pageNumber}
        totalPages={totalPages}
        onPageChange={setPageNumber}
      />

      {isAdmin && (
        <SubjectFormModal
          isOpen={isOpen}
          onClose={closeModal}
          subject={editing}
          onSaved={() => {
            closeModal();
            toast.success(editing ? 'Mata pelajaran berhasil diubah.' : 'Mata pelajaran baru berhasil ditambahkan.');
          }}
        />
      )}

      <ImportModal
        isOpen={isImportOpen}
        onClose={closeImportModal}
        resource="subjects"
        resourceLabel="Mata Pelajaran"
        onImported={(result) => {
          closeImportModal();
          toast.success(result.message);
          void queryClient.invalidateQueries({ queryKey: ['subjects'] });
        }}
      />

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title="Hapus Mata Pelajaran"
        description={pendingDelete ? `Anda akan menghapus mata pelajaran "${pendingDelete.name}". Tindakan ini tidak dapat dibatalkan.` : ''}
        confirmLabel="Ya, Hapus"
        tone="danger"
        isProcessing={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

function SubjectFormModal({ isOpen, onClose, subject, onSaved }: { isOpen: boolean; onClose: () => void; subject: Subject | null; onSaved: () => void }) {
  const isEdit = !!subject;
  const [name, setName] = useState(subject?.name ?? '');
  const [code, setCode] = useState(subject?.code ?? '');
  const [teacherIds, setTeacherIds] = useState<string[]>(subject?.teacherIds ?? []);
  const [teachers, setTeachers] = useState<Array<{ id: string; fullName: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { create, update } = useSubjectMutations();

  useEffect(() => {
    setName(subject?.name ?? '');
    setCode(subject?.code ?? '');
    setTeacherIds(subject?.teacherIds ?? []);
    setError(null);
  }, [subject, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    apiClient
      .get<{ items: Array<{ id: string; fullName: string }> }>('/users', { params: { role: 'teacher', pageSize: 100 } })
      .then((res) => setTeachers(res.data.items))
      .catch(() => setTeachers([]));
  }, [isOpen]);

  function toggleTeacher(id: string) {
    setTeacherIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = parseFormData(subjectSchema, { name, code: code || undefined, teacherIds });
    if (!parsed.success) { setError(firstError(parsed.errors)); return; }
    setIsSubmitting(true);
    try {
      if (isEdit && subject) {
        const payload: UpdateSubjectRequest = { name: toTitleCase(name), code: code || undefined, teacherIds };
        await update.mutateAsync({ id: subject.id, payload });
      } else {
        const payload: CreateSubjectRequest = { name: toTitleCase(name), code: code || undefined, teacherIds };
        await create.mutateAsync(payload);
      }
      onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Gagal menyimpan data mata pelajaran.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-sm">
      <div className="p-6">
        <h3 className="mb-5 pr-10 text-theme-sm font-semibold text-gray-800 dark:text-white/90">{isEdit ? 'Ubah Mata Pelajaran' : 'Tambah Mata Pelajaran'}</h3>
        {error && <div role="alert" className="mb-4 rounded-md border border-error-200 bg-error-50 px-3.5 py-3 text-[13.5px] text-error-700">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90">Nama Mata Pelajaran<span aria-hidden="true" className="text-error-500"> *</span></label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={(e) => setName(toTitleCase(e.target.value))}
              placeholder="mis. Matematika"
              className="h-11 w-full rounded-md border border-gray-300 bg-white px-3.5 text-[14px] text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90">Kode Mata Pelajaran</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="mis. MTK-01"
              className="h-11 w-full rounded-md border border-gray-300 bg-white px-3.5 text-[14px] text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>
          <div>
            <span className="mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90">Guru Pengampu</span>
            <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border border-gray-200 p-3 dark:border-gray-700">
              {teachers.length === 0 && <p className="text-theme-xs text-gray-400">Belum ada data guru.</p>}
              {teachers.map((t) => (
                <label key={t.id} className="flex cursor-pointer items-center gap-2.5 text-[13.5px] text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={teacherIds.includes(t.id)}
                    onChange={() => toggleTeacher(t.id)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/30"
                  />
                  {t.fullName}
                </label>
              ))}
            </div>
            <p className="mt-1.5 text-theme-xs text-gray-400">Jumlah guru pengampu: {teacherIds.length}</p>
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