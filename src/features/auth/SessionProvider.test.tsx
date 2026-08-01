// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { SessionProvider } from "./SessionProvider";
import { useSession } from "./sessionContext";

function SessionStatus() {
  const { customer, canSignIn, signIn, signOut } = useSession();
  return (
    <>
      <p>{customer?.customerId ?? "signed-out"}</p>
      <p>{canSignIn ? "available" : "unavailable"}</p>
      <button type="button" onClick={signIn}>
        Sign in
      </button>
      <button type="button" onClick={signOut}>
        Sign out
      </button>
    </>
  );
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

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

  it("cannot sign in when mock mode is unavailable", () => {
    render(
      <SessionProvider mockEnabled={false}>
        <SessionStatus />
      </SessionProvider>,
    );

    expect(screen.getByText("unavailable")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByText("signed-out")).toBeTruthy();
  });
});
