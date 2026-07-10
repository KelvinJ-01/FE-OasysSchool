import { useEffect, useState, type FormEvent } from 'react';
import { Search, Info } from 'lucide-react';
import { apiClient, getApiErrorMessage } from '../../lib/apiClient';
import { DataTable, type Column } from '../../components/common/DataTable';
import type { PaginatedResponse } from '../../types/api';
import type { UserDirectoryEntry } from '../../types/dataMaster';

const STATUS_LABEL: Record<UserDirectoryEntry['accountStatus'], { label: string; className: string }> = {
  active: { label: 'Aktif', className: 'bg-secondary-50 text-secondary-700' },
  suspended: { label: 'Ditangguhkan', className: 'bg-error-50 text-error-700' },
  pending_verification: { label: 'Menunggu Verifikasi', className: 'bg-warning-50 text-warning-700' },
};

const PAGE_SIZE = 10;

export default function ParentsPage() {
  const [items, setItems] = useState<UserDirectoryEntry[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  function load() {
    setIsLoading(true);
    setListError(null);
    apiClient
      .get<PaginatedResponse<UserDirectoryEntry>>('/users', {
        params: { role: 'parent', page: pageNumber, pageSize: PAGE_SIZE, search: search || undefined },
      })
      .then((res) => {
        setItems(res.data.items);
        setTotalPages(res.data.totalPages);
      })
      .catch((err) => setListError(getApiErrorMessage(err, 'Gagal memuat data orang tua.')))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [pageNumber]);

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    setPageNumber(1);
    load();
  }

  const columns: Column<UserDirectoryEntry>[] = [
    { key: 'fullName', header: 'Nama', render: (u) => <span className="font-medium text-gray-800 dark:text-white/90">{u.fullName}</span> },
    { key: 'email', header: 'Email', render: (u) => u.email },
    {
      key: 'linkedStudents',
      header: 'Anak Tertaut',
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
      key: 'accountStatus',
      header: 'Status',
      render: (u) => (
        <span className={`rounded-full px-2.5 py-0.5 text-theme-xs font-medium ${STATUS_LABEL[u.accountStatus].className}`}>
          {STATUS_LABEL[u.accountStatus].label}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-start gap-2.5 rounded-md border border-brand-100 bg-brand-25 px-3.5 py-3 text-[13px] leading-relaxed text-brand-700">
        <Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p>
          Halaman ini baca-saja. Akun Orang Tua dibuat lewat pendaftaran mandiri (Dasbor Web publik atau Aplikasi
          Mobile) dan hanya bisa digunakan lewat Aplikasi Mobile setelah verifikasi email.
        </p>
      </div>

      <form onSubmit={handleSearchSubmit} className="mb-4">
        <div className="relative w-64">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
            <Search size={16} aria-hidden="true" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau email..."
            className="h-10 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 text-theme-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
        </div>
      </form>

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
    </div>
  );
}