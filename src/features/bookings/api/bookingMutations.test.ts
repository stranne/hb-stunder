import { QueryClient } from "@tanstack/react-query";
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
import { ApiError } from "../../../api/errors";
import { MOCK_CUSTOMER_ID } from "../../../mocks/mockSession";

const endpoint = `${REAL_API_BASE_URL}/customers/:customerId/bookings/groupactivities`;
const server = setupServer();
const clients: QueryClient[] = [];
let bookingMocks: typeof import("../../../mocks/handlers/bookings");
let scheduleQueries: typeof import("../../schedule/api/scheduleQueries");
let queries: typeof import("./bookingQueries");
let mutations: typeof import("./bookingMutations");

function createClient() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  return client;
}

function executeCreate(
  client: QueryClient,
  variables = {
    customerId: MOCK_CUSTOMER_ID,
    groupActivity: 123456,
    allowWaitingList: false,
  },
) {
  return client
    .getMutationCache()
    .build(client, mutations.createGroupActivityBookingMutationOptions(client))
    .execute(variables);
}

beforeAll(async () => {
  server.listen({ onUnhandledRequest: "error" });
  [bookingMocks, scheduleQueries, queries, mutations] = await Promise.all([
    import("../../../mocks/handlers/bookings"),
    import("../../schedule/api/scheduleQueries"),
    import("./bookingQueries"),
    import("./bookingMutations"),
  ]);
});
beforeEach(() => {
  bookingMocks.resetMockBookingState();
  server.use(...bookingMocks.bookingHandlers);
});
afterEach(() => {
  server.resetHandlers();
  clients.splice(0).forEach((client) => client.clear());
});
afterAll(() => server.close());

describe("create group-activity booking mutation", () => {
  it("sends only the schema-backed fields and refetches customer bookings and schedule lists", async () => {
    let requestedBody: unknown;
    let requestedCustomerId: string | readonly string[] | undefined;
    server.use(
      http.post(endpoint, async ({ request, params }) => {
        requestedBody = await request.json();
        requestedCustomerId = params.customerId;
        return new HttpResponse(null, { status: 201 });
      }),
    );
    const client = createClient();
    const bookingQuery = vi.fn().mockResolvedValue([]);
    const scheduleQuery = vi.fn().mockResolvedValue([]);

    await client.fetchQuery({
      queryKey: queries.bookingKeys.groupActivities(MOCK_CUSTOMER_ID),
      queryFn: bookingQuery,
    });
    await client.fetchQuery({
      queryKey: scheduleQueries.scheduleKeys.list({ businessUnit: 1, date: "2026-07-28" }),
      queryFn: scheduleQuery,
    });

    await executeCreate(client);

    expect(requestedCustomerId).toBe(MOCK_CUSTOMER_ID);
    expect(requestedBody).toEqual({ groupActivity: 123456, allowWaitingList: false });
    expect(bookingQuery).toHaveBeenCalledTimes(2);
    expect(scheduleQuery).toHaveBeenCalledTimes(2);
  });

  it("updates state through the development handler and reconciles from a refetched GET", async () => {
    const client = createClient();
    const options = queries.customerGroupActivityBookingsQueryOptions(MOCK_CUSTOMER_ID);
    const before = await client.fetchQuery(options);

    await executeCreate(client, {
      customerId: MOCK_CUSTOMER_ID,
      groupActivity: 654321,
      allowWaitingList: true,
    });

    const after = client.getQueryData(options.queryKey);
    expect(before).toHaveLength(2);
    expect(after).toHaveLength(3);
    expect(after).toContainEqual(
      expect.objectContaining({
        groupActivity: { id: 654321 },
        type: "groupActivityWaitingListBooking",
      }),
    );
  });

  it("does not retry and exposes a generic ApiError without changing cached data", async () => {
    let attempts = 0;
    server.use(
      http.post(endpoint, () => {
        attempts += 1;
        return HttpResponse.json({ message: "Mock failure" }, { status: 500 });
      }),
    );
    const client = createClient();
    const existing = [{ groupActivity: { id: 42 } }];
    client.setQueryData(queries.bookingKeys.groupActivities(MOCK_CUSTOMER_ID), existing);

    const error = await executeCreate(client).catch((reason: unknown) => reason);

    expect(attempts).toBe(1);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 500, cause: { message: "Mock failure" } });
    expect(client.getQueryData(queries.bookingKeys.groupActivities(MOCK_CUSTOMER_ID))).toBe(
      existing,
    );
  });
});
