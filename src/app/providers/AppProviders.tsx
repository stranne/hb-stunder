import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider } from "@tanstack/react-router";
import { useState } from "react";
import { SessionProvider } from "../../features/auth/SessionProvider";
import { router } from "../router";

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
      <SessionProvider>
        <RouterProvider router={router} />
      </SessionProvider>
      {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  );
}
