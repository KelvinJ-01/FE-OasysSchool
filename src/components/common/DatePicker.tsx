import { useEffect, useRef } from 'react';
import flatpickr from 'flatpickr';
import { Indonesian } from 'flatpickr/dist/l10n/id';
import 'flatpickr/dist/flatpickr.min.css';
import { CalendarDays } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  className?: string;
  placeholder?: string;
}

const ALT_INPUT_CLASS =
  'h-10 w-48 cursor-pointer rounded-md border border-gray-300 bg-white pl-9 pr-3 text-theme-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300';

export function DatePicker({ value, onChange, ariaLabel = 'Pilih tanggal', className = '', placeholder }: DatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<flatpickr.Instance | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!inputRef.current || pickerRef.current) return;
    pickerRef.current = flatpickr(inputRef.current, {
      locale: Indonesian,
      dateFormat: 'Y-m-d',
      altInput: true,
      altFormat: 'j F Y',
      altInputClass: ALT_INPUT_CLASS,
      ...(value ? { defaultDate: value } : {}),
      disableMobile: true,
      onChange: (dates) => {
        if (dates[0]) {
          const d = dates[0];
          const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          onChangeRef.current(iso);
        }
      },
    });
    if (placeholder && pickerRef.current.altInput) {
      pickerRef.current.altInput.placeholder = placeholder;
    }
    return () => {
      pickerRef.current?.destroy();
      pickerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!pickerRef.current) return;
    const current = pickerRef.current.selectedDates[0];
    const iso = current
      ? `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`
      : '';
    if (iso === value) return;
    if (value) pickerRef.current.setDate(value, false);
    else pickerRef.current.clear(false);
  }, [value]);

  return (
    <div className={`relative ${className}`}>
      <span className="pointer-events-none absolute inset-y-0 left-3 z-10 flex items-center text-gray-400">
        <CalendarDays size={16} aria-hidden="true" />
      </span>
      <input ref={inputRef} aria-label={ariaLabel} className="hidden" readOnly />
    </div>
  );
}
