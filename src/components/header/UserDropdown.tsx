import { useState } from "react";
import { LogOut, User as UserIcon } from "lucide-react";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { useAuth } from "../../hooks/useAuth";
import { Avatar } from "../common/Avatar";

const ROLE_LABEL: Record<string, string> = {
  administrator: "Administrator",
  teacher: "Guru",
};

export default function UserDropdown() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  function handleSignOut() {
    closeDropdown();
    logout();
  }

  if (!user) return null;

  const displayName = user.fullName || (ROLE_LABEL[user.role] ?? user.role);

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center text-gray-700 dropdown-toggle dark:text-gray-400"
      >
        <span className="mr-3">
          <Avatar fullName={displayName} photoUrl={user.photoUrl} size="sm" />

        </span>

        <span className="block mr-1 font-medium text-theme-sm">{displayName}</span>

        <svg
          className={`stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

        </svg>

      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div className="flex items-center gap-3 px-1 pb-1">
          <Avatar fullName={displayName} photoUrl={user.photoUrl} size="md" />

          <div className="min-w-0">
            <span className="block truncate font-medium text-gray-700 text-theme-sm dark:text-gray-400">
              {displayName}
            </span>

            <span className="mt-0.5 block truncate text-theme-xs text-gray-500 dark:text-gray-400">
              {user.email ?? (ROLE_LABEL[user.role] ?? user.role)}
            </span>

          </div>

        </div>

        <ul className="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              to="/profile"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              <UserIcon
                size={20}
                className="text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"
                aria-hidden="true"
              />

              Profil Saya
            </DropdownItem>

          </li>

        </ul>

        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
        >
          <LogOut
            size={20}
            className="text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"
            aria-hidden="true"
          />

          Keluar
        </button>

      </Dropdown>

    </div>

  );
}
