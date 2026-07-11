import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient, getApiErrorCode, getApiErrorDetails, getApiErrorMessage } from '../../lib/apiClient';
import { useToast } from '../../hooks/useToast';
import type { ParentRegistrationRequest, ParentRegistrationResponse, PrivacyPolicyResponse } from '../../types/auth';

interface FieldErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  studentNisn?: string;
  consent?: string;
}

export function SignUpForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [studentNisn, setStudentNisn] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [policyVersion, setPolicyVersion] = useState<string | null>(null);
  const [policyLoadError, setPolicyLoadError] = useState(false);

  useEffect(() => {
    apiClient
      .get<PrivacyPolicyResponse>('/legal/privacy-policy')
      .then((res) => setPolicyVersion(res.data.version))
      .catch(() => setPolicyLoadError(true));
  }, []);

  function validateClientSide(): FieldErrors {
    const errors: FieldErrors = {};
    if (fullName.trim().length < 3) errors.fullName = 'Nama lengkap minimal 3 karakter.';
    if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Format email tidak valid.';
    if (password.length < 8) errors.password = 'Kata sandi minimal 8 karakter.';
    if (!/^\d{10}$/.test(studentNisn)) errors.studentNisn = 'NISN harus terdiri dari 10 digit angka.';
    if (!consentAccepted) errors.consent = 'Persetujuan wajib dicentang untuk melanjutkan.';
    return errors;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const clientErrors = validateClientSide();
    if (!policyVersion) {
      clientErrors.consent = 'Kebijakan privasi belum berhasil dimuat, coba muat ulang halaman.';
    }
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);

    const payload: ParentRegistrationRequest = {
      fullName: fullName.trim(),
      email: email.trim(),
      ...(phone.trim() ? { phone: phone.trim() } : {}),
      password,
      studentNisn,
      consent: { policyVersion: policyVersion as string, accepted: true },
    };

    try {
      const { data } = await apiClient.post<ParentRegistrationResponse>('/auth/parent-registrations', payload);
      navigate('/verify-code', { state: { email: data.email, purpose: 'email_verification' } });
    } catch (err) {
      const code = getApiErrorCode(err);
      if (code === 'VALIDATION_ERROR') {
        const details = getApiErrorDetails(err);
        const mapped: FieldErrors = {};
        for (const d of details) {
          (mapped as Record<string, string>)[d.field ?? 'form'] = d.message;
        }
        setFieldErrors(mapped);
        toast.error('Periksa kembali data yang kamu isi.');
      } else if (code === 'EMAIL_ALREADY_REGISTERED') {
        setFieldErrors({ email: 'Email ini sudah terdaftar. Coba masuk atau gunakan email lain.' });
      } else if (code === 'NISN_NOT_FOUND') {
        setFieldErrors({ studentNisn: 'NISN tidak ditemukan/tidak valid. Pastikan penulisannya benar.' });
      } else {
        toast.error(getApiErrorMessage(err, 'Registrasi gagal. Coba lagi.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="font-jakarta">
      <h1 className="text-[22px] font-semibold text-gray-900">Daftar sebagai orang tua</h1>
      <p className="mt-1.5 text-[14px] text-gray-500">Pantau presensi dan info akademik anak Anda.</p>

      <div className="mt-5 rounded-md border border-brand-100 bg-brand-25 px-3.5 py-3 text-[13px] leading-relaxed text-brand-700">
        Setelah email terverifikasi, akun ini hanya dapat digunakan di{' '}
        <span className="font-medium">Aplikasi Mobile Oasys School</span> — pendaftaran boleh lewat sini, tapi
        pemakaian sehari-hari lewat aplikasi.
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
        <Field label="Nama lengkap" htmlFor="fullName" error={fieldErrors.fullName}>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Siti Aminah"
            className={inputClass(!!fieldErrors.fullName)}
          />
        </Field>

        <Field label="Email" htmlFor="email" error={fieldErrors.email}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="siti.aminah@email.com"
            className={inputClass(!!fieldErrors.email)}
          />
        </Field>

        <Field label="Nomor telepon (opsional)" htmlFor="phone" error={fieldErrors.phone}>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08123456789"
            className={inputClass(!!fieldErrors.phone)}
          />
        </Field>

        <Field label="Kata sandi" htmlFor="password" error={fieldErrors.password} helper="Minimal 8 karakter.">
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Buat kata sandi"
            className={inputClass(!!fieldErrors.password)}
          />
        </Field>

        <Field
          label="NISN anak"
          htmlFor="studentNisn"
          error={fieldErrors.studentNisn}
          helper="10 digit, sesuai kartu NISN/rapor anak Anda."
        >
          <input
            id="studentNisn"
            type="text"
            inputMode="numeric"
            maxLength={10}
            value={studentNisn}
            onChange={(e) => setStudentNisn(e.target.value.replace(/\D/g, ''))}
            placeholder="0012345678"
            className={inputClass(!!fieldErrors.studentNisn)}
          />
        </Field>

        <div>
          <label className="flex items-start gap-2.5 text-[13.5px] text-gray-700">
            <input
              type="checkbox"
              checked={consentAccepted}
              onChange={(e) => setConsentAccepted(e.target.checked)}
              disabled={!policyVersion}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/30"
            />
            <span>
              Saya menyetujui{' '}
              <Link to="/privacy-policy" target="_blank" className="font-medium text-brand-500 hover:underline">
                Kebijakan Privasi{policyVersion ? ` (v${policyVersion})` : ''}
              </Link>{' '}
              dan pemrosesan data anak saya untuk keperluan presensi sekolah.
            </span>
          </label>
          {policyLoadError && (
            <p className="mt-1.5 text-[12.5px] text-error-600">
              Gagal memuat kebijakan privasi. Muat ulang halaman untuk mencoba lagi.
            </p>
          )}
          {fieldErrors.consent && <p className="mt-1.5 text-[12.5px] text-error-600">{fieldErrors.consent}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-11 w-full items-center justify-center rounded-md bg-brand-500 text-[14px] font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          {isSubmitting ? 'Memproses...' : 'Daftar'}
        </button>
      </form>

      <p className="mt-6 text-[13px] text-gray-500">
        Sudah punya akun?{' '}
        <Link to="/signin" className="font-medium text-brand-500 hover:underline">
          Masuk
        </Link>
      </p>
    </div>
  );
}

function inputClass(hasError: boolean): string {
  const base =
    'h-11 w-full rounded-md border bg-white px-3.5 text-[14px] text-gray-900 outline-none transition-shadow focus:ring-2';
  return hasError
    ? `${base} border-error-300 focus:border-error-500 focus:ring-error-500/20`
    : `${base} border-gray-300 focus:border-brand-500 focus:ring-brand-500/20`;
}

function Field({
  label,
  htmlFor,
  error,
  helper,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13.5px] font-medium text-gray-900">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-[12.5px] text-error-600">{error}</p>
      ) : helper ? (
        <p className="mt-1.5 text-[12.5px] text-gray-500">{helper}</p>
      ) : null}
    </div>
  );
}