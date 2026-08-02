// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import "../../i18n";
import { SignInAction } from "./SignInAction";

afterEach(cleanup);

describe("SignInAction", () => {
  it("passes the explicit remember-me choice separately from the credentials", async () => {
    const onSignIn = vi.fn(async () => undefined);
    render(<SignInAction onSignIn={onSignIn} />);

    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    const dialog = within(await screen.findByRole("dialog"));
    fireEvent.change(dialog.getByRole("textbox", { name: "Username" }), {
      target: { value: "member" },
    });
    fireEvent.change(dialog.getByLabelText("Password"), { target: { value: "secret" } });
    fireEvent.click(dialog.getByRole("checkbox", { name: /Keep me signed in on this device/ }));
    fireEvent.click(dialog.getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(onSignIn).toHaveBeenCalledWith({ username: "member", password: "secret" }, true),
    );
  });
});
