import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider } from "@tanstack/react-router";
import { useState } from "react";
import { SessionProvider } from "../../features/auth/SessionProvider";
import { MockSessionProvider } from "../../mocks/MockSessionProvider";
import { router } from "../router";

const ActiveSessionProvider =
  import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW === "true"
    ? MockSessionProvider
    : SessionProvider;

export function AppProviders() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 20_000,
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ActiveSessionProvider>
        <RouterProvider router={router} />
      </ActiveSessionProvider>
      {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  );
}
