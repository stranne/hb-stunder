// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vite-plus/test";
import { REAL_API_BASE_URL } from "../api/config";
import { SessionProvider } from "../features/auth/SessionProvider";
import i18n from "../i18n";

const server = setupServer();
let BookingsRoute: typeof import("./BookingsRoute").BookingsRoute;
let queryClient: QueryClient;

function renderRoute(initiallySignedIn = false) {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <SessionProvider mockEnabled initiallySignedIn={initiallySignedIn}>
        <BookingsRoute />
      </SessionProvider>
    </QueryClientProvider>,
  );
}

beforeAll(async () => {
  server.listen({ onUnhandledRequest: "error" });
  BookingsRoute = (await import("./BookingsRoute")).BookingsRoute;
  await i18n.changeLanguage("en");
});

afterEach(() => {
  cleanup();
  queryClient?.clear();
  window.localStorage.clear();
  server.resetHandlers();
});

afterAll(() => server.close());

describe("BookingsRoute", () => {
  it("requires an explicit demo sign-in before loading all customer bookings", async () => {
    let requests = 0;
    server.use(
      http.get(
        `${REAL_API_BASE_URL}/customers/:customerId/bookings/groupactivities`,
        ({ params }) => {
          requests += 1;
          expect(params.customerId).toBe("900001");
          return HttpResponse.json([
            {
              groupActivity: { id: 102, name: "Tomorrow yoga" },
              groupActivityBooking: { id: 702 },
              duration: { start: "2026-07-29T08:00:00.000Z" },
              businessUnit: { name: "Haga" },
              type: "groupActivityWaitingListBooking",
            },
            {
              groupActivity: { id: 101, name: "Today strength" },
              groupActivityBooking: { id: 701 },
              duration: { start: "2026-07-28T06:00:00.000Z" },
              businessUnit: { name: "Älvstranden" },
              type: "groupActivityBooking",
            },
          ]);
        },
      ),
    );

    renderRoute();

    expect(screen.getByText("Sign in to see your current bookings.")).toBeTruthy();
    expect(requests).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Today strength")).toBeTruthy();
    expect(screen.getByText("Tomorrow yoga")).toBeTruthy();
    expect(screen.getByText("Booked")).toBeTruthy();
    expect(screen.getByText("On waiting list")).toBeTruthy();
    expect(requests).toBe(1);

    const items = screen.getAllByRole("listitem");
    expect(items[0]?.textContent).toContain("Today strength");
    expect(items[1]?.textContent).toContain("Tomorrow yoga");
  });

  it("offers retry without hiding the account page", async () => {
    let requests = 0;
    server.use(
      http.get(`${REAL_API_BASE_URL}/customers/:customerId/bookings/groupactivities`, () => {
        requests += 1;
        return requests === 1
          ? HttpResponse.json({ message: "Unavailable" }, { status: 503 })
          : HttpResponse.json([]);
      }),
    );

    renderRoute(true);

    expect((await screen.findByRole("alert")).textContent).toContain("could not be loaded");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("You have no current group activity bookings.")).toBeTruthy();
    expect(requests).toBe(2);
  });
});
