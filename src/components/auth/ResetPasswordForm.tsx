import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { ArrowRightIcon, EnvelopeIcon } from "../../icons";

export default function ResetPasswordForm() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    if (!email.trim()) {
      setError("Email wajib diisi.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Format email tidak valid.");
      return false;
    }
    setError(undefined);
    return true;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!validate()) return;

    try {
      setIsSubmitting(true);
      // TODO: ganti dengan pemanggilan endpoint pengiriman kode reset
      await new Promise((resolve) => setTimeout(resolve, 800));
      navigate("/verify-code", { state: { email } });
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Gagal mengirim kode. Silakan coba lagi.",
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
          Lupa kata sandi?
        </h1>
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
          Masukkan email akun Anda, kami akan mengirimkan kode verifikasi
          6 digit.
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
                value={email}
                error={Boolean(error)}
                hint={error}
                className="pl-11"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Button
              className="w-full justify-center"
              size="sm"
              disabled={isSubmitting}
              endIcon={!isSubmitting && <ArrowRightIcon className="size-4" />}
            >
              {isSubmitting ? "Mengirim..." : "Kirim Kode Verifikasi"}
            </Button>
          </div>
        </div>
      </form>

      <p className="mt-6 text-center text-theme-sm text-gray-500 dark:text-gray-400">
        Ingat kata sandi Anda?{" "}
        <Link
          to="/signin"
          className="font-medium text-brand-500 hover:text-brand-600"
        >
          Kembali masuk
        </Link>
      </p>
    </div>
  );
}