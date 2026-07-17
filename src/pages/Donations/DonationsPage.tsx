import { useEffect, useState } from 'react';
import { HandCoins, Server, Sparkles, ShieldCheck, LifeBuoy, GraduationCap, Info } from 'lucide-react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadCrumb from '../../components/common/PageBreadCrumb';
import { CopyField } from '../../components/common/CopyField';
import { Skeleton } from '../../components/common/Skeleton';
import { apiClient, getApiErrorMessage } from '../../lib/apiClient';
import type { DonationsResponse } from '../../types/donation';

const WHY_POINTS = [
  'Manajemen akademik yang lebih efisien',
  'Sistem komunikasi guru & wali murid',
  'Dashboard monitoring pembelajaran',
  'Integrasi absensi dan penilaian',
  'Pengembangan AI Assistant untuk guru',
  'Optimalisasi performa dan keamanan sistem',
];

const IMPACT_CARDS = [
  { icon: Server, title: 'Infrastruktur Server', desc: 'Menjaga sistem tetap stabil, cepat, dan aman untuk digunakan sekolah.' },
  { icon: Sparkles, title: 'Pengembangan Fitur Baru', desc: 'Membangun fitur yang benar-benar dibutuhkan guru dan sekolah.' },
  { icon: ShieldCheck, title: 'Keamanan Data', desc: 'Meningkatkan perlindungan data akademik dan informasi pengguna.' },
  { icon: LifeBuoy, title: 'Dukungan Pengguna', desc: 'Memberikan layanan bantuan dan pengembangan dokumentasi penggunaan.' },
];

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}

export default function DonationsPage() {
  const [totalAmount, setTotalAmount] = useState<number | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [progressError, setProgressError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<DonationsResponse>('/donations', { params: { pageSize: 1 } })
      .then((res) => setTotalAmount(res.data.aggregate.totalAmount))
      .catch((err) => setProgressError(getApiErrorMessage(err, 'Gagal memuat progres donasi.')))
      .finally(() => setIsLoadingProgress(false));
  }, []);

  return (
    <>
      <PageMeta title="Donasi | Oasys School" description="Dukung pengembangan platform Oasys School" />

      <PageBreadCrumb pageTitle="Donasi" />

      <div className="mb-10 rounded-xl bg-brand-950 px-6 py-12 text-center sm:px-10">
        <h1 className="font-display mx-auto max-w-xl text-[26px] leading-[1.25] text-white sm:text-[32px]">
          Bersama Guru Indonesia, Bangun Masa Depan Pendidikan Digital
        </h1>

        <p className="mx-auto mt-4 max-w-lg text-[14px] leading-relaxed text-white/60">
          Dukung pengembangan fitur-fitur baru Oasys School agar kegiatan belajar, administrasi, dan komunikasi
          sekolah menjadi lebih mudah, modern, dan efisien untuk seluruh guru di Indonesia.
        </p>

      </div>

      <div className="mb-10">
        <h2 className="text-[19px] font-semibold text-gray-900 dark:text-white/90">
          Mengapa Oasys School Membuka Program Donasi?
        </h2>

        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-gray-600 dark:text-gray-400">
          Kami percaya teknologi pendidikan yang baik harus terus berkembang mengikuti kebutuhan sekolah dan guru.
          Melalui program donasi ini, guru dan institusi pendidikan dapat ikut berkontribusi dalam pengembangan
          fitur-fitur baru Oasys School, seperti:
        </p>

        <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
          {WHY_POINTS.map((point) => (
            <li key={point} className="flex items-start gap-2.5 rounded-lg border border-gray-200 bg-white px-4 py-3 text-[13.5px] text-gray-700 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300">
              <GraduationCap size={17} className="mt-0.5 shrink-0 text-brand-500" aria-hidden="true" />

              {point}
            </li>

          ))}
        </ul>

        <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-gray-600 dark:text-gray-400">
          Setiap kontribusi akan membantu kami menghadirkan platform pendidikan yang lebih baik dan mudah digunakan.
        </p>

      </div>

      <div className="mb-10">
        <h2 className="text-[19px] font-semibold text-gray-900 dark:text-white/90">Kontribusi Anda Akan Digunakan Untuk</h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {IMPACT_CARDS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <span className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
                <Icon size={18} aria-hidden="true" />

              </span>

              <h3 className="mt-3.5 text-[14px] font-semibold text-gray-900 dark:text-white/90">{title}</h3>

              <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">{desc}</p>

            </div>

          ))}
        </div>

      </div>

      <div className="mb-10 rounded-xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-[19px] font-semibold text-gray-900 dark:text-white/90">Progress Pengembangan Saat Ini</h2>

        {isLoadingProgress && (
          <Skeleton className="mx-auto mt-4 h-9 w-48 rounded-md" />

        )}

        {!isLoadingProgress && progressError && (
          <p className="mt-3 text-[13.5px] text-error-600">{progressError}</p>

        )}

        {!isLoadingProgress && !progressError && totalAmount !== null && (
          <>
            <p className="mt-3 text-title-sm font-semibold text-gray-800 dark:text-white/90">
              {formatRupiah(totalAmount)}
            </p>

            <p className="mt-1 text-[13px] text-gray-500 dark:text-gray-400">total donasi tercatat sejauh ini</p>

          </>

        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-lg bg-secondary-50 text-secondary-600 dark:bg-secondary-500/10 dark:text-secondary-400">
            <HandCoins size={20} aria-hidden="true" />

          </span>

          <div>
            <h2 className="text-[16px] font-semibold text-gray-900 dark:text-white/90">Cara Berkontribusi</h2>

            <p className="text-[13px] text-gray-500 dark:text-gray-400">Transfer ke rekening atau e-wallet berikut.</p>

          </div>

        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <CopyField label="Nomor Rekening" value="90022284966" />

          <CopyField label="Cashtag Jenius" value="$oasysid" />

        </div>

        <p className="mt-4 text-[13px] text-gray-500 dark:text-gray-400">
          Atas nama <span className="font-medium text-gray-700 dark:text-gray-300">Arian Nurrifqhi</span>.

        </p>

        <div className="mt-4 flex items-start gap-2 rounded-md border border-brand-100 bg-brand-25 px-3.5 py-3 text-[12.5px] leading-relaxed text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300">
          <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />

          <p>
            Rekening resmi atas nama PT masih dalam proses pembuatan. Untuk sementara, donasi diterima lewat
            rekening/e-wallet pribadi di atas — kami perbarui halaman ini begitu rekening PT sudah aktif.
          </p>

        </div>

      </div>

    </>

  );
}
