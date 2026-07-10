import { useEffect, useState } from 'react';

const WIDE_INDEXES = new Set([3, 14, 27, 36]);
const TALL_INDEXES = new Set([7, 22]);
const CELL_COUNT = 40;

function delayFor(index: number): string {
  const col = index % 10;
  const row = Math.floor(index / 10);
  const sweep = (col * 0.18 + row * 0.32) % 3.6;
  return `${sweep.toFixed(2)}s`;
}

export function RollCallPanel() {
  const [presentCount, setPresentCount] = useState(214);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      setPresentCount((prev) => (prev >= 428 ? 214 : prev + Math.ceil(Math.random() * 9)));
    }, 2600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-full flex-col justify-between bg-brand-950 font-jakarta">
      <div className="px-10 pt-10 sm:px-14 sm:pt-14">
        <div className="flex items-center gap-2.5">
          <img src="/images/logo/Oasys_School_Logo_3.webp" alt="" className="h-8 w-8" aria-hidden="true" />
          <span className="text-[15px] font-medium tracking-wide text-white">Oasys School</span>
        </div>
      </div>

      <div className="px-10 sm:px-14">
        <p className="font-display text-[34px] leading-[1.15] text-white sm:text-[40px]">
          Presensi tercatat,
          <br />
          tanpa drama pagi.
        </p>
        <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-white/60">
          Pindai QR, sinkron otomatis walau koneksi sekolah putus-nyambung —
          rekap presensi tetap rapi sampai ke wali murid.
        </p>

        <div className="rc-grid mt-10 max-w-md" aria-hidden="true">
          {Array.from({ length: CELL_COUNT }).map((_, i) => (
            <div
              key={i}
              className={`rc-cell ${WIDE_INDEXES.has(i) ? 'rc-wide' : ''} ${TALL_INDEXES.has(i) ? 'rc-tall' : ''}`}
              style={{ ['--rc-delay' as string]: delayFor(i) }}
            />
          ))}
        </div>
      </div>

      <div className="px-10 pb-10 sm:px-14 sm:pb-14">
        <p className="text-[13px] text-white/50">
          <span className="font-medium text-white">{presentCount}</span> siswa tercatat hadir pagi ini
        </p>
      </div>
    </div>
  );
}