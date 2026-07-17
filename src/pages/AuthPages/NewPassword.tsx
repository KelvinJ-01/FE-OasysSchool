import PageMeta from "../../components/common/PageMeta";
import AuthPageLayout from "./AuthPageLayout";
import NewPasswordForm from "../../components/auth/NewPasswordForm";

export default function NewPassword() {
  return (
    <>
      <PageMeta
        title="Kata Sandi Baru | Dashboard Oasys School"
        description="Buat kata sandi baru untuk akun Anda"
      />

      <AuthPageLayout>
        <NewPasswordForm />
      </AuthPageLayout>

    </>

  );
}
