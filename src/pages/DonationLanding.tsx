import { Link } from 'react-router-dom';
import { ArrowLeft, Heart } from 'lucide-react';
import PageMeta from '../components/common/PageMeta';
import { CopyField } from '../components/common/CopyField';

export default function DonationLanding() {
  return (
    <>
      <PageMeta
        title="Dukung Oasys School | Oasys School"
        description="Oasys School dikembangkan bertahap oleh tim kecil — dukungan Anda membantu kami terus jalan"
      />

      <div className="min-h-screen bg-white font-jakarta">
        <header className="flex items-center justify-between px-6 py-6 sm:px-10">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/images/logo/Oasys_School_Logo_3.webp" alt="" className="h-7 w-7" aria-hidden="true" />
            <span className="text-[14px] font-medium text-gray-900">Oasys School</span>
          </Link>
          <Link to="/" className="flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-800">
            <ArrowLeft size={14} aria-hidden="true" />
            Beranda
          </Link>
        </header>

        <main className="mx-auto max-w-xl px-6 pb-24 pt-8 sm:px-10">
          <span className="text-[12.5px] font-semibold uppercase tracking-wide text-secondary-600">
            Dukung Oasys School
          </span>

          <h1 className="font-display mt-3 text-[28px] leading-[1.3] text-gray-900 sm:text-[32px]">
            Kami bikin ini bertahap, bukan karena punya dana besar — tapi karena percaya sekolah butuh alat yang
            sederhana dan benar-benar terpakai.
          </h1>

          <div className="mt-8 space-y-4 text-[15px] leading-relaxed text-gray-600">
            <p>
              Oasys School bukan produk dari perusahaan besar. Ini dikerjakan langsung, fitur demi fitur, sambil
              dengar masukan dari guru dan staf sekolah yang benar-benar memakainya sehari-hari.
            </p>
            <p>
              Server, waktu pengembangan, dan perbaikan bug kecil yang bikin repot — semuanya butuh biaya dan waktu.
              Kalau Oasys School pernah membantu pekerjaan Anda sedikit lebih ringan, dan Anda ingin ikut menjaga
              proyek ini tetap jalan, kontribusi apa pun sangat berarti.
            </p>
            <p>Tidak ada target atau tekanan — ini murni terbuka bagi yang ingin bantu.</p>
          </div>

          <div className="mt-10 rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2.5">
              <Heart size={18} className="text-secondary-500" aria-hidden="true" />
              <h2 className="text-[15px] font-semibold text-gray-900">Cara berkontribusi</h2>
            </div>

            <div className="mt-5 space-y-3">
              <CopyField label="Nomor Rekening" value="90022284966" />
              <CopyField label="Cashtag Jenius" value="$oasysid" />
            </div>

            <p className="mt-4 text-[13px] text-gray-500">
              Atas nama <span className="font-medium text-gray-700">Arian Nurrifqhi</span>. Terima kasih sudah baca
              sampai sini — sungguh.
            </p>
          </div>

          <p className="mt-10 text-[14px] text-gray-400">— Oasys School Development Team</p>
        </main>
      </div>
    </>
  );
}