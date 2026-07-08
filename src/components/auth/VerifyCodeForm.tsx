import { useRef, useState, FormEvent, KeyboardEvent, ClipboardEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import Button from "../ui/button/Button";
import { ArrowRightIcon } from "../../icons";

const CODE_LENGTH = 6;

export default function VerifyCodeForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email;

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const code = digits.join("");

  const setDigitAt = (index: number, value: string) => {
    setDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleChange = (index: number, value: string) => {
    const sanitized = value.replace(/[^0-9]/g, "").slice(-1);
    setDigitAt(index, sanitized);

    if (sanitized && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/[^0-9]/g, "")
      .slice(0, CODE_LENGTH);

    if (!pasted) return;

    const next = Array(CODE_LENGTH).fill("");
    pasted.split("").forEach((char, i) => {
      next[i] = char;
    });
    setDigits(next);
    inputsRef.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (code.length !== CODE_LENGTH) {
      setError("Masukkan seluruh 6 digit kode verifikasi.");
      return;
    }

    try {
      setIsSubmitting(true);
      // TODO: ganti dengan pemanggilan endpoint verifikasi kode sesungguhnya
      await new Promise((resolve) => setTimeout(resolve, 800));
      navigate("/new-password", { state: { email, code } });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Kode tidak valid. Silakan coba lagi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setIsResending(true);
    // TODO: ganti dengan pemanggilan endpoint kirim ulang kode
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsResending(false);
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
          Verifikasi kode
        </h1>
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
          Masukkan 6 digit kode yang kami kirim ke{" "}
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {email ?? "email Anda"}
          </span>
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-theme-sm text-error-700 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div
          className="mb-6 flex justify-center gap-2.5 sm:gap-3"
          onPaste={handlePaste}
        >
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputsRef.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              aria-label={`Digit ke-${index + 1}`}
              className="h-12 w-12 rounded-lg border border-gray-300 bg-transparent text-center text-lg font-semibold text-gray-800 shadow-theme-xs focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden sm:h-14 sm:w-14 dark:border-gray-700 dark:text-white/90"
            />
          ))}
        </div>

        <Button
          className="w-full justify-center"
          size="sm"
          disabled={isSubmitting}
          endIcon={!isSubmitting && <ArrowRightIcon className="size-4" />}
        >
          {isSubmitting ? "Memverifikasi..." : "Verifikasi Kode"}
        </Button>
      </form>

      <p className="mt-6 text-center text-theme-sm text-gray-500 dark:text-gray-400">
        Tidak menerima kode?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className="font-medium text-brand-500 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isResending ? "Mengirim ulang..." : "Kirim ulang kode"}
        </button>
      </p>

      <p className="mt-2 text-center text-theme-sm text-gray-500 dark:text-gray-400">
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