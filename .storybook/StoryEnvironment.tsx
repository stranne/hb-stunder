import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import i18n from "../src/i18n";
import { MockSessionProvider } from "../src/mocks/MockSessionProvider";

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
      <MockSessionProvider initiallySignedIn={initiallySignedIn}>
        <div data-reduced-motion={reducedMotion || undefined}>{children}</div>
      </MockSessionProvider>
    </QueryClientProvider>
  );
}
