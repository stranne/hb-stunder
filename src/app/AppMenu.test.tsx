// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import i18n from "../i18n";
import { AppMenu } from "./AppMenu";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

afterEach(cleanup);

describe("AppMenu", () => {
  it("shows the signed-in customer and signs out from the account section", () => {
    const onSignOut = vi.fn();
    render(
      <AppMenu
        customer={{ customerId: "900001", displayName: "Anna Andersson" }}
        canSignIn
        onSignIn={vi.fn()}
        onSignOut={onSignOut}
      />,
    );

    expect(screen.queryByText("Anna Andersson")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Open menu for Anna Andersson" }));

    expect(screen.getByText("Language")).toBeTruthy();
    expect(screen.getByText("Signed in as")).toBeTruthy();
    expect(screen.getByText("Anna Andersson")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it("does not show an identification number when a name is unavailable", () => {
    render(
      <AppMenu
        customer={{ customerId: "900001" }}
        canSignIn
        onSignIn={vi.fn()}
        onSignOut={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.queryByText("900001")).toBeNull();
    expect(screen.queryByText("Signed in as")).toBeNull();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
  });

  it("offers sign-in inside the menu when there is no customer", async () => {
    render(<AppMenu canSignIn onSignIn={vi.fn()} onSignOut={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("heading", { name: "Sign in to Hagabadet" })).toBeTruthy();
  });

  it("changes language from the preference section", async () => {
    render(<AppMenu canSignIn onSignIn={vi.fn()} onSignOut={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    fireEvent.click(screen.getByRole("radio", { name: "Svenska" }));

    await waitFor(() => expect(i18n.resolvedLanguage).toBe("sv"));
    expect(document.documentElement.lang).toBe("sv");
    expect(screen.getByText("Språk")).toBeTruthy();
  });
});
