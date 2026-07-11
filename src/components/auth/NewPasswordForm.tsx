import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Lock, Eye, EyeOff, CircleCheck } from 'lucide-react';
import { Modal } from '../ui/modal';
import { useModal } from '../../hooks/useModal';
import { apiClient, getApiErrorCode, getApiErrorMessage } from '../../lib/apiClient';
import { useToast } from '../../hooks/useToast';
import { Spinner } from '../common/Spinner';
import type { PasswordResetConfirmRequest, MessageResponse } from '../../types/auth';

interface FormValues {
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  password?: string;
  confirmPassword?: string;
}

interface LocationState {
  email?: string;
  resetToken?: string;
}

export default function NewPasswordForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { email, resetToken } = (location.state as LocationState | null) ?? {};
  const { isOpen, openModal, closeModal } = useModal();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [values, setValues] = useState<FormValues>({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!resetToken) {
      navigate('/reset-password', { replace: true });
    }
  }, [resetToken, navigate]);

  function validate(): boolean {
    const nextErrors: FormErrors = {};
    if (!values.password) {
      nextErrors.password = 'Kata sandi wajib diisi.';
    } else if (values.password.length < 8) {
      nextErrors.password = 'Kata sandi minimal 8 karakter.';
    }
    if (values.confirmPassword !== values.password) {
      nextErrors.confirmPassword = 'Konfirmasi kata sandi tidak cocok.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate() || !resetToken) return;

    try {
      setIsSubmitting(true);
      const payload: PasswordResetConfirmRequest = { resetToken, newPassword: values.password };
      await apiClient.post<MessageResponse>('/auth/password-resets/confirm', payload);
      openModal();
    } catch (err) {
      const code = getApiErrorCode(err);
      if (code === 'RESET_TOKEN_INVALID_OR_EXPIRED') {
        toast.error('Sesi reset kata sandi sudah kedaluwarsa. Silakan ulangi dari awal.');
        navigate('/reset-password', { replace: true });
      } else if (code === 'PASSWORD_POLICY_VIOLATION') {
        setErrors({ password: 'Kata sandi belum memenuhi kebijakan keamanan yang berlaku.' });
      } else {
        toast.error(getApiErrorMessage(err, 'Gagal mengubah kata sandi. Silakan coba lagi.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleGoToSignIn() {
    closeModal();
    navigate('/signin');
  }

  if (!resetToken) {
    return null;
  }

  return (
    <div className="font-jakarta">
      <h1 className="text-[22px] font-semibold text-gray-900">Buat kata sandi baru</h1>
      <p className="mt-1.5 text-[14px] text-gray-500">
        Kata sandi baru harus berbeda dari kata sandi yang pernah digunakan sebelumnya
        {email ? <> untuk <span className="font-medium text-gray-700">{email}</span></> : ''}.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-[13.5px] font-medium text-gray-900">
            Kata sandi baru
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-gray-400">
              <Lock size={18} aria-hidden="true" />
            </span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={values.password}
              onChange={(e) => setValues((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Minimal 8 karakter"
              className={`h-11 w-full rounded-md border bg-white pl-11 pr-11 text-[14px] text-gray-900 outline-none transition-shadow focus:ring-2 ${
                errors.password ? 'border-error-300 focus:border-error-500 focus:ring-error-500/20' : 'border-gray-300 focus:border-brand-500 focus:ring-brand-500/20'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-500"
            >
              {showPassword ? <Eye size={18} aria-hidden="true" /> : <EyeOff size={18} aria-hidden="true" />}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-[12.5px] text-error-600">{errors.password}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-[13.5px] font-medium text-gray-900">
            Konfirmasi kata sandi
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-gray-400">
              <Lock size={18} aria-hidden="true" />
            </span>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={(e) => setValues((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Ulangi kata sandi baru"
              className={`h-11 w-full rounded-md border bg-white pl-11 pr-11 text-[14px] text-gray-900 outline-none transition-shadow focus:ring-2 ${
                errors.confirmPassword ? 'border-error-300 focus:border-error-500 focus:ring-error-500/20' : 'border-gray-300 focus:border-brand-500 focus:ring-brand-500/20'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              aria-label={showConfirmPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-500"
            >
              {showConfirmPassword ? <Eye size={18} aria-hidden="true" /> : <EyeOff size={18} aria-hidden="true" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="mt-1.5 text-[12.5px] text-error-600">{errors.confirmPassword}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-11 w-full items-center justify-center rounded-md bg-brand-500 text-[14px] font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Menyimpan...
            </>
          ) : (
            'Simpan Kata Sandi'
          )}
        </button>
      </form>

      <Modal isOpen={isOpen} onClose={closeModal} className="m-4 max-w-[420px]">
        <div className="flex flex-col items-center px-2 py-6 text-center font-jakarta">
          <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-secondary-50 text-secondary-600">
            <CircleCheck size={36} aria-hidden="true" />
          </div>
          <h4 className="mb-2 text-[18px] font-semibold text-gray-900">Kata sandi berhasil diubah</h4>
          <p className="mb-6 text-[14px] text-gray-500">
            Kata sandi akun Anda telah berhasil diperbarui. Silakan masuk kembali menggunakan kata sandi baru Anda.
          </p>
          <button
            type="button"
            onClick={handleGoToSignIn}
            className="flex h-11 w-full items-center justify-center rounded-md bg-brand-500 text-[14px] font-medium text-white transition-colors hover:bg-brand-600"
          >
            Masuk Sekarang
          </button>
        </div>
      </Modal>
    </div>
  );
}