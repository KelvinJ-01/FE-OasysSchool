import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ClipboardEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, CircleCheck } from 'lucide-react';
import { apiClient, getApiErrorCode, getApiErrorMessage } from '../../lib/apiClient';
import type {
  PasswordResetRequest,
  PasswordResetVerifyOtpRequest,
  PasswordResetVerifyOtpResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  ResendOtpRequest,
  MessageResponse,
} from '../../types/auth';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

type VerifyPurpose = 'email_verification' | 'password_reset';

interface LocationState {
  email?: string;
  purpose?: VerifyPurpose;
}

export default function VerifyCodeForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, purpose = 'email_verification' } = (location.state as LocationState | null) ?? {};

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const code = digits.join('');

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function setDigitAt(index: number, value: string) {
    setDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function handleChange(index: number, value: string) {
    const sanitized = value.replace(/[^0-9]/g, '').slice(-1);
    setDigitAt(index, sanitized);
    if (sanitized && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = Array(CODE_LENGTH).fill('');
    pasted.split('').forEach((char, i) => (next[i] = char));
    setDigits(next);
    inputsRef.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Sesi verifikasi tidak lengkap. Ulangi dari awal.');
      return;
    }
    if (code.length !== CODE_LENGTH) {
      setError('Masukkan seluruh 6 digit kode verifikasi.');
      return;
    }

    try {
      setIsSubmitting(true);

      if (purpose === 'password_reset') {
        const payload: PasswordResetVerifyOtpRequest = { email, otp: code };
        const { data } = await apiClient.post<PasswordResetVerifyOtpResponse>('/auth/password-resets/verify-otp', payload);
        navigate('/new-password', { state: { email, resetToken: data.resetToken } });
      } else {
        const payload: VerifyEmailRequest = { email, otp: code };
        const { data } = await apiClient.post<VerifyEmailResponse>('/auth/parent-registrations/verify-email', payload);
        setVerifiedEmail(email);
        void data;
      }
    } catch (err) {
      const code_ = getApiErrorCode(err);
      if (code_ === 'OTP_INVALID_OR_EXPIRED') {
        setError('Kode salah atau sudah kedaluwarsa. Coba kirim ulang.');
      } else if (code_ === 'OTP_ATTEMPTS_EXCEEDED') {
        setError('Terlalu banyak percobaan. Minta kode baru lewat "Kirim ulang kode".');
      } else if (code_ === 'EMAIL_NOT_FOUND') {
        setError('Tidak ada pendaftaran tertunda untuk email ini.');
      } else {
        setError(getApiErrorMessage(err, 'Kode tidak valid. Silakan coba lagi.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0 || !email) return;
    setError(null);
    setIsResending(true);
    try {
      if (purpose === 'password_reset') {
        const payload: PasswordResetRequest = { email, platform: 'web' };
        await apiClient.post<MessageResponse>('/auth/password-resets', payload);
      } else {
        const payload: ResendOtpRequest = { email };
        await apiClient.post<MessageResponse>('/auth/parent-registrations/resend-otp', payload);
      }
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      const code_ = getApiErrorCode(err);
      setError(code_ === 'RESEND_RATE_LIMITED' ? 'Terlalu sering meminta kirim ulang. Coba beberapa saat lagi.' : getApiErrorMessage(err, 'Gagal mengirim ulang kode.'));
    } finally {
      setIsResending(false);
    }
  }

  if (verifiedEmail) {
    return (
      <div className="font-jakarta text-center">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-secondary-50 text-secondary-600">
          <CircleCheck size={36} aria-hidden="true" />
        </div>
        <h1 className="text-[20px] font-semibold text-gray-900">Email berhasil diverifikasi</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-gray-500">
          Akun <span className="font-medium text-gray-700">{verifiedEmail}</span> sudah aktif. Silakan login melalui{' '}
          <span className="font-medium text-gray-900">Aplikasi Mobile Oasys School</span> untuk mulai memantau presensi anak Anda.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-brand-500 text-[14px] font-medium text-white transition-colors hover:bg-brand-600"
        >
          Kembali ke beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="font-jakarta">
      <h1 className="text-[22px] font-semibold text-gray-900">Verifikasi kode</h1>
      <p className="mt-1.5 text-[14px] text-gray-500">
        Masukkan 6 digit kode yang kami kirim ke{' '}
        <span className="font-medium text-gray-700">{email ?? 'email Anda'}</span>
      </p>

      {error && (
        <div role="alert" className="mt-5 rounded-md border border-error-200 bg-error-50 px-3.5 py-3 text-[13.5px] leading-relaxed text-error-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6" noValidate>
        <div className="flex justify-center gap-2.5 sm:gap-3" onPaste={handlePaste}>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputsRef.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              aria-label={`Digit ke-${index + 1}`}
              className="h-12 w-12 rounded-md border border-gray-300 bg-white text-center text-lg font-semibold text-gray-900 outline-none transition-shadow focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 sm:h-14 sm:w-14"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-brand-500 text-[14px] font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          {isSubmitting ? 'Memverifikasi...' : (
            <>
              Verifikasi Kode
              <ArrowRight size={16} aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-gray-500">
        Tidak menerima kode?{' '}
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending || cooldown > 0}
          className="font-medium text-brand-500 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
        >
          {isResending ? 'Mengirim ulang...' : cooldown > 0 ? `Kirim ulang (${cooldown}s)` : 'Kirim ulang kode'}
        </button>
      </p>

      {purpose === 'password_reset' && (
        <p className="mt-2 text-center text-[13px]">
          <Link to="/signin" className="font-medium text-brand-500 hover:underline">
            Kembali masuk
          </Link>
        </p>
      )}
    </div>
  );
}