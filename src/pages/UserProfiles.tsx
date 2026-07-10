import PageMeta from '../components/common/PageMeta';
import PageBreadCrumb from '../components/common/PageBreadCrumb';
import { ProfileInfoCard } from '../components/UserProfile/ProfileInfoCard';
import { ChangePasswordCard } from '../components/UserProfile/ChangePasswordCard';

export default function UserProfiles() {
  return (
    <>
      <PageMeta title="Profil Saya | Oasys School" description="Kelola informasi akun dan kata sandi Anda" />
      <PageBreadCrumb pageTitle="Profil Saya" />

      <div className="space-y-6">
        <ProfileInfoCard />
        <ChangePasswordCard />
      </div>
    </>
  );
}