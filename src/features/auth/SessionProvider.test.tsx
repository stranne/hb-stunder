// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vite-plus/test";
import { REAL_API_BASE_URL } from "../../api/config";
import { SessionProvider } from "./SessionProvider";
import { useSession } from "./sessionContext";

const server = setupServer(
  http.post(`${REAL_API_BASE_URL}/auth/login`, () =>
    HttpResponse.json({
      access_token: jwtWithExpiry(Date.now() + 7 * 24 * 60 * 60 * 1000),
      customer: { id: 42, firstName: "Test", lastName: "Member" },
    }),
  ),
);

function jwtWithExpiry(expiresAt: number) {
  const payload = btoa(JSON.stringify({ exp: Math.floor(expiresAt / 1000), sub: "42" }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `header.${payload}.signature`;
}

function SessionStatus() {
  const { customer, canSignIn, signIn, signOut } = useSession();
  return (
    <>
      <p>{customer?.customerId ?? "signed-out"}</p>
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

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.sessionStorage.clear();
  server.resetHandlers();
});
afterAll(() => server.close());

describe("SessionProvider", () => {
  it("persists an explicit mock session and clears it on sign-out", () => {
    const view = render(
      <SessionProvider mockEnabled>
        <SessionStatus />
      </SessionProvider>,
    );

    expect(screen.getByText("signed-out")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByText("900001")).toBeTruthy();

    view.unmount();
    render(
      <SessionProvider mockEnabled>
        <SessionStatus />
      </SessionProvider>,
    );
    expect(screen.getByText("900001")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(screen.getByText("signed-out")).toBeTruthy();
  });

  it("stores a remembered real session persistently and restores it", async () => {
    const view = render(
      <SessionProvider mockEnabled={false}>
        <SessionStatus />
      </SessionProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Remember sign in" }));
    await waitFor(() => expect(screen.getByText("42")).toBeTruthy());
    expect(window.localStorage.getItem("hb-stunder.session")).toBeTruthy();
    expect(window.sessionStorage.getItem("hb-stunder.session")).toBeNull();

    view.unmount();
    render(
      <SessionProvider mockEnabled={false}>
        <SessionStatus />
      </SessionProvider>,
    );
    expect(screen.getByText("42")).toBeTruthy();
  });

  it("keeps real sessions temporary by default", async () => {
    render(
      <SessionProvider mockEnabled={false}>
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
      <SessionProvider mockEnabled={false}>
        <SessionStatus />
      </SessionProvider>,
    );

    expect(screen.getByText("signed-out")).toBeTruthy();
    expect(window.localStorage.getItem("hb-stunder.session")).toBeNull();
  });

  it("makes real sign-in available when mock mode is disabled", () => {
    render(
      <SessionProvider mockEnabled={false}>
        <SessionStatus />
      </SessionProvider>,
    );

    expect(screen.getByText("available")).toBeTruthy();
    expect(screen.getByText("signed-out")).toBeTruthy();
  });
});
