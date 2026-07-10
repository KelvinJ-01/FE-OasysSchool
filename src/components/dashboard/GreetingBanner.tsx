import { useAuth } from '../../hooks/useAuth';

const ROLE_LABEL: Record<string, string> = {
  administrator: 'Administrator',
  teacher: 'Guru',
};

export function GreetingBanner() {
  const { user } = useAuth();
  const roleLabel = user ? ROLE_LABEL[user.role] ?? user.role : '';
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div>
      <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
        Selamat datang, {user?.fullName || roleLabel}
      </h1>
      <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
        {roleLabel && user?.fullName ? `${roleLabel} · ` : ''}
        {today}
      </p>
    </div>
  );
}