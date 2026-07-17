import { Spinner } from './Spinner';

export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Memuat">
      <Spinner size="lg" className="text-brand-500" />

    </div>

  );
}
