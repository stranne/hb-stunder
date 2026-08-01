import { QueryClient } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vite-plus/test";
import { REAL_API_BASE_URL } from "../../../api/config";

const endpoint = `${REAL_API_BASE_URL}/customers/:customerId/bookings/groupactivities`;
const server = setupServer();
let queries: typeof import("./bookingQueries");

beforeAll(async () => {
  server.listen({ onUnhandledRequest: "error" });
  queries = await import("./bookingQueries");
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("customer group-activity booking queries", () => {
  it("uses a customer-scoped key and disables requests without an injected customer", () => {
    expect(queries.bookingKeys.groupActivities("900001")).toEqual([
      "bookings",
      "customer",
      "900001",
      "group-activities",
    ]);
    expect(queries.customerGroupActivityBookingsQueryOptions(undefined).enabled).toBe(false);
  });

  it("loads bookings from the generated customer path through MSW", async () => {
    let requestedUrl: string | undefined;
    let requestedCustomerId: string | readonly string[] | undefined;
    server.use(
      http.get(endpoint, ({ request, params }) => {
        requestedUrl = request.url;
        requestedCustomerId = params.customerId;
        return HttpResponse.json([{ groupActivity: { id: 101 } }]);
      }),
    );
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const data = await client.fetchQuery(
      queries.customerGroupActivityBookingsQueryOptions("900001"),
    );

    expect(data[0]?.groupActivity?.id).toBe(101);
    expect(requestedCustomerId).toBe("900001");
    expect(requestedUrl).toBe(`${REAL_API_BASE_URL}/customers/900001/bookings/groupactivities`);
    client.clear();
  });
});
