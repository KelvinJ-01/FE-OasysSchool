import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../common/Avatar';

const ROLE_LABEL: Record<string, string> = {
  administrator: 'Administrator',
  teacher: 'Guru',
};

function greetingByHour(): string {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 18) return 'Selamat sore';
  return 'Selamat malam';
}

function shortName(fullName: string): string {
  const words = fullName.split(' ').filter(Boolean);
  if (words.length === 0) return fullName;
  if (['Pak', 'Ibu', 'Bapak'].includes(words[0]) && words.length > 1) return `${words[0]} ${words[1]}`;
  return words[0];
}

export function GreetingBanner() {
  const { user } = useAuth();
  const roleLabel = user ? ROLE_LABEL[user.role] ?? user.role : '';
  const now = new Date();
  const today = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3.5">
        {user && <Avatar fullName={user.fullName || roleLabel} photoUrl={user.photoUrl} size="md" />}

        <div>
          <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
            {greetingByHour()}, {shortName(user?.fullName || roleLabel)}
          </h1>

          <p className="mt-0.5 text-theme-sm text-gray-500 dark:text-gray-400">
            {roleLabel && user?.fullName ? `${roleLabel} · ` : ''}Semoga harinya lancar.
          </p>

        </div>

      </div>

      <span className="rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-theme-xs font-medium text-gray-600 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300">
        {today}
      </span>

    </div>

  );
}
