import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyFieldProps {
  label: string;
  value: string;
  variant?: 'light' | 'dark';
}

export function CopyField({ label, value, variant = 'light' }: CopyFieldProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
    }
  }

  const isDark = variant === 'dark';

  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
        isDark ? 'border-white/10 bg-white/[0.04]' : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]'
      }`}
    >
      <div>
        <p className={`text-theme-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{label}</p>
        <p className={`mt-0.5 font-mono text-[14.5px] font-medium ${isDark ? 'text-white' : 'text-gray-800 dark:text-white/90'}`}>
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Salin ${label}`}
        className={`flex size-8 shrink-0 items-center justify-center rounded-md transition-colors ${
          isDark ? 'text-white/40 hover:bg-white/10 hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10'
        }`}
      >
        {copied ? <Check size={16} className="text-secondary-500" aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
      </button>
    </div>
  );
}