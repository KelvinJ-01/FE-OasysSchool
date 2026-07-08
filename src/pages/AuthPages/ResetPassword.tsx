import PageMeta from "../../components/common/PageMeta";
import AuthPageLayout from "./AuthPageLayout";
import ResetPasswordForm from "../../components/auth/ResetPasswordForm";

export default function ResetPassword() {
  return (
    <>
      <PageMeta
        title="Lupa Kata Sandi | Dashboard Oasys School"
        description="Kirim kode verifikasi untuk mengatur ulang kata sandi"
      />
      <AuthPageLayout>
        <ResetPasswordForm />
      </AuthPageLayout>
    </>
  );
}