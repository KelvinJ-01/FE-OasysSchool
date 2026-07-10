import PageMeta from '../../components/common/PageMeta';
import PageBreadCrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import { ReportsExportFilter } from '../../components/reports/ReportsExportFilter';

export default function AttendanceReportsPage() {
  return (
    <>
      <PageMeta title="Laporan Presensi | Oasys School" description="Ekspor rekapitulasi presensi siswa" />
      <PageBreadCrumb pageTitle="Laporan Presensi" />
      <ComponentCard title="Ekspor Laporan Presensi">
        <ReportsExportFilter />
      </ComponentCard>
    </>
  );
}