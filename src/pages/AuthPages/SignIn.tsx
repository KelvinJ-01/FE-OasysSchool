import PageMeta from "../../components/common/PageMeta";
import AuthPageLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Masuk | Dashboard Oasys School"
        description="Halaman masuk untuk guru dan staf Oasys School"
      />
      <AuthPageLayout>
        <SignInForm />
      </AuthPageLayout>
    </>
  );
}