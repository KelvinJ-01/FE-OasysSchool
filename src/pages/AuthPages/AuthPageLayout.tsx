import { ReactNode } from "react";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

interface AuthPageLayoutProps {
  children: ReactNode;
}

export default function AuthPageLayout({ children }: AuthPageLayoutProps) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white px-4 dark:bg-gray-900">
      {children}

      <div className="fixed right-6 bottom-6 z-50 hidden sm:block">
        <ThemeTogglerTwo />
      </div>
    </div>
  );
}