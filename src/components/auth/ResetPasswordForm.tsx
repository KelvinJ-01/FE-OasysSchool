import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight } from 'lucide-react';
import { apiClient, getApiErrorMessage } from '../../lib/apiClient';
import { useToast } from '../../hooks/useToast';
import type { PasswordResetRequest, MessageResponse } from '../../types/auth';

export default function ResetPasswordForm() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): boolean {
    if (!email.trim()) {
      setError('Email wajib diisi.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Format email tidak valid.');
      return false;
    }
    setError(undefined);
    return true;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const payload: PasswordResetRequest = { email: email.trim(), platform: 'web' };
      await apiClient.post<MessageResponse>('/auth/password-resets', payload);
      navigate('/verify-code', { state: { email, purpose: 'password_reset' } });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Gagal mengirim kode. Silakan coba lagi.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="font-jakarta">
      <h1 className="text-[22px] font-semibold text-gray-900">Lupa kata sandi?</h1>
      <p className="mt-1.5 text-[14px] text-gray-500">
        Masukkan email akun Anda, kami akan mengirimkan kode verifikasi 6 digit.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-[13.5px] font-medium text-gray-900">
            Email
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-gray-400">
              <Mail size={18} aria-hidden="true" />
            </span>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@oasysschool.sch.id"
              className={`h-11 w-full rounded-md border bg-white pl-11 pr-3.5 text-[14px] text-gray-900 outline-none transition-shadow focus:ring-2 ${
                error ? 'border-error-300 focus:border-error-500 focus:ring-error-500/20' : 'border-gray-300 focus:border-brand-500 focus:ring-brand-500/20'
              }`}
            />
          </div>
          {error && <p className="mt-1.5 text-[12.5px] text-error-600">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-brand-500 text-[14px] font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          {isSubmitting ? 'Mengirim...' : (
            <>
              Kirim Kode Verifikasi
              <ArrowRight size={16} aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-gray-500">
        Ingat kata sandi Anda?{' '}
        <Link to="/signin" className="font-medium text-brand-500 hover:underline">
          Kembali masuk
        </Link>
      </p>
    </div>
  );
}