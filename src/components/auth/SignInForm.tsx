import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Eye, EyeOff } from 'lucide-react';

export function SignInForm() {
  const { login } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const successMessage = (location.state as { message?: string } | null)?.message;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (successMessage) toast.success(successMessage);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal masuk. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="font-jakarta">
      <h1 className="text-[22px] font-semibold text-gray-900">Masuk ke dasbor</h1>
      <p className="mt-1.5 text-[14px] text-gray-500">Untuk Guru dan Administrator sekolah.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-[13.5px] font-medium text-gray-900">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@sekolah.sch.id"
            className="h-11 w-full rounded-md border border-gray-300 bg-white px-3.5 text-[14px] text-gray-900 outline-none transition-shadow focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="block text-[13.5px] font-medium text-gray-900">
              Kata sandi
            </label>
            <Link to="/reset-password" className="text-[13px] font-medium text-brand-500 hover:underline">
              Lupa kata sandi?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi"
              className="h-11 w-full rounded-md border border-gray-300 bg-white px-3.5 pr-11 text-[14px] text-gray-900 outline-none transition-shadow focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-500"
            >
              {showPassword ? <Eye className="size-[18px]" /> : <EyeOff className="size-[18px]" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-11 w-full items-center justify-center rounded-md bg-brand-500 text-[14px] font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          {isSubmitting ? 'Memproses...' : 'Masuk'}
        </button>
      </form>

      <p className="mt-8 text-[13px] leading-relaxed text-gray-500">
        Orang tua dan wali murid, gunakan{' '}
        <span className="font-medium text-gray-900">Aplikasi Mobile Oasys School</span> untuk memantau presensi
        anak.
      </p>
    </div>
  );
}