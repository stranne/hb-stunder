import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { SessionProvider } from "../src/features/auth/SessionProvider";
import i18n from "../src/i18n";

export function StoryEnvironment({
  locale,
  reducedMotion,
  colorMode,
  initiallySignedIn,
  children,
}: {
  locale: string;
  reducedMotion: boolean;
  colorMode: string;
  initiallySignedIn: boolean;
  children: ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }),
  );

  useEffect(() => {
    void i18n.changeLanguage(locale);
  }, [locale]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.colorMode = colorMode;

    return () => {
      delete root.dataset.colorMode;
    };
  }, [colorMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider mockEnabled initiallySignedIn={initiallySignedIn}>
        <div data-reduced-motion={reducedMotion || undefined}>{children}</div>
      </SessionProvider>
    </QueryClientProvider>
  );
}
