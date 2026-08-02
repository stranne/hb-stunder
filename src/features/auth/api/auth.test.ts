import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vite-plus/test";
import { apiClient, setApiAccessToken } from "../../../api/client";
import { REAL_API_BASE_URL } from "../../../api/config";
import { ApiError } from "../../../api/errors";
import { login } from "./auth";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  setApiAccessToken(undefined);
  server.resetHandlers();
});
afterAll(() => server.close());

describe("login", () => {
  it("creates a customer session and authenticates subsequent requests", async () => {
    server.use(
      http.post(`${REAL_API_BASE_URL}/auth/login`, async ({ request }) => {
        expect(await request.json()).toEqual({ username: "member", password: "secret" });
        return HttpResponse.json({
          access_token: "test-access-token",
          customer: { id: 42, firstName: "Test", lastName: "Member" },
        });
      }),
      http.get(
        `${REAL_API_BASE_URL}/customers/:customerId/bookings/groupactivities`,
        ({ request }) => {
          expect(request.headers.get("authorization")).toBe("Bearer test-access-token");
          return HttpResponse.json([]);
        },
      ),
    );

    await expect(login({ username: "member", password: "secret" })).resolves.toEqual({
      accessToken: "test-access-token",
      customerId: "42",
      displayName: "Test Member",
    });

    const result = await apiClient.GET("/customers/{customerId}/bookings/groupactivities", {
      params: { path: { customerId: "42" } },
    });
    expect(result.response.ok).toBe(true);
  });

  it("loads the customer's name when the sign-in response only identifies them", async () => {
    server.use(
      http.post(`${REAL_API_BASE_URL}/auth/login`, () =>
        HttpResponse.json({ access_token: "test-access-token", customerId: 42 }),
      ),
      http.get(`${REAL_API_BASE_URL}/customers/42`, ({ request }) => {
        expect(request.headers.get("authorization")).toBe("Bearer test-access-token");
        return HttpResponse.json({ id: 42, firstName: "Test", lastName: "Member" });
      }),
    );

    await expect(login({ username: "member", password: "secret" })).resolves.toEqual({
      accessToken: "test-access-token",
      customerId: "42",
      displayName: "Test Member",
    });
  });

  it("does not use the customer identification number as a display name", async () => {
    server.use(
      http.post(`${REAL_API_BASE_URL}/auth/login`, () =>
        HttpResponse.json({ access_token: "test-access-token", customerId: 42 }),
      ),
      http.get(`${REAL_API_BASE_URL}/customers/42`, () => new HttpResponse(null, { status: 503 })),
    );

    await expect(login({ username: "member", password: "secret" })).resolves.toEqual({
      accessToken: "test-access-token",
      customerId: "42",
    });
  });

  it("rejects a successful response without authentication data", async () => {
    server.use(
      http.post(`${REAL_API_BASE_URL}/auth/login`, () => HttpResponse.json({ success: true })),
    );

    await expect(login({ username: "member", password: "secret" })).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});
