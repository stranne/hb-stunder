// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vite-plus/test";
import { REAL_API_BASE_URL } from "../../../api/config";
import i18n from "../../../i18n";

let SchedulePage: typeof import("./SchedulePage").SchedulePage;
const scheduleEndpoint = `${REAL_API_BASE_URL}/businessunits/:businessUnit/groupactivities`;
const server = setupServer(
  http.get(`${REAL_API_BASE_URL}/services/groupactivityinstructors`, () => HttpResponse.json([])),
  http.get(`${REAL_API_BASE_URL}/products/groupactivities`, () => HttpResponse.json([])),
);
const clients: QueryClient[] = [];

function activity(id: number, name: string) {
  return {
    id,
    name,
    duration: {
      start: "2026-07-28T06:00:00.000Z",
      end: "2026-07-28T07:00:00.000Z",
    },
    slots: { leftToBook: 8, hasWaitingList: false },
  };
}

function renderPage(locations: number[], customerId?: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  clients.push(queryClient);

  render(
    <QueryClientProvider client={queryClient}>
      <SchedulePage
        search={{
          date: "2026-07-28",
          locations,
          instructors: [],
          activityTypes: [],
        }}
        onSearchChange={() => undefined}
        customerId={customerId}
      />
    </QueryClientProvider>,
  );

  return queryClient;
}

beforeAll(async () => {
  server.listen({ onUnhandledRequest: "error" });
  SchedulePage = (await import("./SchedulePage")).SchedulePage;
  await i18n.changeLanguage("en");
});

afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  server.resetHandlers();
});

afterAll(() => server.close());

describe("SchedulePage", () => {
  it("reconciles a customer booking to its schedule card by activity ID", async () => {
    server.use(
      http.get(scheduleEndpoint, () => HttpResponse.json([activity(101, "Booked class")])),
      http.get(
        `${REAL_API_BASE_URL}/customers/:customerId/bookings/groupactivities`,
        ({ params }) => {
          expect(params.customerId).toBe("900001");
          return HttpResponse.json([
            { groupActivity: { id: 101 }, groupActivityBooking: { id: 700001 } },
          ]);
        },
      ),
    );

    renderPage([1], "900001");

    expect(await screen.findByText("Booked class")).toBeTruthy();
    expect(await screen.findByText("Already booked")).toBeTruthy();
  });

  it("keeps successful locations visible and retries only a failed location", async () => {
    let failedLocationRequests = 0;
    server.use(
      http.get(scheduleEndpoint, ({ params }) => {
        const businessUnit = Number(params.businessUnit);
        if (businessUnit === 4128 && failedLocationRequests++ === 0) {
          return HttpResponse.json({ message: "Unavailable" }, { status: 503 });
        }
        return HttpResponse.json([
          activity(businessUnit, businessUnit === 4128 ? "Recovered class" : "Available class"),
        ]);
      }),
    );

    renderPage([1, 4128]);

    expect(await screen.findByText("Available class")).toBeTruthy();
    expect(await screen.findByText("Classes from one location could not be loaded.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("Recovered class")).toBeTruthy();
    await waitFor(() => {
      expect(screen.queryByText("Classes from one location could not be loaded.")).toBeNull();
    });
    expect(failedLocationRequests).toBe(2);
  });

  it("only offers filters available at the selected locations", async () => {
    server.use(
      http.get(scheduleEndpoint, () =>
        HttpResponse.json([
          {
            ...activity(1, "Haga class"),
            instructors: [{ id: 21, name: "Local instructor" }],
            groupActivityProduct: { id: 201, name: "Local class type" },
          },
        ]),
      ),
      http.get(`${REAL_API_BASE_URL}/services/groupactivityinstructors`, () =>
        HttpResponse.json([
          { id: 21, name: "Local instructor" },
          { id: 22, name: "Other instructor" },
        ]),
      ),
      http.get(`${REAL_API_BASE_URL}/products/groupactivities`, () =>
        HttpResponse.json([
          { id: 201, name: "Local class type" },
          { id: 202, name: "Other class type" },
        ]),
      ),
    );

    renderPage([1]);

    expect(await screen.findByText("Haga class")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Open schedule filters" }));

    expect(await screen.findByRole("checkbox", { name: "Local instructor" })).toBeTruthy();
    expect(screen.queryByRole("checkbox", { name: "Other instructor" })).toBeNull();
    expect(screen.getByRole("checkbox", { name: "Local class type" })).toBeTruthy();
    expect(screen.queryByRole("checkbox", { name: "Other class type" })).toBeNull();
  });

  it("offers recovery when the complete schedule request fails", async () => {
    let requests = 0;
    server.use(
      http.get(scheduleEndpoint, () => {
        requests += 1;
        return requests === 1
          ? HttpResponse.json({ message: "Unavailable" }, { status: 503 })
          : HttpResponse.json([activity(1, "Schedule restored")]);
      }),
    );

    renderPage([1]);

    expect((await screen.findByRole("alert")).textContent).toContain(
      "The schedule could not be loaded.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("Schedule restored")).toBeTruthy();
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  });
});
