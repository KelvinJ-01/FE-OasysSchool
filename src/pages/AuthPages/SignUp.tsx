import PageMeta from "../../components/common/PageMeta";
import AuthPageLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="Daftar | Dashboard Oasys School"
        description="Halaman pendaftaran akun untuk guru dan staf Oasys School"
      />
      <AuthPageLayout>
        <SignUpForm />
      </AuthPageLayout>
    </>
  );
}