import { Link } from 'react-router';
import { ClipboardCheck, Database, User, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface QuickLink {
  to: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const LINKS: QuickLink[] = [
  { to: '/attendance', label: 'Presensi', desc: 'Pantau dan koreksi kehadiran, lalu ekspor laporannya', icon: <ClipboardCheck size={20} aria-hidden="true" /> },

  { to: '/data-master/students', label: 'Data Master', desc: 'Kelola data siswa, kelas, guru, dan orang tua', icon: <Database size={20} aria-hidden="true" />, adminOnly: true },

  { to: '/profile', label: 'Profil Saya', desc: 'Kelola informasi akun Anda', icon: <User size={20} aria-hidden="true" /> },

];

export function QuickLinks() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'administrator';
  const links = LINKS.filter((l) => !l.adminOnly || isAdmin);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <h2 className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">Akses Cepat</h2>

      <div className="mt-4 space-y-2">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="flex items-center gap-3.5 rounded-xl border border-gray-100 p-3.5 transition-colors hover:border-brand-200 hover:bg-brand-25 dark:border-gray-800 dark:hover:border-brand-800 dark:hover:bg-brand-500/5"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400">
              {link.icon}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-theme-sm font-medium text-gray-800 dark:text-white/90">{link.label}</span>

              <span className="block truncate text-theme-xs text-gray-500 dark:text-gray-400">{link.desc}</span>

            </span>

            <ChevronRight size={18} className="shrink-0 text-gray-400" aria-hidden="true" />

          </Link>

        ))}
      </div>

    </div>

  );
}
