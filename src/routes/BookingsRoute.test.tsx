// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  it("loads bookings only for a signed-in customer", async () => {
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
    expect(screen.queryByRole("button", { name: "Sign in" })).toBeNull();
    expect(requests).toBe(0);

    cleanup();
    renderRoute(true);

    expect(await screen.findByText("Today strength")).toBeTruthy();
    expect(screen.getByText("Tomorrow yoga")).toBeTruthy();
    expect(screen.getByText("Booked")).toBeTruthy();
    expect(screen.getByText("On waiting list")).toBeTruthy();
    expect(requests).toBe(1);

    const items = screen.getAllByRole("listitem");
    expect(items[0]?.textContent).toContain("Today strength");
    expect(items[1]?.textContent).toContain("Tomorrow yoga");
  });

  it("cancels an ordinary booking after confirmation and keeps waiting-list cancellation blocked", async () => {
    let bookings = [
      {
        groupActivity: { id: 101, name: "Today strength" },
        groupActivityBooking: { id: 701 },
        duration: { start: "2026-07-28T06:00:00.000Z" },
        type: "groupActivityBooking",
      },
      {
        groupActivity: { id: 102, name: "Tomorrow yoga" },
        groupActivityBooking: { id: 702 },
        duration: { start: "2026-07-29T08:00:00.000Z" },
        type: "groupActivityWaitingListBooking",
      },
      {
        groupActivity: { id: 103, name: "Unknown booking type" },
        groupActivityBooking: { id: 703 },
        duration: { start: "2026-07-30T08:00:00.000Z" },
        type: "unexpectedBookingType",
      },
    ];
    let cancellationRequests = 0;
    server.use(
      http.get(`${REAL_API_BASE_URL}/customers/:customerId/bookings/groupactivities`, () =>
        HttpResponse.json(bookings),
      ),
      http.delete(
        `${REAL_API_BASE_URL}/customers/:customerId/bookings/groupactivities/:bookingId`,
        ({ params, request }) => {
          cancellationRequests += 1;
          expect(params.customerId).toBe("900001");
          expect(params.bookingId).toBe("701");
          expect(new URL(request.url).searchParams.get("bookingType")).toBe("groupActivityBooking");
          bookings = bookings.filter(
            ({ groupActivityBooking }) => groupActivityBooking.id !== Number(params.bookingId),
          );
          return new HttpResponse(null, { status: 204 });
        },
      ),
    );

    renderRoute(true);

    expect(await screen.findByText("Today strength")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Cancel booking" })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Cancel booking" }));
    expect(cancellationRequests).toBe(0);
    expect(screen.getByRole("heading", { name: "Confirm cancellation" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel booking" }));

    await waitFor(() => expect(screen.queryByText("Today strength")).toBeNull());
    expect(screen.getByText("Tomorrow yoga")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Cancel booking" })).toBeNull();
    expect(cancellationRequests).toBe(1);
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole("heading", { name: "My bookings" })),
    );
  });

  it("preserves an ordinary booking after cancellation failure and offers deliberate retry", async () => {
    let attempts = 0;
    server.use(
      http.get(`${REAL_API_BASE_URL}/customers/:customerId/bookings/groupactivities`, () =>
        HttpResponse.json([
          {
            groupActivity: { id: 101, name: "Today strength" },
            groupActivityBooking: { id: 701 },
            duration: { start: "2026-07-28T06:00:00.000Z" },
            type: "groupActivityBooking",
          },
        ]),
      ),
      http.delete(
        `${REAL_API_BASE_URL}/customers/:customerId/bookings/groupactivities/:bookingId`,
        () => {
          attempts += 1;
          return HttpResponse.json({ message: "Unavailable" }, { status: 503 });
        },
      ),
    );

    renderRoute(true);
    expect(await screen.findByText("Today strength")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel booking" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel booking" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Your bookings have not changed",
    );
    expect(screen.getByText("Today strength")).toBeTruthy();
    expect(attempts).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: "Try cancelling again" }));
    await waitFor(() => expect(attempts).toBe(2));
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
