// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { StrictMode } from "react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { apiClient, setApiAccessToken } from "../../api/client";
import { REAL_API_BASE_URL } from "../../api/config";
import { SessionProvider } from "./SessionProvider";
import { useSession } from "./sessionContext";

const TOKEN_RENEWAL_URL = "https://hagabadet.brpsystems.com/brponline/oauth/access_token";
const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const realSetTimeout = globalThis.setTimeout;

const server = setupServer(
  http.post(`${REAL_API_BASE_URL}/auth/login`, () =>
    HttpResponse.json({
      access_token: jwtWithExpiry(Date.now() + 7 * 24 * 60 * 60 * 1000),
      customer: { id: 42, firstName: "Test", lastName: "Member" },
    }),
  ),
  http.get(`${REAL_API_BASE_URL}/customers/42`, () =>
    HttpResponse.json({ id: 42, firstName: "Test", lastName: "Member" }),
  ),
);

function jwtWithExpiry(expiresAt: number) {
  const payload = btoa(JSON.stringify({ exp: Math.floor(expiresAt / 1000), sub: "42" }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `header.${payload}.signature`;
}

function storeRememberedSession(expiresAt: number, displayName = "Test Member") {
  const accessToken = jwtWithExpiry(expiresAt);
  window.localStorage.setItem(
    "hb-stunder.session",
    JSON.stringify({ accessToken, refreshToken: "refresh-1", customerId: "42", displayName }),
  );
  return accessToken;
}

function storedSession() {
  return JSON.parse(window.localStorage.getItem("hb-stunder.session") ?? "null") as {
    accessToken: string;
    refreshToken?: string;
  } | null;
}

function respondWithRenewedToken(expiresAt = Date.now() + 7 * DAY_MS) {
  const accessToken = jwtWithExpiry(expiresAt);
  const requests: Request[] = [];
  server.use(
    http.post(TOKEN_RENEWAL_URL, ({ request }) => {
      requests.push(request.clone());
      return HttpResponse.json({ access_token: accessToken, refresh_token: "refresh-1" });
    }),
  );
  return { accessToken, requests };
}

function renderSession() {
  return render(
    <SessionProvider>
      <SessionStatus />
    </SessionProvider>,
  );
}

/** Waits in real time, even under fake timers, and leaves React's scheduled effects flushed. */
async function settleRequests() {
  await act(() => new Promise((resolve) => realSetTimeout(resolve, 50)));
}

function SessionStatus() {
  const { customer, canSignIn, signIn, signOut } = useSession();
  return (
    <>
      <p>{customer?.customerId ?? "signed-out"}</p>
      <p>{customer?.displayName ?? "no-name"}</p>
      <p>{canSignIn ? "available" : "unavailable"}</p>
      <button type="button" onClick={() => void signIn({ username: "demo", password: "password" })}>
        Sign in
      </button>
      <button
        type="button"
        onClick={() => void signIn({ username: "demo", password: "password" }, true)}
      >
        Remember sign in
      </button>
      <button type="button" onClick={signOut}>
        Sign out
      </button>
    </>
  );
}

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => {
  vi.useRealTimers();
  cleanup();
  setApiAccessToken(undefined);
  window.localStorage.clear();
  window.sessionStorage.clear();
  server.resetHandlers();
});
afterAll(() => server.close());

describe("SessionProvider", () => {
  it("stores a remembered real session persistently and restores it", async () => {
    const view = render(
      <SessionProvider>
        <SessionStatus />
      </SessionProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Remember sign in" }));
    await waitFor(() => expect(screen.getByText("42")).toBeTruthy());
    expect(window.localStorage.getItem("hb-stunder.session")).toBeTruthy();
    expect(window.sessionStorage.getItem("hb-stunder.session")).toBeNull();

    view.unmount();
    render(
      <SessionProvider>
        <SessionStatus />
      </SessionProvider>,
    );
    expect(screen.getByText("42")).toBeTruthy();
  });

  it("loads a name for a stored session that only has an identification number", async () => {
    window.localStorage.setItem(
      "hb-stunder.session",
      JSON.stringify({
        accessToken: jwtWithExpiry(Date.now() + 7 * 24 * 60 * 60 * 1000),
        customerId: "42",
        displayName: "42",
      }),
    );

    render(
      <SessionProvider>
        <SessionStatus />
      </SessionProvider>,
    );

    expect(screen.getByText("no-name")).toBeTruthy();
    await waitFor(() => expect(screen.getByText("Test Member")).toBeTruthy());
    expect(JSON.parse(window.localStorage.getItem("hb-stunder.session") ?? "{}")).toMatchObject({
      customerId: "42",
      displayName: "Test Member",
    });
  });

  it("keeps real sessions temporary by default", async () => {
    render(
      <SessionProvider>
        <SessionStatus />
      </SessionProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(screen.getByText("42")).toBeTruthy());
    expect(window.sessionStorage.getItem("hb-stunder.session")).toBeTruthy();
    expect(window.localStorage.getItem("hb-stunder.session")).toBeNull();
  });

  it("removes an expired persistent session instead of restoring it", () => {
    window.localStorage.setItem(
      "hb-stunder.session",
      JSON.stringify({
        accessToken: jwtWithExpiry(Date.now() - 1000),
        customerId: "42",
        displayName: "Test Member",
      }),
    );

    render(
      <SessionProvider>
        <SessionStatus />
      </SessionProvider>,
    );

    expect(screen.getByText("signed-out")).toBeTruthy();
    expect(window.localStorage.getItem("hb-stunder.session")).toBeNull();
  });

  it("makes sign-in available without a stored session", () => {
    render(
      <SessionProvider>
        <SessionStatus />
      </SessionProvider>,
    );

    expect(screen.getByText("available")).toBeTruthy();
    expect(screen.getByText("signed-out")).toBeTruthy();
  });

  describe("signing out in several tabs", () => {
    function signOutInAnotherTab() {
      const otherTab = new BroadcastChannel("hb-stunder.session");
      otherTab.postMessage("signed-out");
      otherTab.close();
    }

    it("ends a remembered session and stops authorizing requests", async () => {
      storeRememberedSession(Date.now() + 5 * DAY_MS);
      let authorization: string | null = "not-requested";
      server.use(
        http.get(`${REAL_API_BASE_URL}/customers/42`, ({ request }) => {
          authorization = request.headers.get("authorization");
          return HttpResponse.json({ id: 42 });
        }),
      );
      renderSession();
      expect(screen.getByText("42")).toBeTruthy();

      signOutInAnotherTab();

      await waitFor(() => expect(screen.getByText("signed-out")).toBeTruthy());
      expect(storedSession()).toBeNull();
      await apiClient.GET("/customers/{customerId}", { params: { path: { customerId: "42" } } });
      expect(authorization).toBeNull();
    });

    it("ends a temporary session whose copy is in this tab's own storage", async () => {
      window.sessionStorage.setItem(
        "hb-stunder.session",
        JSON.stringify({
          accessToken: jwtWithExpiry(Date.now() + DAY_MS),
          customerId: "42",
          displayName: "Test Member",
        }),
      );
      renderSession();
      expect(screen.getByText("42")).toBeTruthy();

      signOutInAnotherTab();

      await waitFor(() => expect(screen.getByText("signed-out")).toBeTruthy());
      expect(window.sessionStorage.getItem("hb-stunder.session")).toBeNull();
    });

    it("tells other tabs when the customer signs out here", async () => {
      storeRememberedSession(Date.now() + 5 * DAY_MS);
      const otherTab = new BroadcastChannel("hb-stunder.session");
      const announcement = new Promise((resolve) => {
        otherTab.addEventListener("message", resolve, { once: true });
      });
      renderSession();

      fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

      await announcement;
      otherTab.close();
      expect(screen.getByText("signed-out")).toBeTruthy();
    });
  });

  describe("session renewal", () => {
    function respondToLoginWithRefreshToken() {
      server.use(
        http.post(`${REAL_API_BASE_URL}/auth/login`, () =>
          HttpResponse.json({
            access_token: jwtWithExpiry(Date.now() + 7 * DAY_MS),
            refresh_token: "refresh-1",
            customer: { id: 42, firstName: "Test", lastName: "Member" },
          }),
        ),
      );
    }

    it("keeps the refresh token of a remembered sign-in", async () => {
      respondToLoginWithRefreshToken();
      renderSession();

      fireEvent.click(screen.getByRole("button", { name: "Remember sign in" }));

      await waitFor(() => expect(screen.getByText("42")).toBeTruthy());
      expect(storedSession()?.refreshToken).toBe("refresh-1");
    });

    it("discards the refresh token of a temporary sign-in", async () => {
      respondToLoginWithRefreshToken();
      renderSession();

      fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

      await waitFor(() => expect(screen.getByText("42")).toBeTruthy());
      expect(window.sessionStorage.getItem("hb-stunder.session")).not.toContain("refresh-1");
    });

    it("renews an expired remembered session on load and sends the verified request", async () => {
      storeRememberedSession(Date.now() - DAY_MS);
      const { accessToken, requests } = respondWithRenewedToken();

      renderSession();

      expect(screen.getByText("signed-out")).toBeTruthy();
      await waitFor(() => expect(screen.getByText("42")).toBeTruthy());
      expect(storedSession()?.accessToken).toBe(accessToken);
      expect(requests).toHaveLength(1);
      expect(requests[0]?.headers.get("authorization")).toBeNull();
      expect(requests[0]?.headers.get("content-type")).toBe("application/x-www-form-urlencoded");
      expect(await requests[0]?.text()).toBe("grant_type=refresh_token&refresh_token=refresh-1");
    });

    it("authorizes later requests with the renewed token", async () => {
      storeRememberedSession(Date.now() - DAY_MS, "42");
      const { accessToken } = respondWithRenewedToken();
      let authorization: string | null = null;
      server.use(
        http.get(`${REAL_API_BASE_URL}/customers/42`, ({ request }) => {
          authorization = request.headers.get("authorization");
          return HttpResponse.json({ id: 42, firstName: "Test", lastName: "Member" });
        }),
      );

      renderSession();

      await waitFor(() => expect(screen.getByText("Test Member")).toBeTruthy());
      expect(authorization).toBe(`Bearer ${accessToken}`);
    });

    it("renews a session close to expiry while the customer stays signed in", async () => {
      storeRememberedSession(Date.now() + HOUR_MS);
      const { accessToken, requests } = respondWithRenewedToken();

      renderSession();

      expect(screen.getByText("42")).toBeTruthy();
      await waitFor(() => expect(storedSession()?.accessToken).toBe(accessToken));
      expect(screen.getByText("42")).toBeTruthy();
      expect(requests[0]?.headers.get("authorization")).toBeNull();
    });

    it("leaves a session with plenty of lifetime alone", async () => {
      storeRememberedSession(Date.now() + 5 * DAY_MS);
      const { requests } = respondWithRenewedToken();

      renderSession();
      await settleRequests();

      expect(requests).toHaveLength(0);
    });

    it("renews once in strict mode", async () => {
      storeRememberedSession(Date.now() - DAY_MS);
      const { requests } = respondWithRenewedToken();

      render(
        <StrictMode>
          <SessionProvider>
            <SessionStatus />
          </SessionProvider>
        </StrictMode>,
      );

      await waitFor(() => expect(screen.getByText("42")).toBeTruthy());
      await settleRequests();
      expect(requests).toHaveLength(1);
    });

    it("renews at the margin before expiry while the app stays open", async () => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
      storeRememberedSession(Date.now() + 2 * DAY_MS);
      const { accessToken } = respondWithRenewedToken(Date.now() + 8 * DAY_MS);
      renderSession();

      await act(() => vi.advanceTimersByTimeAsync(DAY_MS + 1000));
      vi.useRealTimers();

      await waitFor(() => expect(storedSession()?.accessToken).toBe(accessToken));
      expect(screen.getByText("42")).toBeTruthy();
    });

    it("signs out and forgets the session when the server rejects the refresh token", async () => {
      storeRememberedSession(Date.now() + HOUR_MS);
      server.use(http.post(TOKEN_RENEWAL_URL, () => new HttpResponse(null, { status: 403 })));

      renderSession();

      await waitFor(() => expect(screen.getByText("signed-out")).toBeTruthy());
      expect(storedSession()).toBeNull();
    });

    it("keeps an expired session through an outage and recovers when back online", async () => {
      const expiredToken = storeRememberedSession(Date.now() - DAY_MS);
      server.use(http.post(TOKEN_RENEWAL_URL, () => HttpResponse.error()));

      renderSession();
      await settleRequests();

      expect(screen.getByText("signed-out")).toBeTruthy();
      expect(storedSession()?.accessToken).toBe(expiredToken);

      const { accessToken } = respondWithRenewedToken();
      act(() => {
        window.dispatchEvent(new Event("online"));
      });

      await waitFor(() => expect(screen.getByText("42")).toBeTruthy());
      expect(storedSession()?.accessToken).toBe(accessToken);
    });

    it("keeps retrying after a server error instead of signing out", async () => {
      const expiredToken = storeRememberedSession(Date.now() - DAY_MS);
      server.use(http.post(TOKEN_RENEWAL_URL, () => new HttpResponse(null, { status: 503 })));

      renderSession();
      await settleRequests();

      expect(storedSession()?.accessToken).toBe(expiredToken);
    });

    it("waits between automatic retries", async () => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
      storeRememberedSession(Date.now() - DAY_MS);
      let attempts = 0;
      server.use(
        http.post(TOKEN_RENEWAL_URL, () => {
          attempts += 1;
          return HttpResponse.error();
        }),
      );
      renderSession();

      await act(() => vi.advanceTimersByTimeAsync(1));
      await settleRequests();
      expect(attempts).toBe(1);

      await act(() => vi.advanceTimersByTimeAsync(4 * MINUTE_MS));
      await settleRequests();
      expect(attempts).toBe(1);

      await act(() => vi.advanceTimersByTimeAsync(2 * MINUTE_MS));
      await settleRequests();
      expect(attempts).toBe(2);
    });

    it("does not start a second renewal while one is in flight", async () => {
      storeRememberedSession(Date.now() + HOUR_MS);
      let attempts = 0;
      server.use(
        http.post(TOKEN_RENEWAL_URL, async () => {
          attempts += 1;
          await delay(30);
          return HttpResponse.json({
            access_token: jwtWithExpiry(Date.now() + 7 * DAY_MS),
            refresh_token: "refresh-1",
          });
        }),
      );
      renderSession();
      await act(() => new Promise((resolve) => setTimeout(resolve, 5)));

      act(() => {
        window.dispatchEvent(new Event("online"));
      });
      await settleRequests();

      expect(attempts).toBe(1);
    });

    it("hides the customer at expiry but keeps the session while renewal keeps failing", async () => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
      const accessToken = storeRememberedSession(Date.now() + 30 * 60 * 1000);
      server.use(http.post(TOKEN_RENEWAL_URL, () => HttpResponse.error()));
      renderSession();
      expect(screen.getByText("42")).toBeTruthy();

      await act(() => vi.advanceTimersByTimeAsync(31 * 60 * 1000));

      expect(screen.getByText("signed-out")).toBeTruthy();
      expect(storedSession()?.accessToken).toBe(accessToken);
    });

    it("signs out at expiry and clears a session without a refresh token", async () => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
      window.localStorage.setItem(
        "hb-stunder.session",
        JSON.stringify({
          accessToken: jwtWithExpiry(Date.now() + HOUR_MS),
          customerId: "42",
          displayName: "Test Member",
        }),
      );
      renderSession();
      expect(screen.getByText("42")).toBeTruthy();

      await act(() => vi.advanceTimersByTimeAsync(HOUR_MS + 1000));

      expect(screen.getByText("signed-out")).toBeTruthy();
      expect(storedSession()).toBeNull();
    });

    it("stays signed in with a token too long-lived for a single timer", async () => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
      storeRememberedSession(Date.now() + 60 * DAY_MS);
      const { requests } = respondWithRenewedToken();
      renderSession();

      await act(() => vi.advanceTimersByTimeAsync(1000));

      expect(screen.getByText("42")).toBeTruthy();
      expect(requests).toHaveLength(0);
    });

    it("does not restore a session the customer signed out of during renewal", async () => {
      storeRememberedSession(Date.now() + HOUR_MS);
      server.use(
        http.post(TOKEN_RENEWAL_URL, async () => {
          await delay(30);
          return HttpResponse.json({
            access_token: jwtWithExpiry(Date.now() + 7 * DAY_MS),
            refresh_token: "refresh-1",
          });
        }),
      );
      renderSession();
      await act(() => new Promise((resolve) => setTimeout(resolve, 5)));

      fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
      await settleRequests();

      expect(screen.getByText("signed-out")).toBeTruthy();
      expect(storedSession()).toBeNull();
    });

    it("follows a sign-out in another tab when renewal returns", async () => {
      storeRememberedSession(Date.now() + HOUR_MS);
      server.use(
        http.post(TOKEN_RENEWAL_URL, async () => {
          await delay(30);
          return HttpResponse.json({
            access_token: jwtWithExpiry(Date.now() + 7 * DAY_MS),
            refresh_token: "refresh-1",
          });
        }),
      );
      renderSession();
      await act(() => new Promise((resolve) => setTimeout(resolve, 5)));

      window.localStorage.removeItem("hb-stunder.session");
      await settleRequests();

      expect(screen.getByText("signed-out")).toBeTruthy();
      expect(storedSession()).toBeNull();
    });
  });
});
