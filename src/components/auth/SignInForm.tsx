import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import {
  ArrowRightIcon,
  EnvelopeIcon,
  EyeCloseIcon,
  EyeIcon,
  LockIcon,
} from "../../icons";

interface SignInFormValues {
  email: string;
  password: string;
  remember: boolean;
}

interface SignInFormErrors {
  email?: string;
  password?: string;
}

export default function SignInForm() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [values, setValues] = useState<SignInFormValues>({
    email: "",
    password: "",
    remember: false,
  });
  const [errors, setErrors] = useState<SignInFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const validate = (): boolean => {
    const nextErrors: SignInFormErrors = {};

    if (!values.email.trim()) {
      nextErrors.email = "Email wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      nextErrors.email = "Format email tidak valid.";
    }

    if (!values.password) {
      nextErrors.password = "Kata sandi wajib diisi.";
    } else if (values.password.length < 8) {
      nextErrors.password = "Kata sandi minimal 8 karakter.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!validate()) return;

    try {
      setIsSubmitting(true);
      // TODO: ganti dengan pemanggilan endpoint autentikasi sesungguhnya
      await new Promise((resolve) => setTimeout(resolve, 800));
      navigate("/");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Gagal masuk. Periksa kembali email dan kata sandi Anda.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[400px] py-10">
      <div className="mb-8 flex flex-col items-center text-center">
        <img
          src="/images/logo/Oasys_School_Logo_1.webp"
          alt="Oasys School"
          className="mb-6 h-24 w-auto"
        />
        <h1 className="mb-1.5 text-title-sm font-semibold text-gray-800 dark:text-white/90">
          Masuk ke akun Anda
        </h1>
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
          Khusus untuk guru dan staf Oasys School
        </p>
      </div>

      {formError && (
        <div
          role="alert"
          className="mb-5 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-theme-sm text-error-700 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400"
        >
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-5">
          <div>
            <Label htmlFor="email">
              Email <span className="text-error-500">*</span>
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-gray-400">
                <EnvelopeIcon className="size-5" />
              </span>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="nama@oasysschool.sch.id"
                value={values.email}
                error={Boolean(errors.email)}
                hint={errors.email}
                className="pl-11"
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password">
              Kata Sandi <span className="text-error-500">*</span>
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-gray-400">
                <LockIcon className="size-5" />
              </span>
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan kata sandi"
                value={values.password}
                error={Boolean(errors.password)}
                hint={errors.password}
                className="pr-11 pl-11"
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={
                  showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
                }
                className="absolute top-1/2 right-3.5 z-10 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? (
                  <EyeIcon className="size-5" />
                ) : (
                  <EyeCloseIcon className="size-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Checkbox
              id="remember"
              label="Ingat saya"
              checked={values.remember}
              onChange={(checked) =>
                setValues((prev) => ({ ...prev, remember: checked }))
              }
            />
            <Link
              to="/reset-password"
              className="text-theme-sm font-medium text-brand-500 hover:text-brand-600"
            >
              Lupa kata sandi?
            </Link>
          </div>

          <div>
            <Button
              className="w-full justify-center"
              size="sm"
              disabled={isSubmitting}
              endIcon={!isSubmitting && <ArrowRightIcon className="size-4" />}
            >
              {isSubmitting ? "Memproses..." : "Masuk"}
            </Button>
          </div>
        </div>
      </form>

      <p className="mt-6 text-center text-theme-sm text-gray-500 dark:text-gray-400">
        Kendala masuk ke akun?{" "}
        <a
          href="mailto:admin@oasysschool.sch.id"
          className="font-medium text-brand-500 hover:text-brand-600"
        >
          Hubungi admin sekolah
        </a>
      </p>
    </div>
  );
}