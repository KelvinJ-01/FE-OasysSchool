import PageMeta from '../../components/common/PageMeta';
import { GreetingBanner } from '../../components/dashboard/GreetingBanner';
import { AttendanceSummaryCards } from '../../components/dashboard/AttendanceSummaryCards';
import { TodaySchedule } from '../../components/dashboard/TodaySchedule';
import { QuickLinks } from '../../components/dashboard/QuickLinks';

export default function Home() {
  return (
    <>
      <PageMeta title="Dasbor | Oasys School" description="Ringkasan presensi hari ini" />

      <div className="space-y-6">
        <GreetingBanner />
        <AttendanceSummaryCards />

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <TodaySchedule />
          <QuickLinks />
        </div>
      </div>
    </>
  );
}
