import { QueryClient } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vite-plus/test";
import { REAL_API_BASE_URL } from "../../../api/config";

const endpoint = `${REAL_API_BASE_URL}/products/groupactivities`;
const server = setupServer();
let queries: typeof import("./scheduleFilterQueries");

beforeAll(async () => {
  server.listen({ onUnhandledRequest: "error" });
  queries = await import("./scheduleFilterQueries");
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("schedule filter queries", () => {
  it("retains valid activity-type business units and treats unusable metadata as unknown", async () => {
    server.use(
      http.get(endpoint, () =>
        HttpResponse.json([
          {
            id: 1,
            name: "Known locations",
            businessUnits: [
              { id: 1, name: "Haga" },
              { id: 4128, name: "Drottningtorget" },
              { id: 1, name: "Haga" },
            ],
          },
          { id: 2, name: "Empty locations", businessUnits: [] },
          { id: 3, name: "Missing locations" },
        ]),
      ),
    );
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const data = await client.fetchQuery(queries.activityTypeQueryOptions());

    expect(data).toEqual([
      { id: 1, name: "Known locations", businessUnitIds: [1, 4128] },
      { id: 2, name: "Empty locations", businessUnitIds: undefined },
      { id: 3, name: "Missing locations", businessUnitIds: undefined },
    ]);
    client.clear();
  });
});
