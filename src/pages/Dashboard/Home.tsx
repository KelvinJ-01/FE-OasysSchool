import PageMeta from "../../components/common/PageMeta";
import StatSummaryCards from "../../components/dashboard/StatSummaryCards";
import WelcomeBanner from "../../components/dashboard/WelcomeBanner";
import StudentDemographicsCard from "../../components/dashboard/StudentDemographicsCard";
import TeacherAttendanceCard from "../../components/dashboard/TeacherAttendanceCard";
import NoticeBoardCard from "../../components/dashboard/NoticeBoardCard";
import MiniCalendarCard from "../../components/dashboard/MiniCalendarCard";
import TeacherTableCard from "../../components/dashboard/TeacherTableCard";

export default function Home() {
  return (
    <>
      <PageMeta
        title="Dashboard | Oasys School"
        description="Ringkasan operasional sekolah untuk admin dan staf Oasys School"
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Kolom utama */}
        <div className="flex flex-col gap-5 xl:col-span-8">
          <StatSummaryCards />

          <WelcomeBanner />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <StudentDemographicsCard />
            <TeacherAttendanceCard />
          </div>

          <TeacherTableCard />
        </div>

        {/* Kolom samping */}
        <div className="flex flex-col gap-5 xl:col-span-4">
          <NoticeBoardCard />
          <MiniCalendarCard />
        </div>
      </div>
    </>
  );
}