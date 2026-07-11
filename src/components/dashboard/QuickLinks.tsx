import { Link } from 'react-router';
import { PieChart, User, ChevronRight } from 'lucide-react';

const LINKS = [
  { to: '/reports', label: 'Laporan Presensi', desc: 'Ekspor rekap presensi ke CSV/Excel', icon: <PieChart size={20} aria-hidden="true" /> },
  { to: '/profile', label: 'Profil Saya', desc: 'Kelola informasi akun Anda', icon: <User size={20} aria-hidden="true" /> },
];

export function QuickLinks() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {LINKS.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className="flex items-center gap-3.5 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-brand-300 hover:bg-brand-25 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-800"
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
  );
}