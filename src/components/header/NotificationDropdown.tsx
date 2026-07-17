import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Bell, CalendarCheck, UserPlus, Info, CheckCheck } from 'lucide-react';
import { Dropdown } from '../ui/dropdown/Dropdown';
import { apiClient } from '../../lib/apiClient';
import type { AppNotification, NotificationsResponse, NotificationType } from '../../types/notification';

const ICONS: Record<NotificationType, React.ReactNode> = {
  attendance: <CalendarCheck size={16} aria-hidden="true" />,

  account: <UserPlus size={16} aria-hidden="true" />,

  system: <Info size={16} aria-hidden="true" />,
};

const ICON_TONE: Record<NotificationType, string> = {
  attendance: 'bg-secondary-50 text-secondary-600',
  account: 'bg-blue-light-50 text-blue-light-600',
  system: 'bg-gray-100 text-gray-500',
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return 'baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.round(hours / 24);
  return `${days} hari lalu`;
}

export default function NotificationDropdown() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(() => {
    setIsLoading(true);
    apiClient
      .get<NotificationsResponse>('/notifications')
      .then((res) => {
        setItems(res.data.items);
        setUnreadCount(res.data.unreadCount);
      })
      .catch(() => {
        setItems([]);
        setUnreadCount(0);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  function openDropdown() {
    setIsOpen(true);
    fetchNotifications();
  }

  async function markAllRead() {
    setUnreadCount(0);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await apiClient.post('/notifications/read-all');
    } catch {
      void 0;
    }
  }

  async function handleItemClick(notif: AppNotification) {
    if (!notif.read) {
      setItems((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
      apiClient.patch(`/notifications/${notif.id}/read`).catch(() => undefined);
    }
    setIsOpen(false);
    if (notif.link) navigate(notif.link);
  }

  return (
    <div className="relative">
      <button
        onClick={openDropdown}
        aria-label="Notifikasi"
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
      >
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 z-10 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />

            <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-400" />

          </span>

        )}
        <Bell size={20} aria-hidden="true" />

      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="absolute -right-16 mt-3 flex max-h-[460px] w-[340px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[380px] lg:right-0"
      >
        <div className="mb-2 flex items-center justify-between border-b border-gray-100 px-2 pb-3 dark:border-gray-800">
          <div>
            <h5 className="text-[15px] font-semibold text-gray-800 dark:text-gray-100">Notifikasi</h5>

            {unreadCount > 0 && (
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">{unreadCount} belum dibaca</p>

            )}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="flex items-center gap-1 text-theme-xs font-medium text-brand-500 hover:underline"
            >
              <CheckCheck size={14} aria-hidden="true" />

              Tandai semua
            </button>

          )}
        </div>

        <ul className="flex flex-col overflow-y-auto custom-scrollbar">
          {isLoading && items.length === 0 && (
            <li className="px-3 py-8 text-center text-theme-sm text-gray-400">Memuat notifikasi…</li>

          )}
          {!isLoading && items.length === 0 && (
            <li className="px-3 py-10 text-center text-theme-sm text-gray-400">Belum ada notifikasi.</li>

          )}
          {items.map((notif) => (
            <li key={notif.id}>
              <button
                type="button"
                onClick={() => handleItemClick(notif)}
                className={`flex w-full gap-3 rounded-lg p-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/5 ${
                  notif.read ? '' : 'bg-brand-50/40 dark:bg-brand-500/5'
                }`}
              >
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${ICON_TONE[notif.type]}`}>
                  {ICONS[notif.type]}
                </span>

                <span className="block min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-theme-sm font-medium text-gray-800 dark:text-white/90">{notif.title}</span>

                    {!notif.read && <span className="size-2 shrink-0 rounded-full bg-brand-500" aria-label="Belum dibaca" />}

                  </span>

                  <span className="mt-0.5 block text-theme-xs leading-relaxed text-gray-500 dark:text-gray-400">{notif.body}</span>

                  <span className="mt-1 block text-theme-xs text-gray-400">{timeAgo(notif.createdAt)}</span>

                </span>

              </button>

            </li>

          ))}
        </ul>

      </Dropdown>

    </div>

  );
}
