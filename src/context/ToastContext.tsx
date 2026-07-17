import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CircleCheck, CircleX, Info, TriangleAlert, X } from 'lucide-react';
import {
  ToastContext,
  type ToastApi,
  type ToastItem,
  type ToastVariant,
} from './toastContextObject';

const VARIANT_STYLE: Record<ToastVariant, { icon: ReactNode; className: string; role: 'status' | 'alert' }> = {
  success: { icon: <CircleCheck size={18} aria-hidden="true" />, className: 'border-success-200 bg-success-50 text-success-700', role: 'status' },

  error: { icon: <CircleX size={18} aria-hidden="true" />, className: 'border-error-200 bg-error-50 text-error-700', role: 'alert' },

  info: { icon: <Info size={18} aria-hidden="true" />, className: 'border-brand-200 bg-brand-25 text-brand-700', role: 'status' },

  warning: { icon: <TriangleAlert size={18} aria-hidden="true" />, className: 'border-warning-200 bg-warning-50 text-warning-700', role: 'status' },
};

const DURATION_MS: Record<ToastVariant, number> = {
  success: 4000,
  info: 4000,
  warning: 5000,
  error: 6000,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const push = useCallback(
    (variant: ToastVariant, message: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setItems((prev) => [...prev, { id, variant, message }]);
      timers.current[id] = setTimeout(() => remove(id), DURATION_MS[variant]);
    },
    [remove],
  );

  const toast = useMemo<ToastApi>(
    () => ({
      success: (message) => push('success', message),
      error: (message) => push('error', message),
      info: (message) => push('info', message),
      warning: (message) => push('warning', message),
    }),
    [push],
  );

  const contextValue = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          className="pointer-events-none fixed bottom-5 right-5 z-[99999] flex w-full max-w-sm flex-col gap-2.5"
        >
          {items.map((item) => {
            const style = VARIANT_STYLE[item.variant];
            return (
              <div
                key={item.id}
                role={style.role}
                className={`pointer-events-auto flex items-start gap-2.5 rounded-lg border px-4 py-3 text-theme-sm shadow-theme-lg ${style.className}`}
              >
                <span className="mt-0.5 shrink-0">{style.icon}</span>

                <p className="flex-1 leading-relaxed">{item.message}</p>

                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  aria-label="Tutup notifikasi"
                  className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
                >
                  <X size={16} aria-hidden="true" />

                </button>

              </div>

            );
          })}
        </div>,

        document.body,
      )}
    </ToastContext.Provider>

  );
}
