import { Loader2 } from 'lucide-react';

const SIZE_PX: Record<'sm' | 'md' | 'lg', number> = { sm: 14, md: 18, lg: 26 };

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return <Loader2 size={SIZE_PX[size]} className={`animate-spin ${className}`} aria-hidden="true" />;
}