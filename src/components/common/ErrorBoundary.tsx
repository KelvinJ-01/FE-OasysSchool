import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught:', error, info);
    }
  }

  handleReload = (): void => {
    this.setState({ hasError: false });
    window.location.assign('/dashboard');
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center dark:bg-gray-900">
          <h1 className="text-[22px] font-semibold text-gray-900 dark:text-white/90">Terjadi kesalahan tak terduga</h1>

          <p className="max-w-md text-[14px] text-gray-500 dark:text-gray-400">
            Maaf, ada yang tidak beres saat memuat halaman. Coba muat ulang, atau kembali ke dasbor.
          </p>

          <button
            type="button"
            onClick={this.handleReload}
            className="h-11 rounded-md bg-brand-500 px-5 text-[14px] font-medium text-white transition-colors hover:bg-brand-600"
          >
            Kembali ke Dasbor
          </button>

        </div>

      );
    }
    return this.props.children;
  }
}