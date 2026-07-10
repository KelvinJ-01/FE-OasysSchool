import { Link } from 'react-router-dom';
import PageMeta from '../components/common/PageMeta';
import { User, Users } from 'lucide-react';

const WIDE_INDEXES = new Set([2, 9, 18, 25, 34, 41]);
const CELL_COUNT = 60;

function delayFor(index: number): string {
  const col = index % 15;
  const row = Math.floor(index / 15);
  const sweep = (col * 0.14 + row * 0.4) % 4.2;
  return `${sweep.toFixed(2)}s`;
}

export default function Welcome() {
  return (
    <>
      <PageMeta title="Oasys School" description="Platform presensi dan administrasi sekolah terintegrasi" />

      <div className="relative min-h-screen overflow-hidden bg-brand-950 font-jakarta">
        <div className="rc-grid absolute inset-0 opacity-[0.14]" style={{ gridTemplateColumns: 'repeat(15, 1fr)' }} aria-hidden="true">
          {Array.from({ length: CELL_COUNT }).map((_, i) => (
            <div
              key={i}
              className={`rc-cell ${WIDE_INDEXES.has(i) ? 'rc-wide' : ''}`}
              style={{ ['--rc-delay' as string]: delayFor(i) }}
            />
          ))}
        </div>

        <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16 sm:px-10">
          <img src="/images/logo/Oasys_School_Logo_3.webp" alt="" className="h-12 w-12" aria-hidden="true" />

          <h1 className="font-display mt-6 max-w-lg text-center text-[36px] leading-[1.15] text-white sm:text-[44px]">
            Selamat datang di Oasys School
          </h1>
          <p className="mt-4 max-w-md text-center text-[15px] leading-relaxed text-white/60">
            Presensi digital berbasis QR dan komunikasi sekolah-rumah, dalam satu platform.
          </p>

          <div className="mt-12 grid w-full max-w-2xl gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
              <User className="size-8 text-secondary-400" />
              <h2 className="mt-4 text-[17px] font-medium text-white">Staf sekolah</h2>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/55">
                Untuk Guru dan Administrator yang sudah memiliki akun dari sekolah.
              </p>
              <Link
                to="/signin"
                className="mt-5 flex h-11 items-center justify-center rounded-md bg-brand-500 text-[14px] font-medium text-white transition-colors hover:bg-brand-600"
              >
                Masuk ke dasbor
              </Link>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
              <Users className="size-8 text-secondary-400" />
              <h2 className="mt-4 text-[17px] font-medium text-white">Orang tua & wali murid</h2>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/55">
                Daftar untuk memantau presensi dan info akademik anak Anda.
              </p>
              <Link
                to="/signup"
                className="mt-5 flex h-11 items-center justify-center rounded-md border border-white/20 text-[14px] font-medium text-white transition-colors hover:bg-white/10"
              >
                Daftar sekarang
              </Link>
            </div>
          </div>

          <p className="mt-8 max-w-md text-center text-[12.5px] leading-relaxed text-white/40">
            Sudah terdaftar sebagai orang tua? Gunakan Aplikasi Mobile Oasys School untuk penggunaan sehari-hari.
          </p>
        </div>
      </div>
    </>
  );
}