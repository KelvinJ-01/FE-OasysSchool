import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CircleCheck, Clock, CircleX, Camera, Trash2 } from 'lucide-react';
import { apiClient, getApiErrorCode, getApiErrorDetails, getApiErrorMessage } from '../../lib/apiClient';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { toTitleCase } from '../../lib/format';
import { profileSchema } from '../../lib/schemas';
import { parseFormData } from '../../lib/validateForm';
import { Avatar } from '../common/Avatar';
import { OtpConfirmModal } from '../common/OtpConfirmModal';
import { Skeleton } from '../common/Skeleton';
import { Spinner } from '../common/Spinner';
import type { UserProfileResponse, UpdateProfileRequest, UploadPhotoResponse } from '../../types/profile';
import type { AccountStatus, UserRole } from '../../types/entities';

const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const ROLE_LABEL: Record<UserRole, string> = {
  developer: 'Tim Pengembang',
  administrator: 'Administrator',
  teacher: 'Guru',
  parent: 'Orang Tua',
};

const STATUS_BADGE: Record<AccountStatus, { label: string; className: string; icon: React.ReactNode }> = {
  active: { label: 'Aktif', className: 'bg-secondary-50 text-secondary-700', icon: <CircleCheck size={14} aria-hidden="true" /> },
  pending_verification: { label: 'Menunggu Verifikasi', className: 'bg-warning-50 text-warning-700', icon: <Clock size={14} aria-hidden="true" /> },
  suspended: { label: 'Ditangguhkan', className: 'bg-error-50 text-error-700', icon: <CircleX size={14} aria-hidden="true" /> },
};

interface FieldErrors {
  fullName?: string;
  email?: string;
  phone?: string;
}

export function ProfileInfoCard() {
  const { toast } = useToast();
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiClient
      .get<UserProfileResponse>('/users/me')
      .then((res) => {
        setProfile(res.data);
        setFullName(res.data.fullName);
        setEmail(res.data.email);
        setPhone(res.data.phone ?? '');
      })
      .catch((err) => setLoadError(getApiErrorMessage(err, 'Gagal memuat profil.')))
      .finally(() => setIsLoading(false));
  }, []);

  async function handlePhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !profile) return;

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      toast.error('Format foto harus JPEG, PNG, atau WebP.');
      return;
    }
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      toast.error('Ukuran foto maksimum 2 MB.');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const { data } = await apiClient.post<UploadPhotoResponse>('/users/me/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile((prev) => (prev ? { ...prev, photoUrl: data.photoUrl } : prev));
      updateUser({ photoUrl: data.photoUrl });
      toast.success('Foto profil berhasil diperbarui.');
    } catch (err) {
      const code = getApiErrorCode(err);
      if (code === 'INVALID_FILE_TYPE') {
        toast.error('Format foto tidak didukung.');
      } else if (code === 'FILE_TOO_LARGE') {
        toast.error('Ukuran foto melebihi batas 2 MB.');
      } else {
        toast.error(getApiErrorMessage(err, 'Gagal mengunggah foto.'));
      }
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  async function handleRemovePhoto() {
    if (!profile?.photoUrl) return;
    setIsUploadingPhoto(true);
    try {
      await apiClient.delete('/users/me/photo');
      setProfile((prev) => (prev ? { ...prev, photoUrl: null } : prev));
      updateUser({ photoUrl: null });
      toast.success('Foto profil dihapus.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Gagal menghapus foto.'));
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  const isDirty = profile
    ? fullName.trim() !== profile.fullName || email.trim() !== profile.email || phone.trim() !== (profile.phone ?? '')
    : false;

  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [pendingNewEmail, setPendingNewEmail] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const parsed = parseFormData(profileSchema, { fullName, email, phone });
    if (!parsed.success) {
      setFieldErrors(parsed.errors);
      return;
    }
    const cleanedName = parsed.data.fullName;
    setFieldErrors({});
    setIsSaving(true);

    try {
      const normalizedName = toTitleCase(cleanedName);
      const payload: UpdateProfileRequest = { fullName: normalizedName, phone: phone.trim() || null };
      const { data } = await apiClient.patch<UserProfileResponse>('/users/me', payload);
      setProfile((prev) => (prev ? { ...data, email: prev.email } : data));
      setFullName(normalizedName);
      updateUser({ fullName: normalizedName });

      const newEmail = email.trim().toLowerCase();
      if (profile && newEmail !== profile.email) {
        await apiClient.post('/users/me/email/change-request', { newEmail });
        setPendingNewEmail(newEmail);
        setIsOtpOpen(true);
      } else {
        toast.success('Profil berhasil disimpan.');
      }
    } catch (err) {
      const code = getApiErrorCode(err);
      if (code === 'EMAIL_ALREADY_EXISTS') {
        setFieldErrors({ email: 'Email ini sudah digunakan akun lain.' });
      } else if (code === 'VALIDATION_ERROR') {
        const details = getApiErrorDetails(err);
        const mapped: FieldErrors = {};
        for (const d of details) {
          (mapped as Record<string, string>)[d.field ?? 'form'] = d.message;
        }
        setFieldErrors(mapped);
      } else {
        toast.error(getApiErrorMessage(err, 'Gagal menyimpan profil.'));
      }
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <Skeleton className="h-64 rounded-xl" />;
  }

  if (!profile) {
    return (
      <div role="alert" className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
        {loadError ?? 'Profil tidak tersedia.'}
      </div>
    );
  }

  const badge = STATUS_BADGE[profile.accountStatus];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="pr-10 text-theme-sm font-semibold text-gray-800 dark:text-white/90">Informasi Profil</h3>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-theme-xs font-medium ${badge.className}`}>
          {badge.icon}
          {badge.label}
        </span>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative">
          <Avatar fullName={profile.fullName} photoUrl={profile.photoUrl} size="lg" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingPhoto}
            aria-label="Ubah foto profil"
            className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border-2 border-white bg-brand-500 text-white transition-colors hover:bg-brand-600 disabled:opacity-60 dark:border-gray-900"
          >
            <Camera size={13} aria-hidden="true" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoSelected}
            className="hidden"
          />
        </div>
        <div>
          <p className="text-[13.5px] font-medium text-gray-900 dark:text-white/90">
            {isUploadingPhoto ? 'Memproses...' : 'Foto Profil'}
          </p>
          <p className="text-theme-xs text-gray-400">JPEG/PNG/WebP, maks. 2 MB.</p>
          {profile.photoUrl && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              disabled={isUploadingPhoto}
              className="mt-1 flex items-center gap-1 text-theme-xs font-medium text-error-600 hover:underline disabled:opacity-60"
            >
              <Trash2 size={12} aria-hidden="true" />
              Hapus foto
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="fullName" className="mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90">
              Nama Lengkap<span aria-hidden="true" className="text-error-500"> *</span>
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`h-11 w-full rounded-md border bg-white px-3.5 text-[14px] text-gray-900 outline-none transition-shadow focus:ring-2 dark:bg-gray-900 dark:text-white/90 ${
                fieldErrors.fullName ? 'border-error-300 focus:border-error-500 focus:ring-error-500/20' : 'border-gray-300 focus:border-brand-500 focus:ring-brand-500/20 dark:border-gray-700'
              }`}
            />
            {fieldErrors.fullName && <p className="mt-1.5 text-[12.5px] text-error-600">{fieldErrors.fullName}</p>}
          </div>

          <div>
            <label htmlFor="phone" className="mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90">
              Nomor Telepon
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08123456789"
              className="h-11 w-full rounded-md border border-gray-300 bg-white px-3.5 text-[14px] text-gray-900 outline-none transition-shadow focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
            {fieldErrors.phone && <p className="mt-1.5 text-[12.5px] text-error-600">{fieldErrors.phone}</p>}
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90">
              Email<span aria-hidden="true" className="text-error-500"> *</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="h-11 w-full rounded-md border border-gray-300 bg-white px-3.5 text-[14px] text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
            {fieldErrors.email && <p className="mt-1.5 text-[12.5px] text-error-600">{fieldErrors.email}</p>}
          </div>

          <div>
            <span className="mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90">Peran</span>
            <p className="flex h-11 items-center text-[14px] text-gray-500 dark:text-gray-400">{ROLE_LABEL[profile.role]}</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-5 dark:border-gray-800">
          <p className="text-theme-xs text-gray-400">
            {profile.createdAt && !Number.isNaN(new Date(profile.createdAt).getTime())
              ? `Bergabung sejak ${new Date(profile.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
              : ''}
          </p>
          <button
            type="submit"
            disabled={!isDirty || isSaving}
            className="flex h-10 items-center justify-center rounded-md bg-brand-500 px-5 text-[14px] font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Menyimpan...
              </>
            ) : (
              'Simpan Perubahan'
            )}
          </button>
        </div>
      </form>

      <OtpConfirmModal
        isOpen={isOtpOpen}
        onClose={() => { setIsOtpOpen(false); setPendingNewEmail(null); if (profile) setEmail(profile.email); }}
        email={profile?.email ?? ''}
        confirmEndpoint="/users/me/email/confirm"
        resendEndpoint="/users/me/email/change-request"
        resendBody={{ newEmail: pendingNewEmail }}
        title="Verifikasi Perubahan Email"
        description={`Demi keamanan, kami mengirim kode 6 digit ke email lama Anda (${profile?.email}). Masukkan kode itu untuk mengganti email menjadi ${pendingNewEmail ?? ''}.`}
        onConfirmed={(message) => {
          setIsOtpOpen(false);
          if (pendingNewEmail) {
            setProfile((prev) => (prev ? { ...prev, email: pendingNewEmail } : prev));
            setEmail(pendingNewEmail);
            updateUser({ email: pendingNewEmail });
          }
          setPendingNewEmail(null);
          toast.success(message);
        }}
      />
    </div>
  );
}