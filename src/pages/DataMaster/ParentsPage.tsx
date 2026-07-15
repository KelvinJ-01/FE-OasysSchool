import { useEffect, useState, type FormEvent } from 'react';
import { Search, Plus, Upload, BadgeCheck, BadgeX } from 'lucide-react';
import { getApiErrorMessage } from '../../lib/apiClient';
import { useQueryClient } from '@tanstack/react-query';
import { useDirectoryQuery, useParentMutations } from '../../hooks/queries/useDirectory';
import { useToast } from '../../hooks/useToast';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { env } from '../../config/env';
import { toTitleCase, toSentenceCase } from '../../lib/format';
import { parentSchema } from '../../lib/schemas';
import { parseFormData, firstError } from '../../lib/validateForm';
import { DataTable, type Column } from '../../components/common/DataTable';
import { ActionIcons } from '../../components/common/ActionIcons';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ImportModal } from '../../components/common/ImportModal';
import { Spinner } from '../../components/common/Spinner';
import { Modal } from '../../components/ui/modal';
import { useModal } from '../../hooks/useModal';
import type { UserDirectoryEntry, CreateParentRequest } from '../../types/dataMaster';

const inputCls = 'h-11 w-full rounded-md border border-gray-300 bg-white px-3.5 text-[14px] text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90';
const labelCls = 'mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90';

const STATUS_META: Record<UserDirectoryEntry['accountStatus'], { label: string; cls: string }> = {
  active: { label: 'Aktif', cls: 'bg-secondary-50 text-secondary-700' },
  pending_verification: { label: 'Menunggu Verifikasi', cls: 'bg-warning-50 text-warning-700' },
  suspended: { label: 'Ditangguhkan', cls: 'bg-gray-100 text-gray-600' },
};

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export default function ParentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { verify } = useParentMutations();
  const [pageNumber, setPageNumber] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);

  const directoryQuery = useDirectoryQuery({
    role: 'parent',
    page: pageNumber,
    pageSize: env.defaultPageSize,
    search: debouncedSearch || undefined,
  });
  const items = directoryQuery.data?.items ?? [];
  const totalPages = directoryQuery.data?.totalPages ?? 1;
  const isLoading = directoryQuery.isPending;
  const listError = directoryQuery.isError
    ? getApiErrorMessage(directoryQuery.error, 'Gagal memuat data orang tua.')
    : null;

  const [active, setActive] = useState<UserDirectoryEntry | null>(null);
  const [pendingReject, setPendingReject] = useState<UserDirectoryEntry | null>(null);
  const [pendingVerify, setPendingVerify] = useState<UserDirectoryEntry | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { isOpen: isFormOpen, openModal: openFormModal, closeModal: closeFormModal } = useModal();
  const { isOpen: isDetailOpen, openModal: openDetailModal, closeModal: closeDetailModal } = useModal();
  const { isOpen: isImportOpen, openModal: openImportModal, closeModal: closeImportModal } = useModal();


  useEffect(() => {
    setPageNumber(1);
  }, [debouncedSearch]);


  async function confirmReject() {
    if (!pendingReject) return;
    setIsProcessing(true);
    try {
      const data = await verify.mutateAsync({ id: pendingReject.id, approve: false });
      toast.success(data.message);
      setPendingReject(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Gagal menolak pendaftaran.'));
      setPendingReject(null);
    } finally {
      setIsProcessing(false);
    }
  }

  async function confirmVerify() {
    if (!pendingVerify) return;
    setIsProcessing(true);
    try {
      const data = await verify.mutateAsync({ id: pendingVerify.id, approve: true });
      toast.success(data.message);
      setPendingVerify(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Gagal memverifikasi akun.'));
      setPendingVerify(null);
    } finally {
      setIsProcessing(false);
    }
  }

  const columns: Column<UserDirectoryEntry>[] = [
    {
      key: 'fullName',
      header: 'Nama',
      render: (u) => (
        <span className="flex items-center gap-3">
          {u.photoUrl ? (
            <img src={u.photoUrl} alt="" className="size-9 rounded-full object-cover" />
          ) : (
            <span className="flex size-9 items-center justify-center rounded-full bg-brand-50 text-theme-xs font-semibold text-brand-600 dark:bg-brand-500/10">
              {initials(u.fullName)}
            </span>
          )}
          <span>
            <span className="block font-medium text-gray-800 dark:text-white/90">{u.fullName}</span>
            <span className="block text-theme-xs text-gray-400">{u.email}</span>
          </span>
        </span>
      ),
    },
    { key: 'phone', header: 'Telepon', render: (u) => u.phone ?? '—' },
    { key: 'occupation', header: 'Pekerjaan', render: (u) => u.occupation ?? '—' },
    {
      key: 'linkedStudents',
      header: 'Nama Anak',
      render: (u) =>
        u.linkedStudents && u.linkedStudents.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {u.linkedStudents.map((s) => (
              <span key={s.id} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-theme-xs text-gray-600 dark:bg-white/5 dark:text-gray-300">
                {s.fullName}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-gray-400">Belum ada tautan</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (u) => (
        <span className={`rounded-full px-2.5 py-0.5 text-theme-xs font-medium ${STATUS_META[u.accountStatus].cls}`}>
          {STATUS_META[u.accountStatus].label}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (u) => (
        <div className="flex items-center justify-end gap-1">
          {u.accountStatus === 'pending_verification' && (
            <>
              <button
                type="button"
                onClick={() => setPendingVerify(u)}
                title="Verifikasi akun"
                className="flex h-8 items-center gap-1 rounded-md bg-secondary-50 px-2.5 text-theme-xs font-medium text-secondary-700 transition-colors hover:bg-secondary-100"
              >
                <BadgeCheck size={14} aria-hidden="true" />
                Verifikasi
              </button>
              <button
                type="button"
                onClick={() => setPendingReject(u)}
                title="Tolak pendaftaran"
                className="flex h-8 items-center gap-1 rounded-md bg-error-50 px-2.5 text-theme-xs font-medium text-error-700 transition-colors hover:bg-error-100"
              >
                <BadgeX size={14} aria-hidden="true" />
                Tolak
              </button>
            </>
          )}
          <ActionIcons
            label={u.fullName}
            onDetail={() => { setActive(u); openDetailModal(); }}
            onEdit={() => { setActive(u); openFormModal(); }}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-3 rounded-md border border-blue-light-100 bg-blue-light-50/60 px-3.5 py-3 text-[13px] leading-relaxed text-blue-light-700 dark:border-blue-light-500/20 dark:bg-blue-light-500/10">
        Akun orang tua yang mendaftar sendiri lewat web atau aplikasi mobile berstatus
        <span className="font-medium"> Menunggu Verifikasi</span> sampai Anda memeriksanya dan menekan tombol Verifikasi.
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-64">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
            <Search size={16} aria-hidden="true" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau email..."
            aria-label="Cari orang tua"
            className="h-10 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 text-theme-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
        </div>

        <div className="flex gap-2">
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
            onClick={() => { setActive(null); openFormModal(); }}
            className="flex h-10 items-center gap-1.5 rounded-md bg-brand-500 px-4 text-theme-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            <Plus size={16} aria-hidden="true" />
            Tambah Orang Tua
          </button>
        </div>
      </div>

      {listError && <div role="alert" className="mb-4 rounded-md border border-error-200 bg-error-50 px-3.5 py-3 text-[13.5px] text-error-700">{listError}</div>}

      <DataTable
        columns={columns}
        rows={items}
        getRowId={(u) => u.id}
        isLoading={isLoading}
        emptyMessage="Belum ada data orang tua."
        pageNumber={pageNumber}
        totalPages={totalPages}
        onPageChange={setPageNumber}
      />

      <ParentFormModal
        isOpen={isFormOpen}
        onClose={closeFormModal}
        parent={active}
        onSaved={() => {
          closeFormModal();
          toast.success(active ? 'Data orang tua berhasil diubah.' : 'Data orang tua berhasil ditambahkan.');
        }}
      />

      {active && <ParentDetailModal isOpen={isDetailOpen} onClose={closeDetailModal} parent={active} />}

      <ImportModal
        isOpen={isImportOpen}
        onClose={closeImportModal}
        resource="parents"
        resourceLabel="Orang Tua"
        onImported={(result) => {
          closeImportModal();
          toast.success(result.message);
          void queryClient.invalidateQueries({ queryKey: ['directory'] });
        }}
      />

      <ConfirmDialog
        isOpen={pendingReject !== null}
        title="Tolak Pendaftaran Orang Tua"
        description={pendingReject ? `Pendaftaran "${pendingReject.fullName}" akan ditolak dan akunnya ditangguhkan. Ia perlu menghubungi sekolah bila merasa ini keliru.` : ''}
        confirmLabel="Ya, Tolak"
        tone="danger"
        isProcessing={isProcessing}
        onConfirm={confirmReject}
        onCancel={() => setPendingReject(null)}
      />

      <ConfirmDialog
        isOpen={pendingVerify !== null}
        title="Verifikasi Akun Orang Tua"
        description={pendingVerify ? `Pastikan data "${pendingVerify.fullName}" sudah benar dan tautan anaknya sesuai. Setelah diverifikasi, akun langsung bisa dipakai di aplikasi mobile.` : ''}
        confirmLabel="Ya, Verifikasi"
        isProcessing={isProcessing}
        onConfirm={confirmVerify}
        onCancel={() => setPendingVerify(null)}
      />
    </div>
  );
}

function ParentDetailModal({ isOpen, onClose, parent }: { isOpen: boolean; onClose: () => void; parent: UserDirectoryEntry }) {
  const rows: Array<[string, string]> = [
    ['Email', parent.email],
    ['Nomor Telepon', parent.phone ?? 'Belum diisi'],
    ['Pekerjaan', parent.occupation ?? 'Belum diisi'],
    ['Alamat', parent.address ?? 'Belum diisi'],
    ['Nama Anak', parent.linkedStudents && parent.linkedStudents.length > 0 ? parent.linkedStudents.map((s) => s.fullName).join(', ') : 'Belum ada tautan'],
    ['Status Akun', STATUS_META[parent.accountStatus].label],
  ];
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-lg">
      <div className="p-6">
        <div className="flex items-center gap-4">
          {parent.photoUrl ? (
            <img src={parent.photoUrl} alt="" className="size-14 rounded-full object-cover" />
          ) : (
            <span className="flex size-14 items-center justify-center rounded-full bg-brand-50 text-[18px] font-semibold text-brand-600 dark:bg-brand-500/10">
              {parent.fullName.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
            </span>
          )}
          <div>
            <h3 className="pr-10 text-[16px] font-semibold text-gray-800 dark:text-white/90">{parent.fullName}</h3>
            <p className="mt-0.5 text-theme-xs text-gray-400">Foto profil hanya dapat diubah oleh orang tua lewat Aplikasi Mobile.</p>
          </div>
        </div>
        <dl className="mt-5 space-y-2.5">
          {rows.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[150px_1fr] gap-2 text-[13.5px]">
              <dt className="text-gray-400">{label}</dt>
              <dd className="text-gray-700 dark:text-gray-300">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="h-10 rounded-md px-4 text-theme-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5">Tutup</button>
        </div>
      </div>
    </Modal>
  );
}

function ParentFormModal({ isOpen, onClose, parent, onSaved }: { isOpen: boolean; onClose: () => void; parent: UserDirectoryEntry | null; onSaved: () => void }) {
  const isEdit = !!parent;
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', address: '', occupation: '', studentNisns: '' });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { create, update } = useParentMutations();

  useEffect(() => {
    setForm({
      fullName: parent?.fullName ?? '',
      email: parent?.email ?? '',
      phone: parent?.phone ?? '',
      address: parent?.address ?? '',
      occupation: parent?.occupation ?? '',
      studentNisns: (parent?.linkedStudents ?? []).map((s) => s.nisn).join(', '),
    });
    setError(null);
  }, [parent, isOpen]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = parseFormData(parentSchema, {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone || undefined,
      address: form.address || undefined,
      occupation: form.occupation || undefined,
      studentNisns: form.studentNisns || undefined,
    });
    if (!parsed.success) { setError(firstError(parsed.errors)); return; }

    const nisns = form.studentNisns.split(',').map((x) => x.trim()).filter(Boolean);

    setIsSubmitting(true);
    const payload: CreateParentRequest = {
      fullName: toTitleCase(form.fullName),
      email: form.email.toLowerCase(),
      phone: form.phone || undefined,
      address: form.address ? toSentenceCase(form.address) : undefined,
      occupation: form.occupation ? toTitleCase(form.occupation) : undefined,
      studentNisns: nisns,
    };
    try {
      if (isEdit && parent) {
        await update.mutateAsync({ id: parent.id, payload });
      } else {
        await create.mutateAsync(payload);
      }
      onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Gagal menyimpan data orang tua.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-xl">
      <div className="max-h-[85vh] overflow-y-auto p-6">
        <h3 className="mb-5 pr-10 text-theme-sm font-semibold text-gray-800 dark:text-white/90">{isEdit ? 'Ubah Data Orang Tua' : 'Tambah Orang Tua'}</h3>
        {error && <div role="alert" className="mb-4 rounded-md border border-error-200 bg-error-50 px-3.5 py-3 text-[13.5px] text-error-700">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="p-name" className={labelCls}>Nama Lengkap<span aria-hidden="true" className="text-error-500"> *</span></label>
              <input id="p-name" type="text" required value={form.fullName} onChange={(e) => set('fullName', e.target.value)} onBlur={(e) => set('fullName', toTitleCase(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label htmlFor="p-email" className={labelCls}>Email<span aria-hidden="true" className="text-error-500"> *</span></label>
              <input id="p-email" type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="p-phone" className={labelCls}>Nomor Telepon</label>
              <input id="p-phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="p-occ" className={labelCls}>Pekerjaan</label>
              <input id="p-occ" type="text" value={form.occupation} onChange={(e) => set('occupation', e.target.value)} onBlur={(e) => set('occupation', toTitleCase(e.target.value))} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="p-address" className={labelCls}>Alamat</label>
              <input id="p-address" type="text" value={form.address} onChange={(e) => set('address', e.target.value)} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="p-nisn" className={labelCls}>NISN Anak</label>
              <input id="p-nisn" type="text" value={form.studentNisns} onChange={(e) => set('studentNisns', e.target.value)} placeholder="mis. 1000000137, 1000000274" className={inputCls} />
              <p className="mt-1.5 text-theme-xs text-gray-400">Pisahkan dengan koma bila anaknya lebih dari satu. Nama anak akan tampil otomatis dari Data Siswa.</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="h-10 rounded-md px-4 text-theme-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5">Batal</button>
            <button type="submit" disabled={isSubmitting} className="flex h-10 items-center rounded-md bg-brand-500 px-5 text-theme-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60">
              {isSubmitting ? (<><Spinner size="sm" className="mr-2" />Menyimpan...</>) : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
