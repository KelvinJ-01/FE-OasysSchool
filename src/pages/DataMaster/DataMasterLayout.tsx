import { NavLink, Outlet } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import PageMeta from '../../components/common/PageMeta';
import PageBreadCrumb from '../../components/common/PageBreadCrumb';

const COMMON_TABS = [
  { to: '/data-master/students', label: 'Siswa' },
  { to: '/data-master/classes', label: 'Kelas' },
  { to: '/data-master/academic-terms', label: 'Tahun Ajaran' },
  { to: '/data-master/subjects', label: 'Mata Pelajaran' },
];

const ADMIN_ONLY_TABS = [
  { to: '/data-master/teachers', label: 'Guru' },
  { to: '/data-master/parents', label: 'Orang Tua' },
];

export default function DataMasterLayout() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'administrator';
  const tabs = isAdmin ? [...COMMON_TABS, ...ADMIN_ONLY_TABS] : COMMON_TABS;

  return (
    <>
      <PageMeta title="Data Master | Oasys School" description="Kelola data induk sekolah" />

      <PageBreadCrumb pageTitle="Data Master" />

      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-gray-800">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `whitespace-nowrap border-b-2 px-4 py-2.5 text-theme-sm font-medium transition-colors ${
                isActive
                  ? 'border-brand-500 text-brand-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`
            }
          >
            {tab.label}
          </NavLink>

        ))}
      </div>

      <Outlet />
    </>

  );
}
