import { AlertTriangle } from 'lucide-react';
import { Modal } from '../ui/modal';
import { Spinner } from './Spinner';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'default';
  isProcessing?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  tone = 'default',
  isProcessing = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const isDanger = tone === 'danger';

  return (
    <Modal isOpen={isOpen} onClose={onCancel} className="m-4 max-w-md">
      <div className="p-6">
        <div className="flex gap-4">
          {isDanger && (
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-error-50 text-error-600">
              <AlertTriangle size={22} aria-hidden="true" />

            </span>

          )}
          <div>
            <h3 className="pr-10 text-[15px] font-semibold text-gray-900 dark:text-white/90">{title}</h3>

            <p className="pr-6 mt-1.5 text-[13.5px] leading-relaxed text-gray-500 dark:text-gray-400">{description}</p>

          </div>

        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="h-10 rounded-md px-4 text-[13.5px] font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-60 dark:text-gray-300 dark:hover:bg-white/5"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className={`flex h-10 items-center gap-2 rounded-md px-5 text-[13.5px] font-medium text-white transition-colors disabled:opacity-60 ${
              isDanger ? 'bg-error-600 hover:bg-error-700' : 'bg-brand-500 hover:bg-brand-600'
            }`}
          >
            {isProcessing && <Spinner size="sm" />}

            {confirmLabel}
          </button>

        </div>

      </div>

    </Modal>

  );
}
