import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Search, Plus, Upload, Mail } from 'lucide-react';
import { apiClient, getApiErrorMessage } from '../../lib/apiClient';
import { useToast } from '../../hooks/useToast';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { env } from '../../config/env';
import { toTitleCase, toSentenceCase, validatePersonName } from '../../lib/format';
import { DataTable, type Column } from '../../components/common/DataTable';
import { ActionIcons } from '../../components/common/ActionIcons';
import { ImportModal } from '../../components/common/ImportModal';
import { Spinner } from '../../components/common/Spinner';
import { Modal } from '../../components/ui/modal';
import { useModal } from '../../hooks/useModal';
import type { PaginatedResponse } from '../../types/api';
import type { UserDirectoryEntry, CreateTeacherRequest, EmploymentStatus } from '../../types/dataMaster';
import { EMPLOYMENT_STATUS_LABEL } from '../../types/dataMaster';

const inputCls = 'h-11 w-full rounded-md border border-gray-300 bg-white px-3.5 text-[14px] text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90';
const labelCls = 'mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90';

export default function TeachersPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<UserDirectoryEntry[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 400);

  const [active, setActive] = useState<UserDirectoryEntry | null>(null);
  const { isOpen: isFormOpen, openModal: openFormModal, closeModal: closeFormModal } = useModal();
  const { isOpen: isDetailOpen, openModal: openDetailModal, closeModal: closeDetailModal } = useModal();
  const { isOpen: isInviteOpen, openModal: openInviteModal, closeModal: closeInviteModal } = useModal();
  const { isOpen: isImportOpen, openModal: openImportModal, closeModal: closeImportModal } = useModal();

  const load = useCallback(() => {
    setIsLoading(true);
    setListError(null);
    apiClient
      .get<PaginatedResponse<UserDirectoryEntry>>('/users', {
        params: { role: 'teacher', page: pageNumber, pageSize: env.defaultPageSize, search: debouncedSearch || undefined },
      })
      .then((res) => {
        setItems(res.data.items);
        setTotalPages(res.data.totalPages);
      })
      .catch((err) => setListError(getApiErrorMessage(err, 'Gagal memuat data guru.')))
      .finally(() => setIsLoading(false));
  }, [pageNumber, debouncedSearch]);

  useEffect(() => {
    setPageNumber(1);
  }, [debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

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
              {u.fullName.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
            </span>
          )}
          <span>
            <span className="block font-medium text-gray-800 dark:text-white/90">{u.fullName}</span>
            <span className="block text-theme-xs text-gray-400">{u.email}</span>
          </span>
        </span>
      ),
    },
    { key: 'nip', header: 'NIP / NUPTK', render: (u) => (
      <span className="font-mono text-theme-xs text-gray-500">
        <span className="block">{u.nip ?? '—'}</span>
        <span className="block text-gray-400">{u.nuptk ?? '—'}</span>
      </span>
    ) },
    { key: 'employment', header: 'Kepegawaian', render: (u) => (u.employmentStatus ? EMPLOYMENT_STATUS_LABEL[u.employmentStatus] : '—') },
    { key: 'expertise', header: 'Bidang Keahlian', render: (u) => u.expertiseField ?? '—' },
    {
      key: 'status',
      header: 'Status',
      render: (u) => (
        <span className={`rounded-full px-2.5 py-0.5 text-theme-xs font-medium ${u.accountStatus === 'active' ? 'bg-secondary-50 text-secondary-700' : 'bg-gray-100 text-gray-600'}`}>
          {u.accountStatus === 'active' ? 'Aktif' : 'Tidak Aktif'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (u) => (
        <ActionIcons
          label={u.fullName}
          onDetail={() => { setActive(u); openDetailModal(); }}
          onEdit={() => { setActive(u); openFormModal(); }}
        />
      ),
    },
  ];

  return (
    <div>
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
            aria-label="Cari guru"
            className="h-10 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 text-theme-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={openInviteModal}
            className="flex h-10 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 text-theme-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
          >
            <Mail size={16} aria-hidden="true" />
            Undang via Email
          </button>
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
            Tambah Guru
          </button>
        </div>
      </div>

      {listError && <div role="alert" className="mb-4 rounded-md border border-error-200 bg-error-50 px-3.5 py-3 text-[13.5px] text-error-700">{listError}</div>}

      <DataTable
        columns={columns}
        rows={items}
        getRowId={(u) => u.id}
        isLoading={isLoading}
        emptyMessage="Belum ada data guru."
        pageNumber={pageNumber}
        totalPages={totalPages}
        onPageChange={setPageNumber}
      />

      <TeacherFormModal
        isOpen={isFormOpen}
        onClose={closeFormModal}
        teacher={active}
        onSaved={() => {
          closeFormModal();
          toast.success(active ? 'Data guru berhasil diubah.' : 'Data guru berhasil ditambahkan.');
          load();
        }}
      />

      {active && <TeacherDetailModal isOpen={isDetailOpen} onClose={closeDetailModal} teacher={active} />}

      <InviteTeacherModal
        isOpen={isInviteOpen}
        onClose={closeInviteModal}
        onSent={(message) => {
          closeInviteModal();
          toast.success(message);
        }}
      />

      <ImportModal
        isOpen={isImportOpen}
        onClose={closeImportModal}
        resource="teachers"
        resourceLabel="Guru"
        onImported={(result) => {
          closeImportModal();
          toast.success(result.message);
          load();
        }}
      />

    </div>
  );
}

function TeacherDetailModal({ isOpen, onClose, teacher }: { isOpen: boolean; onClose: () => void; teacher: UserDirectoryEntry }) {
  const rows: Array<[string, string]> = [
    ['Email', teacher.email],
    ['Nomor Telepon', teacher.phone ?? 'Belum diisi'],
    ['NIP', teacher.nip ?? 'Tidak ada (bukan PNS/PPPK)'],
    ['NUPTK', teacher.nuptk ?? 'Belum diisi'],
    ['Status Kepegawaian', teacher.employmentStatus ? EMPLOYMENT_STATUS_LABEL[teacher.employmentStatus] : 'Belum diisi'],
    ['Bidang Keahlian', teacher.expertiseField ?? 'Belum diisi'],
    ['Jenis Keahlian', teacher.expertiseType ?? 'Belum diisi'],
    ['Alamat', teacher.address ?? 'Belum diisi'],
    ['Status Akun', teacher.accountStatus === 'active' ? 'Aktif' : 'Tidak Aktif'],
  ];
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-lg">
      <div className="p-6">
        <div className="flex items-center gap-4">
          {teacher.photoUrl ? (
            <img src={teacher.photoUrl} alt="" className="size-14 rounded-full object-cover" />
          ) : (
            <span className="flex size-14 items-center justify-center rounded-full bg-brand-50 text-[18px] font-semibold text-brand-600 dark:bg-brand-500/10">
              {teacher.fullName.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
            </span>
          )}
          <div>
            <h3 className="pr-10 text-[16px] font-semibold text-gray-800 dark:text-white/90">{teacher.fullName}</h3>
            <p className="mt-0.5 text-theme-xs text-gray-400">Foto profil hanya dapat diubah oleh guru yang bersangkutan lewat akunnya sendiri.</p>
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

function TeacherFormModal({ isOpen, onClose, teacher, onSaved }: { isOpen: boolean; onClose: () => void; teacher: UserDirectoryEntry | null; onSaved: () => void }) {
  const isEdit = !!teacher;
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', nip: '', nuptk: '',
    employmentStatus: '' as '' | EmploymentStatus,
    expertiseField: '', expertiseType: '', address: '',
    accountStatus: 'active' as 'active' | 'suspended',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setForm({
      fullName: teacher?.fullName ?? '',
      email: teacher?.email ?? '',
      phone: teacher?.phone ?? '',
      nip: teacher?.nip ?? '',
      nuptk: teacher?.nuptk ?? '',
      employmentStatus: teacher?.employmentStatus ?? '',
      expertiseField: teacher?.expertiseField ?? '',
      expertiseType: teacher?.expertiseType ?? '',
      address: teacher?.address ?? '',
      accountStatus: teacher?.accountStatus === 'suspended' ? 'suspended' : 'active',
    });
    setError(null);
  }, [teacher, isOpen]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const isPnsLike = form.employmentStatus === 'pns' || form.employmentStatus === 'pppk';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const nameError = validatePersonName(form.fullName);
    if (nameError) { setError(`Nama Lengkap: ${nameError}`); return; }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) { setError('Format email tidak valid.'); return; }

    if (form.nip && !/^\d{18}$/.test(form.nip)) {
      setError('NIP harus terdiri dari 18 digit angka.');
      return;
    }
    if (form.nip && !isPnsLike) {
      setError('NIP hanya berlaku untuk status kepegawaian PNS atau PPPK.');
      return;
    }
    if (form.nuptk && !/^\d{16}$/.test(form.nuptk)) {
      setError('NUPTK harus terdiri dari 16 digit angka.');
      return;
    }

    setIsSubmitting(true);
    const payload: CreateTeacherRequest & { accountStatus?: 'active' | 'suspended' } = {
      fullName: toTitleCase(form.fullName),
      email: form.email.toLowerCase(),
      phone: form.phone || undefined,
      nip: form.nip || undefined,
      nuptk: form.nuptk || undefined,
      employmentStatus: form.employmentStatus || undefined,
      expertiseField: form.expertiseField ? toTitleCase(form.expertiseField) : undefined,
      expertiseType: form.expertiseType || undefined,
      address: form.address ? toSentenceCase(form.address) : undefined,
    };
    try {
      if (isEdit && teacher) {
        await apiClient.patch(`/teachers/${teacher.id}`, { ...payload, accountStatus: form.accountStatus });
      } else {
        await apiClient.post('/teachers', payload);
      }
      onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Gagal menyimpan data guru.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-2xl">
      <div className="max-h-[85vh] overflow-y-auto p-6">
        <h3 className="mb-5 pr-10 text-theme-sm font-semibold text-gray-800 dark:text-white/90">{isEdit ? 'Ubah Data Guru' : 'Tambah Guru'}</h3>
        {error && <div role="alert" className="mb-4 rounded-md border border-error-200 bg-error-50 px-3.5 py-3 text-[13.5px] text-error-700">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="t-name" className={labelCls}>Nama Lengkap<span aria-hidden="true" className="text-error-500"> *</span></label>
              <input id="t-name" type="text" required value={form.fullName} onChange={(e) => set('fullName', e.target.value)} onBlur={(e) => set('fullName', toTitleCase(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label htmlFor="t-email" className={labelCls}>Email<span aria-hidden="true" className="text-error-500"> *</span></label>
              <input id="t-email" type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="t-phone" className={labelCls}>Nomor Telepon</label>
              <input id="t-phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="t-emp" className={labelCls}>Status Kepegawaian</label>
              <select id="t-emp" value={form.employmentStatus} onChange={(e) => set('employmentStatus', e.target.value as EmploymentStatus | '')} className={inputCls}>
                <option value="">Pilih</option>
                {(Object.keys(EMPLOYMENT_STATUS_LABEL) as EmploymentStatus[]).map((k) => (
                  <option key={k} value={k}>{EMPLOYMENT_STATUS_LABEL[k]}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="t-nip" className={labelCls}>NIP {isPnsLike ? '' : '(khusus PNS/PPPK)'}</label>
              <input id="t-nip" type="text" inputMode="numeric" maxLength={18} disabled={!isPnsLike} value={form.nip} onChange={(e) => set('nip', e.target.value.replace(/\D/g, ''))} placeholder="18 digit" className={`${inputCls} disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-white/5`} />
            </div>
            <div>
              <label htmlFor="t-nuptk" className={labelCls}>NUPTK</label>
              <input id="t-nuptk" type="text" inputMode="numeric" maxLength={16} value={form.nuptk} onChange={(e) => set('nuptk', e.target.value.replace(/\D/g, ''))} placeholder="16 digit" className={inputCls} />
            </div>
            <div>
              <label htmlFor="t-field" className={labelCls}>Bidang Keahlian</label>
              <input id="t-field" type="text" value={form.expertiseField} onChange={(e) => set('expertiseField', e.target.value)} onBlur={(e) => set('expertiseField', toTitleCase(e.target.value))} placeholder="mis. Matematika" className={inputCls} />
            </div>
            <div>
              <label htmlFor="t-type" className={labelCls}>Jenis Keahlian</label>
              <select id="t-type" value={form.expertiseType} onChange={(e) => set('expertiseType', e.target.value)} className={inputCls}>
                <option value="">Pilih</option>
                <option value="Guru Kelas">Guru Kelas</option>
                <option value="Guru Mata Pelajaran">Guru Mata Pelajaran</option>
                <option value="Guru Bimbingan Konseling">Guru Bimbingan Konseling</option>
                <option value="Guru Pendidikan Khusus">Guru Pendidikan Khusus</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="t-address" className={labelCls}>Alamat</label>
              <input id="t-address" type="text" value={form.address} onChange={(e) => set('address', e.target.value)} className={inputCls} />
            </div>
            {isEdit && (
              <div>
                <label htmlFor="t-status" className={labelCls}>Status Akun</label>
                <select id="t-status" value={form.accountStatus} onChange={(e) => set('accountStatus', e.target.value as 'active' | 'suspended')} className={inputCls}>
                  <option value="active">Aktif</option>
                  <option value="suspended">Tidak Aktif</option>
                </select>
              </div>
            )}
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

function InviteTeacherModal({ isOpen, onClose, onSent }: { isOpen: boolean; onClose: () => void; onSent: (message: string) => void }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    setEmail('');
    setError(null);
  }, [isOpen]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Format email tidak valid.');
      return;
    }
    setIsSending(true);
    try {
      const { data } = await apiClient.post<{ message: string }>('/teachers/invitations', { email: email.trim().toLowerCase() });
      onSent(data.message);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Gagal mengirim undangan.'));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-md">
      <div className="p-6">
        <h3 className="pr-10 text-theme-sm font-semibold text-gray-800 dark:text-white/90">Undang Guru via Email</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">
          Masukkan email aktif guru. Sistem akan mengirim tautan pendaftaran akun yang berlaku 72 jam. Guru mengisi
          datanya sendiri lewat tautan itu, lalu akunnya langsung aktif.
        </p>

        {error && <div role="alert" className="mt-4 rounded-md border border-error-200 bg-error-50 px-3.5 py-3 text-[13.5px] text-error-700">{error}</div>}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
          <div>
            <label htmlFor="invite-email" className={labelCls}>Email Guru<span aria-hidden="true" className="text-error-500"> *</span></label>
            <input id="invite-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="guru@contoh.sch.id" className={inputCls} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="h-10 rounded-md px-4 text-theme-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5">Batal</button>
            <button type="submit" disabled={isSending} className="flex h-10 items-center gap-2 rounded-md bg-brand-500 px-5 text-theme-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60">
              {isSending && <Spinner size="sm" />}
              Kirim Undangan
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
