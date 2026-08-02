// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import i18n from "../../i18n";
import { UserMenu } from "./UserMenu";

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

afterEach(cleanup);

describe("UserMenu", () => {
  it("shows the signed-in customer and signs out from the expanded section", () => {
    const onSignOut = vi.fn();
    render(
      <UserMenu
        customer={{ customerId: "900001", displayName: "Anna Andersson" }}
        canSignIn
        onSignIn={vi.fn()}
        onSignOut={onSignOut}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open user menu for Anna Andersson" }));

    expect(screen.getByText("Signed in as")).toBeTruthy();
    expect(screen.getAllByText("Anna Andersson")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it("offers sign-in directly when there is no customer", () => {
    render(<UserMenu canSignIn onSignIn={vi.fn()} onSignOut={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByRole("heading", { name: "Sign in to Hagabadet" })).toBeTruthy();
  });
});
