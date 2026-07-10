import type { ReactNode } from 'react';
import { RollCallPanel } from '../../components/auth/RollCallPanel';

interface AuthPageLayoutProps {
  children: ReactNode;
}

export default function AuthPageLayout({ children }: AuthPageLayoutProps) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[minmax(0,44%)_1fr]">
      <div className="hidden lg:block">
        <RollCallPanel />
      </div>

      <div className="flex min-h-screen flex-col justify-center bg-white px-6 py-12 font-jakarta sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}