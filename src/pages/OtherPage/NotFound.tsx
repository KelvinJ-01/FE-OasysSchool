import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import PageMeta from '../../components/common/PageMeta';
import { useAuth } from '../../hooks/useAuth';

export default function NotFound() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <PageMeta title="Halaman Tidak Ditemukan | Oasys School" description="Halaman yang Anda cari tidak ditemukan" />
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
          <SearchX size={32} aria-hidden="true" />
        </span>
        <p className="mt-6 text-title-md font-semibold text-gray-800 dark:text-white/90">404</p>
        <h1 className="mt-2 text-theme-xl font-semibold text-gray-800 dark:text-white/90">Halaman Tidak Ditemukan</h1>
        <p className="mt-2 max-w-sm text-theme-sm text-gray-500 dark:text-gray-400">
          Halaman yang Anda cari mungkin sudah dipindahkan, dihapus, atau alamatnya salah ketik.
        </p>
        <Link
          to={isAuthenticated ? '/dashboard' : '/'}
          className="mt-6 flex h-11 items-center justify-center rounded-md bg-brand-500 px-6 text-theme-sm font-medium text-white transition-colors hover:bg-brand-600"
        >
          {isAuthenticated ? 'Kembali ke Dasbor' : 'Kembali ke Beranda'}
        </Link>
      </div>
    </>
  );
}