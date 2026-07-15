import { useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';

interface PhotoUploadProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  name?: string;
}

const MAX_SIZE = 2 * 1024 * 1024;

export function PhotoUpload({ value, onChange, name = '' }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File | undefined | null) {
    setError(null);
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setError('Format foto harus JPG, PNG, atau WebP.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('Ukuran foto maksimum 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.readAsDataURL(file);
  }

  const initials = name.split(' ').slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase();

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        {value ? (
          <img src={value} alt="Foto profil" className="size-16 rounded-full object-cover" />
        ) : (
          <span className="flex size-16 items-center justify-center rounded-full bg-brand-50 text-[18px] font-semibold text-brand-600 dark:bg-brand-500/10">
            {initials || <Camera size={22} aria-hidden="true" />}
          </span>
        )}
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Hapus foto"
            className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full bg-error-600 text-white shadow-sm hover:bg-error-700"
          >
            <X size={12} aria-hidden="true" />
          </button>
        )}
      </div>
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-9 items-center gap-1.5 rounded-md border border-gray-300 px-3 text-theme-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
        >
          <Camera size={14} aria-hidden="true" />
          {value ? 'Ganti Foto' : 'Unggah Foto'}
        </button>
        <p className="mt-1.5 text-theme-xs text-gray-400">JPG/PNG/WebP, maks. 2 MB.</p>
        {error && <p className="mt-1 text-theme-xs text-error-600">{error}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ''; }}
      />
    </div>
  );
}
