import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Eye, EyeOff, CircleCheck, CircleX } from 'lucide-react';
import PageMeta from '../../components/common/PageMeta';
import AuthPageLayout from './AuthPageLayout';
import { apiClient, getApiErrorCode, getApiErrorMessage } from '../../lib/apiClient';
import { toTitleCase, validatePersonName } from '../../lib/format';
import { Spinner } from '../../components/common/Spinner';
import { Skeleton } from '../../components/common/Skeleton';

interface InvitationInfo {
  email: string;
  schoolName: string;
  expiresAt: string;
}

const inputCls = 'h-11 w-full rounded-md border border-gray-300 bg-white px-3.5 text-[14px] text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20';
const labelCls = 'mb-1.5 block text-[13.5px] font-medium text-gray-900';

export default function TeacherSignUp() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [invalidReason, setInvalidReason] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(true);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [nuptk, setNuptk] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setInvalidReason('Tautan tidak lengkap. Buka kembali tautan dari email undangan Anda.');
      setIsValidating(false);
      return;
    }
    apiClient
      .get<InvitationInfo>(`/teachers/invitations/${encodeURIComponent(token)}`)
      .then((res) => setInvitation(res.data))
      .catch((err) => {
        const code = getApiErrorCode(err);
        if (code === 'ALREADY_REGISTERED') {
          setInvalidReason('Email pada undangan ini sudah memiliki akun. Silakan langsung masuk.');
        } else {
          setInvalidReason(getApiErrorMessage(err, 'Tautan undangan tidak valid atau sudah kedaluwarsa. Mintalah undangan baru kepada Administrator sekolah.'));
        }
      })
      .finally(() => setIsValidating(false));
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFieldError(null);
    const nameError = validatePersonName(fullName);
    if (nameError) {
      setFieldError(`Nama Lengkap: ${nameError}`);
      return;
    }
    if (nuptk && !/^\d{16}$/.test(nuptk)) {
      setFieldError('NUPTK harus 16 digit angka, atau kosongkan bila belum punya.');
      return;
    }
    if (password.length < 8) {
      setFieldError('Kata sandi minimal 8 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setFieldError('Konfirmasi kata sandi tidak sama.');
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient.post('/teachers/registrations', {
        token,
        fullName: toTitleCase(fullName),
        phone: phone || undefined,
        nuptk: nuptk || undefined,
        password,
      });
      setIsDone(true);
    } catch (err) {
      setFieldError(getApiErrorMessage(err, 'Gagal menyelesaikan pendaftaran. Coba lagi.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <PageMeta title="Pendaftaran Guru | Oasys School" description="Selesaikan pendaftaran akun guru Oasys School" />
      <AuthPageLayout>
        <div className="font-jakarta">
          {isValidating && (
            <div className="space-y-3">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-4 w-72" />
              <div className="pt-4" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
            </div>
          )}

          {!isValidating && invalidReason && (
            <div className="text-center">
              <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-error-50 text-error-600">
                <CircleX size={36} aria-hidden="true" />
              </div>
              <h1 className="text-[20px] font-semibold text-gray-900">Tautan tidak dapat digunakan</h1>
              <p className="mt-2 text-[14px] leading-relaxed text-gray-500">{invalidReason}</p>
              <Link to="/signin" className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-brand-500 text-[14px] font-medium text-white transition-colors hover:bg-brand-600">
                Ke halaman masuk
              </Link>
            </div>
          )}

          {!isValidating && isDone && (
            <div className="text-center">
              <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-secondary-50 text-secondary-600">
                <CircleCheck size={36} aria-hidden="true" />
              </div>
              <h1 className="text-[20px] font-semibold text-gray-900">Akun berhasil dibuat</h1>
              <p className="mt-2 text-[14px] leading-relaxed text-gray-500">
                Akun guru untuk <span className="font-medium text-gray-700">{invitation?.email}</span> sudah aktif.
                Silakan masuk dengan email dan kata sandi yang baru Anda buat.
              </p>
              <button
                type="button"
                onClick={() => navigate('/signin', { replace: true })}
                className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-brand-500 text-[14px] font-medium text-white transition-colors hover:bg-brand-600"
              >
                Masuk sekarang
              </button>
            </div>
          )}

          {!isValidating && invitation && !isDone && (
            <>
              <h1 className="text-[22px] font-semibold text-gray-900">Selesaikan pendaftaran akun guru</h1>
              <p className="mt-1.5 text-[14px] text-gray-500">
                Anda diundang oleh Administrator <span className="font-medium text-gray-700">{invitation.schoolName}</span>.
                Akun akan dibuat untuk email <span className="font-medium text-gray-700">{invitation.email}</span>.
              </p>

              {fieldError && (
                <div role="alert" className="mt-4 rounded-md border border-error-200 bg-error-50 px-3.5 py-3 text-[13.5px] text-error-700">
                  {fieldError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
                <div>
                  <label htmlFor="ts-name" className={labelCls}>Nama Lengkap (beserta gelar)<span aria-hidden="true" className="text-error-500"> *</span></label>
                  <input id="ts-name" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} onBlur={(e) => setFullName(toTitleCase(e.target.value))} placeholder="mis. Budi Santoso, S.Pd" className={inputCls} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="ts-phone" className={labelCls}>Nomor Telepon (opsional)</label>
                    <input id="ts-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="ts-nuptk" className={labelCls}>NUPTK (opsional)</label>
                    <input id="ts-nuptk" type="text" inputMode="numeric" maxLength={16} value={nuptk} onChange={(e) => setNuptk(e.target.value.replace(/\D/g, ''))} placeholder="16 digit" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label htmlFor="ts-password" className={labelCls}>Kata Sandi<span aria-hidden="true" className="text-error-500"> *</span></label>
                  <div className="relative">
                    <input id="ts-password" type={showPassword ? 'text' : 'password'} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className={`${inputCls} pr-11`} />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                    </button>
                  </div>
                  <p className="mt-1.5 text-theme-xs text-gray-400">Minimal 8 karakter.</p>
                </div>
                <div>
                  <label htmlFor="ts-confirm" className={labelCls}>Konfirmasi Kata Sandi<span aria-hidden="true" className="text-error-500"> *</span></label>
                  <input id="ts-confirm" type={showPassword ? 'text' : 'password'} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" className={inputCls} />
                </div>

                <button type="submit" disabled={isSubmitting} className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-brand-500 text-[14px] font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60">
                  {isSubmitting && <Spinner size="sm" />}
                  Buat Akun Guru
                </button>
              </form>
            </>
          )}
        </div>
      </AuthPageLayout>
    </>
  );
}
