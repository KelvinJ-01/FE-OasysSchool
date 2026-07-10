import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageMeta from '../components/common/PageMeta';
import { apiClient, getApiErrorMessage } from '../lib/apiClient';
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

  return (
    <>
      <PageMeta title="Kebijakan Privasi | Oasys School" description="Kebijakan privasi Oasys School" />

      <div className="min-h-screen bg-white font-jakarta">
        <div className="mx-auto max-w-2xl px-6 py-14 sm:px-10">
          <Link to="/" className="text-[13.5px] font-medium text-brand-500 hover:underline">
            &larr; Kembali
          </Link>

          <h1 className="font-display mt-6 text-[30px] text-gray-900 sm:text-[34px]">Kebijakan Privasi</h1>

          {isLoading && <p className="mt-6 text-[14px] text-gray-500">Memuat kebijakan privasi...</p>}

          {errorMessage && !isLoading && (
            <div role="alert" className="mt-6 rounded-md border border-error-200 bg-error-50 px-3.5 py-3 text-[13.5px] text-error-700">
              {errorMessage}
            </div>
          )}

          {policy && (
            <>
              <p className="mt-2 text-[13px] text-gray-500">
                Versi {policy.version} — berlaku sejak{' '}
                {new Date(policy.effectiveDate).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>

              <div className="mt-8 max-w-none whitespace-pre-wrap text-[14.5px] leading-relaxed text-gray-700">
                {policy.content}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}