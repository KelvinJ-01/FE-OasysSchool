import { useCallback } from "react";
import { Link, useLocation } from "react-router";
import { LayoutDashboard, Calendar, User, Database, ClipboardCheck, HandCoins } from "lucide-react";

import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../hooks/useAuth";
import type { UserRole } from "../types/entities";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
  roles?: UserRole[];
};

const navItems: NavItem[] = [
  { icon: <LayoutDashboard />, name: "Dasbor", path: "/dashboard" },
  { icon: <Database />, name: "Data Master", path: "/data-master" },
  { icon: <Calendar />, name: "Jadwal Pembelajaran", path: "/schedules" },
  { icon: <ClipboardCheck />, name: "Presensi", path: "/attendance" },
  { icon: <HandCoins />, name: "Donasi", path: "/donations" },
  { icon: <User />, name: "Profil Saya", path: "/profile" },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { user } = useAuth();
  const location = useLocation();

  const isActive = useCallback(
    (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`),
    [location.pathname]
  );

  const showLabel = isExpanded || isHovered || isMobileOpen;

  const visibleItems = navItems.filter(
    (item) => !item.roles || (user ? item.roles.includes(user.role) : false)
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`py-8 flex items-center gap-2.5 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <img src="/images/logo/Oasys_School_Logo_3.webp" alt="Oasys School" width={32} height={32} className="shrink-0" />
          {showLabel && <span className="text-[15px] font-semibold text-gray-900 dark:text-white/90">Oasys School</span>}
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <h2
            className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
              !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
            }`}
          >
            {showLabel ? "Menu" : <span className="block h-px w-5 bg-gray-200 dark:bg-gray-800" aria-hidden="true" />}
          </h2>

          <ul className="flex flex-col gap-4">
            {visibleItems.map((nav) => (
              <li key={nav.path}>
                <Link
                  to={nav.path}
                  className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"} ${
                    !isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"
                  }`}
                >
                  <span className={`menu-item-icon-size ${isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
                    {nav.icon}
                  </span>
                  {showLabel && <span className="menu-item-text">{nav.name}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
