import { useState, type FormEvent } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { apiClient, getApiErrorCode, getApiErrorMessage } from '../../lib/apiClient';
import { useToast } from '../../hooks/useToast';
import { Spinner } from '../common/Spinner';
import { OtpConfirmModal } from '../common/OtpConfirmModal';
import { changePasswordSchema } from '../../lib/schemas';
import { parseFormData } from '../../lib/validateForm';
import type { ChangePasswordRequest } from '../../types/profile';
import type { MessageResponse } from '../../types/auth';

interface FormValues {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

interface FieldErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
}

const EMPTY_VALUES: FormValues = { currentPassword: '', newPassword: '', confirmNewPassword: '' };

export function ChangePasswordCard() {
  const { toast } = useToast();
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [visible, setVisible] = useState({ current: false, next: false, confirm: false });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): boolean {
    const result = parseFormData(changePasswordSchema, values);
    setErrors(result.success ? {} : result.errors);
    return result.success;
  }

  const [isOtpOpen, setIsOtpOpen] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: ChangePasswordRequest = { currentPassword: values.currentPassword, newPassword: values.newPassword };
      await apiClient.post<MessageResponse>('/users/me/password/change-request', payload);
      setIsOtpOpen(true);
    } catch (err) {
      const code = getApiErrorCode(err);
      if (code === 'CURRENT_PASSWORD_INVALID' || code === 'INVALID_CURRENT_PASSWORD') {
        setErrors({ currentPassword: 'Kata sandi saat ini tidak cocok.' });
      } else if (code === 'PASSWORD_POLICY_VIOLATION' || code === 'VALIDATION_ERROR') {
        setErrors({ newPassword: 'Kata sandi baru belum memenuhi kebijakan keamanan yang berlaku.' });
      } else {
        toast.error(getApiErrorMessage(err, 'Gagal mengubah kata sandi.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function field(
    id: 'currentPassword' | 'newPassword' | 'confirmNewPassword',
    label: string,
    visKey: 'current' | 'next' | 'confirm',
    autoComplete: string,
  ) {
    const isVisible = visible[visKey];
    return (
      <div>
        <label htmlFor={id} className="mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90">
          {label}<span aria-hidden="true" className="text-error-500"> *</span>

        </label>

        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-gray-400">
            <Lock size={18} aria-hidden="true" />

          </span>

          <input
            id={id}
            type={isVisible ? 'text' : 'password'}
            autoComplete={autoComplete}
            value={values[id]}
            onChange={(e) => setValues((prev) => ({ ...prev, [id]: e.target.value }))}
            className={`h-11 w-full rounded-md border bg-white pl-11 pr-11 text-[14px] text-gray-900 outline-none transition-shadow focus:ring-2 dark:bg-gray-900 dark:text-white/90 ${
              errors[id] ? 'border-error-300 focus:border-error-500 focus:ring-error-500/20' : 'border-gray-300 focus:border-brand-500 focus:ring-brand-500/20 dark:border-gray-700'
            }`}
          />
          <button
            type="button"
            onClick={() => setVisible((prev) => ({ ...prev, [visKey]: !prev[visKey] }))}
            aria-label={isVisible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-500"
          >
            {isVisible ? <Eye size={18} aria-hidden="true" /> : <EyeOff size={18} aria-hidden="true" />}
          </button>

        </div>

        {errors[id] && <p className="mt-1.5 text-[12.5px] text-error-600">{errors[id]}</p>}

      </div>

    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <h3 className="mb-5 pr-10 text-theme-sm font-semibold text-gray-800 dark:text-white/90">Ganti Kata Sandi</h3>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {field('currentPassword', 'Kata Sandi Saat Ini', 'current', 'current-password')}
        {field('newPassword', 'Kata Sandi Baru', 'next', 'new-password')}
        {field('confirmNewPassword', 'Konfirmasi Kata Sandi Baru', 'confirm', 'new-password')}

        <div className="flex justify-end border-t border-gray-100 pt-5 dark:border-gray-800">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-10 items-center justify-center rounded-md bg-brand-500 px-5 text-[14px] font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Spinner size="sm" className="mr-2" />

                Menyimpan...
              </>

            ) : (
              'Ubah Kata Sandi'
            )}
          </button>

        </div>

      </form>

      <OtpConfirmModal
        isOpen={isOtpOpen}
        onClose={() => setIsOtpOpen(false)}
        email=""
        confirmEndpoint="/users/me/password/confirm"
        title="Verifikasi Perubahan Kata Sandi"
        description="Demi keamanan, kami mengirim kode 6 digit ke email Anda. Masukkan kode itu untuk menerapkan kata sandi baru."
        onConfirmed={(message) => {
          setIsOtpOpen(false);
          setValues(EMPTY_VALUES);
          toast.success(message);
        }}
      />
    </div>

  );
}
