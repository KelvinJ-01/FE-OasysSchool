import PageMeta from '../../components/common/PageMeta';
import AuthPageLayout from './AuthPageLayout';
import { SignUpForm } from '../../components/auth/SignUpForm';

export default function SignUp() {
  return (
    <>
      <PageMeta title="Daftar Orang Tua | Oasys School" description="Registrasi akun Orang Tua Oasys School" />

      <AuthPageLayout>
        <SignUpForm />
      </AuthPageLayout>

    </>

  );
}
