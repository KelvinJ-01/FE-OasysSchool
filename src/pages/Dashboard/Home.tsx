import PageMeta from '../../components/common/PageMeta';
import { GreetingBanner } from '../../components/dashboard/GreetingBanner';
import { AttendanceSummaryCards } from '../../components/dashboard/AttendanceSummaryCards';
import { QuickLinks } from '../../components/dashboard/QuickLinks';

export default function Home() {
  return (
    <>
      <PageMeta title="Dasbor | Oasys School" description="Ringkasan presensi hari ini" />

      <div className="space-y-6">
        <GreetingBanner />
        <AttendanceSummaryCards />

        <div>
          <h2 className="mb-3 text-theme-sm font-medium text-gray-700 dark:text-gray-300">Akses Cepat</h2>
          <QuickLinks />
        </div>
      </div>
    </>
  );
}