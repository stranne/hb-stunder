import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { SessionProvider } from "../src/features/auth/SessionProvider";
import i18n from "../src/i18n";

export function StoryEnvironment({
  locale,
  reducedMotion,
  themeStudy,
  colorMode,
  children,
}: {
  locale: string;
  reducedMotion: boolean;
  themeStudy: string;
  colorMode: string;
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
    root.dataset.themeStudy = themeStudy;
    root.dataset.colorMode = colorMode;

    return () => {
      delete root.dataset.themeStudy;
      delete root.dataset.colorMode;
    };
  }, [colorMode, themeStudy]);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider mockEnabled initiallySignedIn={false}>
        <div data-reduced-motion={reducedMotion || undefined}>{children}</div>
      </SessionProvider>
    </QueryClientProvider>
  );
}
