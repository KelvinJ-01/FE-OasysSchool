import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, ShieldCheck, FileText } from 'lucide-react';
import PageMeta from '../components/common/PageMeta';
import { apiClient, getApiErrorMessage } from '../lib/apiClient';
import { Skeleton } from '../components/common/Skeleton';
import type { PrivacyPolicyResponse } from '../types/auth';

export default function PrivacyPolicy() {
  const [policy, setPolicy] = useState<PrivacyPolicyResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<PrivacyPolicyResponse>('/legal/privacy-policy')
      .then((res) => setPolicy(res.data))
      .catch((err) => setErrorMessage(getApiErrorMessage(err, 'Gagal memuat kebijakan privasi.')))
      .finally(() => setIsLoading(false));
  }, []);

  const effectiveDate = policy
    ? new Date(policy.effectiveDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <>
      <PageMeta title="Kebijakan Privasi | Oasys School" description="Kebijakan privasi Oasys School" />

      <div className="min-h-screen bg-gray-50 font-jakarta dark:bg-gray-950">
        <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto max-w-3xl px-6 py-5 sm:px-10">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-gray-500 transition-colors hover:text-brand-500"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Kembali ke beranda
            </Link>
          </div>
        </header>

        <div className="bg-white dark:bg-gray-900">
          <div className="mx-auto max-w-3xl px-6 pb-10 pt-8 sm:px-10">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/10">
              <ShieldCheck size={26} aria-hidden="true" />
            </span>
            <h1 className="font-display mt-5 text-[30px] leading-tight text-gray-900 dark:text-white/90 sm:text-[36px]">
              Kebijakan Privasi
            </h1>
            {policy && (
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-gray-500 dark:text-gray-400">{policy.intro}</p>
            )}

            {policy && (
              <div className="mt-6 inline-flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-white/5">
                <span className="flex items-center gap-2 text-[13px] text-gray-600 dark:text-gray-300">
                  <FileText size={15} aria-hidden="true" className="text-gray-400" />
                  Versi {policy.version}
                </span>
                <span className="hidden h-4 w-px bg-gray-200 dark:bg-gray-700 sm:block" />
                <span className="text-[13px] text-gray-600 dark:text-gray-300">Berlaku sejak {effectiveDate}</span>
              </div>
            )}
          </div>
        </div>

        <main className="mx-auto max-w-3xl px-6 py-10 sm:px-10">
          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="pt-4" />
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          )}

          {errorMessage && !isLoading && (
            <div role="alert" className="rounded-xl border border-error-200 bg-error-50 px-4 py-3.5 text-[13.5px] text-error-700">
              {errorMessage}
            </div>
          )}

          {policy && (
            <div className="space-y-10">
              {policy.sections.map((section, idx) => (
                <section key={section.heading}>
                  <div className="flex items-baseline gap-3 border-b border-gray-100 pb-2.5 dark:border-gray-800">
                    <span className="font-display text-[15px] text-brand-400">{String(idx + 1).padStart(2, '0')}</span>
                    <h2 className="font-display text-[20px] text-gray-900 dark:text-white/90">{section.heading}</h2>
                  </div>
                  <p className="mt-4 text-[15px] leading-[1.75] text-gray-600 dark:text-gray-300">{section.body}</p>
                  {section.items.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {section.items.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-[15px] text-gray-600 dark:text-gray-300">
                          <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-brand-400" aria-hidden="true" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          )}
        </main>

        <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto flex max-w-3xl flex-col items-start justify-between gap-3 px-6 py-6 sm:flex-row sm:items-center sm:px-10">
            <p className="text-[13px] text-gray-400">© {new Date().getFullYear()} Oasys School</p>
            <Link to="/" className="text-[13px] font-medium text-brand-500 hover:underline">
              Kembali ke beranda
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
}
