import PageMeta from "../../components/common/PageMeta";
import AuthPageLayout from "./AuthPageLayout";
import VerifyCodeForm from "../../components/auth/VerifyCodeForm";

export default function VerifyCode() {
  return (
    <>
      <PageMeta
        title="Verifikasi Kode | Dashboard Oasys School"
        description="Masukkan kode verifikasi 6 digit untuk melanjutkan"
      />

      <AuthPageLayout>
        <VerifyCodeForm />
      </AuthPageLayout>

    </>

  );
}
