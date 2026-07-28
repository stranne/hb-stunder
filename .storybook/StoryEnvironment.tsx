import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import i18n from "../src/i18n";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

export function StoryEnvironment({
  locale,
  reducedMotion,
  children,
}: {
  locale: string;
  reducedMotion: boolean;
  children: ReactNode;
}) {
  useEffect(() => {
    void i18n.changeLanguage(locale);
  }, [locale]);

  return (
    <QueryClientProvider client={queryClient}>
      <div data-reduced-motion={reducedMotion || undefined}>{children}</div>
    </QueryClientProvider>
  );
}
