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
  UserIcon,
} from "../../icons";

interface SignUpFormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agree: boolean;
}

interface SignUpFormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  agree?: string;
}

export default function SignUpForm() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [values, setValues] = useState<SignUpFormValues>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });
  const [errors, setErrors] = useState<SignUpFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const validate = (): boolean => {
    const nextErrors: SignUpFormErrors = {};

    if (!values.firstName.trim()) {
      nextErrors.firstName = "Nama depan wajib diisi.";
    }

    if (!values.lastName.trim()) {
      nextErrors.lastName = "Nama belakang wajib diisi.";
    }

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

    if (values.confirmPassword !== values.password) {
      nextErrors.confirmPassword = "Konfirmasi kata sandi tidak cocok.";
    }

    if (!values.agree) {
      nextErrors.agree = "Anda harus menyetujui syarat & ketentuan.";
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
      // TODO: ganti dengan pemanggilan endpoint pendaftaran sesungguhnya
      await new Promise((resolve) => setTimeout(resolve, 800));
      navigate("/signin");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Gagal mendaftar. Silakan coba lagi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] py-10">
      <div className="mb-8 flex flex-col items-center text-center">
        <img
          src="/images/logo/Oasys_School_Logo_1.webp"
          alt="Oasys School"
          className="mb-6 h-24 w-auto"
        />
        <h1 className="mb-1.5 text-title-sm font-semibold text-gray-800 dark:text-white/90">
          Buat akun baru
        </h1>
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
          Pendaftaran akun untuk guru dan staf Oasys School
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="firstName">
                Nama Depan <span className="text-error-500">*</span>
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-gray-400">
                  <UserIcon className="size-5" />
                </span>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="Contoh: Siti"
                  value={values.firstName}
                  error={Boolean(errors.firstName)}
                  hint={errors.firstName}
                  className="pl-11"
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="lastName">
                Nama Belakang <span className="text-error-500">*</span>
              </Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Contoh: Rahayu"
                value={values.lastName}
                error={Boolean(errors.lastName)}
                hint={errors.lastName}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    lastName: e.target.value,
                  }))
                }
              />
            </div>
          </div>

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
                placeholder="Minimal 8 karakter"
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

          <div>
            <Label htmlFor="confirmPassword">
              Konfirmasi Kata Sandi <span className="text-error-500">*</span>
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-gray-400">
                <LockIcon className="size-5" />
              </span>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Ulangi kata sandi"
                value={values.confirmPassword}
                error={Boolean(errors.confirmPassword)}
                hint={errors.confirmPassword}
                className="pr-11 pl-11"
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={
                  showConfirmPassword
                    ? "Sembunyikan kata sandi"
                    : "Tampilkan kata sandi"
                }
                className="absolute top-1/2 right-3.5 z-10 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showConfirmPassword ? (
                  <EyeIcon className="size-5" />
                ) : (
                  <EyeCloseIcon className="size-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <Checkbox
              id="agree"
              label="Saya menyetujui Syarat & Ketentuan serta Kebijakan Privasi Oasys School"
              checked={values.agree}
              onChange={(checked) =>
                setValues((prev) => ({ ...prev, agree: checked }))
              }
            />
            {errors.agree && (
              <p className="mt-1.5 text-xs text-error-500">{errors.agree}</p>
            )}
          </div>

          <div>
            <Button
              className="w-full justify-center"
              size="sm"
              disabled={isSubmitting}
              endIcon={!isSubmitting && <ArrowRightIcon className="size-4" />}
            >
              {isSubmitting ? "Memproses..." : "Daftar"}
            </Button>
          </div>
        </div>
      </form>

      <p className="mt-6 text-center text-theme-sm text-gray-500 dark:text-gray-400">
        Sudah punya akun?{" "}
        <Link
          to="/signin"
          className="font-medium text-brand-500 hover:text-brand-600"
        >
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}