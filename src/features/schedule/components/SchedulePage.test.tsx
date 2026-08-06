// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";
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

beforeEach(() => {
  vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-07-28T05:00:00.000Z"));
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  server.resetHandlers();
});

afterAll(() => server.close());

describe("SchedulePage", () => {
  it("elevates the sticky controls only after the page scrolls beneath them", () => {
    server.use(http.get(scheduleEndpoint, () => HttpResponse.json([])));
    renderPage([1]);

    const page = screen.getByRole("main", { name: "Classes" });
    const controls = page.firstElementChild;
    expect(controls?.getAttribute("data-elevated")).toBeNull();

    const pageRect = vi
      .spyOn(page, "getBoundingClientRect")
      .mockReturnValue({ top: -1 } as DOMRect);
    fireEvent.scroll(window);
    expect(controls?.getAttribute("data-elevated")).toBe("true");

    pageRect.mockReturnValue({ top: 0 } as DOMRect);
    fireEvent.scroll(window);
    expect(controls?.getAttribute("data-elevated")).toBeNull();
  });

  it("includes business unit names when multiple locations are enabled", async () => {
    server.use(
      http.get(scheduleEndpoint, ({ params }) => {
        const businessUnit = Number(params.businessUnit);
        const businessUnitName = businessUnit === 1 ? "Hagabadet i Haga" : "Drottningtorget";
        return HttpResponse.json([
          {
            ...activity(businessUnit, `Class ${businessUnit}`),
            businessUnit: { id: businessUnit, name: businessUnitName },
            locations: [{ id: businessUnit, name: `Studio ${businessUnit}` }],
          },
        ]);
      }),
    );

    renderPage([1, 4128]);

    expect(await screen.findByText("Studio 1, Hagabadet i Haga")).toBeTruthy();
    expect(await screen.findByText("Studio 4128, Drottningtorget")).toBeTruthy();
  });

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

    expect(screen.getByRole("main", { name: "Classes" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Classes" })).toBeNull();
    expect(await screen.findByText("Booked class")).toBeTruthy();
    expect(await screen.findByText("Already booked")).toBeTruthy();
  });

  it("books only after confirmation and reconciles the refetched booking", async () => {
    let bookingCreated = false;
    let postRequests = 0;
    server.use(
      http.get(scheduleEndpoint, () => HttpResponse.json([activity(101, "Available class")])),
      http.get(`${REAL_API_BASE_URL}/customers/:customerId/bookings/groupactivities`, () =>
        HttpResponse.json(
          bookingCreated
            ? [{ groupActivity: { id: 101 }, groupActivityBooking: { id: 700001 } }]
            : [],
        ),
      ),
      http.post(
        `${REAL_API_BASE_URL}/customers/:customerId/bookings/groupactivities`,
        async ({ params, request }) => {
          postRequests += 1;
          expect(params.customerId).toBe("900001");
          expect(await request.json()).toEqual({
            groupActivity: 101,
            allowWaitingList: false,
          });
          bookingCreated = true;
          return new HttpResponse(null, { status: 201 });
        },
      ),
    );

    renderPage([1], "900001");

    const book = await screen.findByRole("button", { name: "Book" });
    fireEvent.click(book);
    expect(postRequests).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: "Confirm booking" }));

    expect(await screen.findByText("Already booked")).toBeTruthy();
    expect(postRequests).toBe(1);
    expect(screen.queryByRole("button", { name: "Book" })).toBeNull();
  });

  it("joins a waiting list only after confirmation and reconciles the refetched state", async () => {
    let waitingListJoined = false;
    let postRequests = 0;
    server.use(
      http.get(scheduleEndpoint, () =>
        HttpResponse.json([
          {
            ...activity(102, "Wait-listed class"),
            slots: { leftToBook: 0, hasWaitingList: true },
          },
        ]),
      ),
      http.get(`${REAL_API_BASE_URL}/customers/:customerId/bookings/groupactivities`, () =>
        HttpResponse.json(
          waitingListJoined
            ? [
                {
                  groupActivity: { id: 102 },
                  groupActivityBooking: { id: 700002 },
                  type: "groupActivityWaitingListBooking",
                },
              ]
            : [],
        ),
      ),
      http.post(
        `${REAL_API_BASE_URL}/customers/:customerId/bookings/groupactivities`,
        async ({ request }) => {
          postRequests += 1;
          expect(await request.json()).toEqual({
            groupActivity: 102,
            allowWaitingList: true,
          });
          waitingListJoined = true;
          return new HttpResponse(null, { status: 201 });
        },
      ),
    );

    renderPage([1], "900001");

    const join = await screen.findByRole("button", { name: "Join waiting list" });
    fireEvent.click(join);
    expect(postRequests).toBe(0);
    expect(screen.getByText(/This does not book a spot/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Join waiting list" }));

    expect(await screen.findByText("On waiting list")).toBeTruthy();
    expect(postRequests).toBe(1);
    expect(screen.queryByRole("button", { name: "Join waiting list" })).toBeNull();
  });

  it("cancels an ordinary booking only after confirmation and reconciles refetched state", async () => {
    let bookingExists = true;
    let deleteRequests = 0;
    server.use(
      http.get(scheduleEndpoint, () => HttpResponse.json([activity(101, "Booked class")])),
      http.get(`${REAL_API_BASE_URL}/customers/:customerId/bookings/groupactivities`, () =>
        HttpResponse.json(
          bookingExists
            ? [
                {
                  groupActivity: { id: 101 },
                  groupActivityBooking: { id: 700001 },
                  type: "groupActivityBooking",
                },
              ]
            : [],
        ),
      ),
      http.delete(
        `${REAL_API_BASE_URL}/customers/:customerId/bookings/groupactivities/:bookingId`,
        ({ params, request }) => {
          deleteRequests += 1;
          expect(params.customerId).toBe("900001");
          expect(params.bookingId).toBe("700001");
          expect(new URL(request.url).searchParams.get("bookingType")).toBe("groupActivityBooking");
          bookingExists = false;
          return new HttpResponse(null, { status: 204 });
        },
      ),
    );

    renderPage([1], "900001");

    const cancel = await screen.findByRole("button", { name: "Cancel booking" });
    fireEvent.click(cancel);
    expect(deleteRequests).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: "Cancel booking" }));

    expect(await screen.findByRole("button", { name: "Book" })).toBeTruthy();
    expect(deleteRequests).toBe(1);
    expect(screen.queryByText("Already booked")).toBeNull();
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

  it("offers every filter option returned by the bootstrap requests", async () => {
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
    expect(screen.getByRole("checkbox", { name: "Other instructor" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Local class type" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Other class type" })).toBeTruthy();
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
