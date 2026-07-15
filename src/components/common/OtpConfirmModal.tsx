import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Modal } from '../ui/modal';
import { Spinner } from './Spinner';
import { apiClient, getApiErrorMessage } from '../../lib/apiClient';
import { otpSchema } from '../../lib/schemas';
import { parseFormData } from '../../lib/validateForm';

interface OtpConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  confirmEndpoint: string;
  resendEndpoint?: string;
  resendBody?: Record<string, unknown>;
  title?: string;
  description?: string;
  onConfirmed: (message: string) => void;
}

const LENGTH = 6;

export function OtpConfirmModal({
  isOpen, onClose, email, confirmEndpoint, resendEndpoint, resendBody,
  title = 'Verifikasi Perubahan', description, onConfirmed,
}: OtpConfirmModalProps) {
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendInfo, setResendInfo] = useState<string | null>(null);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (isOpen) {
      setDigits(Array(LENGTH).fill(''));
      setError(null);
      setResendInfo(null);
      setTimeout(() => refs.current[0]?.focus(), 50);
    }
  }, [isOpen]);

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < LENGTH - 1) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) refs.current[index - 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH);
    if (!text) return;
    e.preventDefault();
    setDigits(Array.from({ length: LENGTH }, (_, i) => text[i] ?? ''));
    refs.current[Math.min(text.length, LENGTH - 1)]?.focus();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const otp = digits.join('');
    const parsed = parseFormData(otpSchema, { otp });
    if (!parsed.success) {
      setError('Masukkan seluruh 6 digit kode.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { data } = await apiClient.post<{ message: string }>(confirmEndpoint, { otp });
      onConfirmed(data.message);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Kode salah atau sudah kedaluwarsa.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (!resendEndpoint) return;
    setIsResending(true);
    setError(null);
    setResendInfo(null);
    try {
      await apiClient.post(resendEndpoint, resendBody ?? {});
      setResendInfo('Kode baru telah dikirim.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Gagal mengirim ulang kode.'));
    } finally {
      setIsResending(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-md">
      <div className="p-6">
        <div className="flex gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/10">
            <ShieldCheck size={22} aria-hidden="true" />
          </span>
          <div className="pr-8">
            <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white/90">{title}</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">
              {description ?? `Kami mengirim kode 6 digit ke ${email}. Masukkan kode itu untuk melanjutkan.`}
            </p>
          </div>
        </div>

        {error && <div role="alert" className="mt-4 rounded-md border border-error-200 bg-error-50 px-3.5 py-3 text-[13.5px] text-error-700">{error}</div>}
        {resendInfo && <div className="mt-4 rounded-md border border-secondary-200 bg-secondary-50 px-3.5 py-3 text-[13.5px] text-secondary-700">{resendInfo}</div>}

        <form onSubmit={handleSubmit} className="mt-5" noValidate>
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { refs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                aria-label={`Digit ${i + 1}`}
                className="h-12 w-11 rounded-md border border-gray-300 bg-white text-center text-[18px] font-semibold text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            ))}
          </div>

          {resendEndpoint && (
            <p className="mt-4 text-center text-theme-xs text-gray-400">
              Tidak menerima kode?{' '}
              <button type="button" onClick={handleResend} disabled={isResending} className="font-medium text-brand-500 hover:underline disabled:opacity-60">
                {isResending ? 'Mengirim…' : 'Kirim ulang'}
              </button>
            </p>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="h-10 rounded-md px-4 text-[13.5px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60 dark:text-gray-300 dark:hover:bg-white/5">
              Batal
            </button>
            <button type="submit" disabled={isSubmitting} className="flex h-10 items-center gap-2 rounded-md bg-brand-500 px-5 text-[13.5px] font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60">
              {isSubmitting && <Spinner size="sm" />}
              Konfirmasi
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
