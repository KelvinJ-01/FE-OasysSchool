import { useState, FormEvent } from "react";
import { useNavigate } from "react-router";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";
import { useModal } from "../../hooks/useModal";
import { CheckCircleIcon, EyeCloseIcon, EyeIcon, LockIcon } from "../../icons";

interface FormValues {
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  password?: string;
  confirmPassword?: string;
}

export default function NewPasswordForm() {
  const navigate = useNavigate();
  const { isOpen, openModal, closeModal } = useModal();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [values, setValues] = useState<FormValues>({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!values.password) {
      nextErrors.password = "Kata sandi wajib diisi.";
    } else if (values.password.length < 8) {
      nextErrors.password = "Kata sandi minimal 8 karakter.";
    }

    if (values.confirmPassword !== values.password) {
      nextErrors.confirmPassword = "Konfirmasi kata sandi tidak cocok.";
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
      // TODO: ganti dengan pemanggilan endpoint ubah kata sandi sesungguhnya
      await new Promise((resolve) => setTimeout(resolve, 800));
      openModal();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Gagal mengubah kata sandi. Silakan coba lagi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToSignIn = () => {
    closeModal();
    navigate("/signin");
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
          Buat kata sandi baru
        </h1>
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
          Kata sandi baru harus berbeda dari kata sandi yang pernah
          digunakan sebelumnya.
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
            <Label htmlFor="password">
              Kata Sandi Baru <span className="text-error-500">*</span>
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
                  setValues((prev) => ({ ...prev, password: e.target.value }))
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
                placeholder="Ulangi kata sandi baru"
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
            <Button className="w-full justify-center" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Kata Sandi"}
            </Button>
          </div>
        </div>
      </form>

      <Modal isOpen={isOpen} onClose={closeModal} className="m-4 max-w-[420px]">
        <div className="flex flex-col items-center px-2 py-6 text-center">
          <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400">
            <CheckCircleIcon className="size-9" />
          </div>
          <h4 className="mb-2 text-title-sm font-semibold text-gray-800 dark:text-white/90">
            Kata sandi berhasil diubah
          </h4>
          <p className="mb-6 text-theme-sm text-gray-500 dark:text-gray-400">
            Kata sandi akun Anda telah berhasil diperbarui. Silakan masuk
            kembali menggunakan kata sandi baru Anda.
          </p>
          <Button className="w-full justify-center" size="sm" onClick={handleGoToSignIn}>
            Masuk Sekarang
          </Button>
        </div>
      </Modal>
    </div>
  );
}