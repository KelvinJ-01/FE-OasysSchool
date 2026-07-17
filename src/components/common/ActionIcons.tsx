import { Eye, Pencil, Trash2 } from 'lucide-react';

interface ActionIconsProps {
  label: string;
  onDetail?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ActionIcons({ label, onDetail, onEdit, onDelete }: ActionIconsProps) {
  const base = 'flex size-8 items-center justify-center rounded-md transition-colors';
  return (
    <div className="flex justify-end gap-1">
      {onDetail && (
        <button
          type="button"
          onClick={onDetail}
          aria-label={`Detail ${label}`}
          title="Detail"
          className={`${base} text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-gray-200`}
        >
          <Eye size={16} aria-hidden="true" />

        </button>

      )}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Ubah ${label}`}
          title="Ubah"
          className={`${base} text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10`}
        >
          <Pencil size={16} aria-hidden="true" />

        </button>

      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Hapus ${label}`}
          title="Hapus"
          className={`${base} text-gray-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10`}
        >
          <Trash2 size={16} aria-hidden="true" />

        </button>

      )}
    </div>

  );
}
