// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { useSession } from "../features/auth/sessionContext";
import { MockSessionProvider } from "./MockSessionProvider";

function SessionStatus() {
  const { customer, signIn, signOut } = useSession();
  return (
    <>
      <p>{customer?.customerId ?? "signed-out"}</p>
      <button type="button" onClick={() => void signIn({ username: "demo", password: "password" })}>
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

describe("MockSessionProvider", () => {
  it("persists an explicit mock session and clears it on sign-out", () => {
    const view = render(
      <MockSessionProvider>
        <SessionStatus />
      </MockSessionProvider>,
    );

    expect(screen.getByText("signed-out")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByText("900001")).toBeTruthy();

    view.unmount();
    render(
      <MockSessionProvider>
        <SessionStatus />
      </MockSessionProvider>,
    );
    expect(screen.getByText("900001")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(screen.getByText("signed-out")).toBeTruthy();
  });

  it("does not touch a stored real session", () => {
    window.localStorage.setItem("hb-stunder.session", "real-session");

    render(
      <MockSessionProvider initiallySignedIn>
        <SessionStatus />
      </MockSessionProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(window.localStorage.getItem("hb-stunder.session")).toBe("real-session");
  });
});
