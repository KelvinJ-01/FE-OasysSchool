const SIZE_CLASS: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'size-8 text-[12px]',
  md: 'size-12 text-[15px]',
  lg: 'size-20 text-[24px]',
};

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface AvatarProps {
  fullName: string;
  photoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ fullName, photoUrl, size = 'md', className = '' }: AvatarProps) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={fullName}
        className={`${SIZE_CLASS[size]} shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${SIZE_CLASS[size]} flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300 ${className}`}
    >
      {getInitials(fullName)}
    </span>
  );
}