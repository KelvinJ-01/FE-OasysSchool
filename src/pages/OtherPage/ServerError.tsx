import { Link } from 'react-router-dom';
import { ServerCrash } from 'lucide-react';
import PageMeta from '../../components/common/PageMeta';

export default function ServerError() {
  return (
    <>
      <PageMeta title="Kesalahan Server | Oasys School" description="Terjadi kesalahan tak terduga di server" />
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-warning-50 text-warning-600">
          <ServerCrash size={32} aria-hidden="true" />
        </span>
        <p className="mt-6 text-title-md font-semibold text-gray-800 dark:text-white/90">500</p>
        <h1 className="mt-2 text-theme-xl font-semibold text-gray-800 dark:text-white/90">Terjadi Kesalahan Server</h1>
        <p className="mt-2 max-w-sm text-theme-sm text-gray-500 dark:text-gray-400">
          Sesuatu tidak berjalan sesuai rencana di server kami. Coba muat ulang halaman — kalau masih terjadi, hubungi Tim Pengembang.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex h-11 items-center justify-center rounded-md border border-gray-300 px-6 text-theme-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
          >
            Muat Ulang
          </button>
          <Link
            to="/dashboard"
            className="flex h-11 items-center justify-center rounded-md bg-brand-500 px-6 text-theme-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            Kembali ke Dasbor
          </Link>
        </div>
      </div>
    </>
  );
}