import { Link } from 'react-router';
import { ShieldAlert } from 'lucide-react';
import PageMeta from '../../components/common/PageMeta';

export default function Forbidden() {
  return (
    <>
      <PageMeta title="Akses Ditolak | Oasys School" description="Anda tidak memiliki izin untuk mengakses halaman ini" />

      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-error-50 text-error-600">
          <ShieldAlert size={32} aria-hidden="true" />

        </span>

        <p className="mt-6 text-title-md font-semibold text-gray-800 dark:text-white/90">403</p>

        <h1 className="mt-2 text-theme-xl font-semibold text-gray-800 dark:text-white/90">Akses Ditolak</h1>

        <p className="mt-2 max-w-sm text-theme-sm text-gray-500 dark:text-gray-400">
          Akun Anda tidak memiliki izin untuk membuka halaman ini. Kalau menurut Anda ini keliru, hubungi Administrator sekolah.
        </p>

        <Link
          to="/dashboard"
          className="mt-6 flex h-11 items-center justify-center rounded-md bg-brand-500 px-6 text-theme-sm font-medium text-white transition-colors hover:bg-brand-600"
        >
          Kembali ke Dasbor
        </Link>

      </div>

    </>

  );
}
