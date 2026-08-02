import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { expect, userEvent, within } from "storybook/test";
import { SignInAction } from "./SignInAction";

async function openDialog(canvasElement: HTMLElement) {
  await userEvent.click(within(canvasElement).getByRole("button", { name: "Logga in" }));
  return within(canvasElement.ownerDocument.body).findByRole("dialog");
}

async function submitCredentials(canvasElement: HTMLElement) {
  const dialog = within(await openDialog(canvasElement));
  await userEvent.type(
    dialog.getByRole("textbox", { name: "Användarnamn" }),
    "customer@example.com",
  );
  await userEvent.type(dialog.getByLabelText("Lösenord"), "password");
  await userEvent.click(dialog.getByRole("button", { name: "Logga in" }));
}

const meta = {
  title: "Auth/SignInAction",
  component: SignInAction,
  args: {
    onSignIn: async (): Promise<void> => undefined,
  },
  parameters: { layout: "centered" },
} satisfies Meta<typeof SignInAction>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DialogOpen: Story = {
  play: async ({ canvasElement }) => {
    await expect(await openDialog(canvasElement)).toBeVisible();
  },
};

export const Remembered: Story = {
  play: async ({ canvasElement }) => {
    const dialog = within(await openDialog(canvasElement));
    const remember = dialog.getByRole("checkbox", {
      name: /Håll mig inloggad på den här enheten/,
    });
    await userEvent.click(remember);
    await expect(remember).toBeChecked();
  },
};

export const Pending: Story = {
  args: { onSignIn: () => new Promise<void>(() => undefined) },
  play: async ({ canvasElement }) => {
    await submitCredentials(canvasElement);
    await expect(within(canvasElement.ownerDocument.body).getByRole("status")).toHaveTextContent(
      "Loggar in…",
    );
  },
};

export const Error: Story = {
  args: {
    onSignIn: async () => {
      throw new globalThis.Error("Mock sign-in failure");
    },
  },
  play: async ({ canvasElement }) => {
    await submitCredentials(canvasElement);
    await expect(within(canvasElement.ownerDocument.body).getByRole("alert")).toHaveTextContent(
      "Inloggningen misslyckades",
    );
  },
};

export const QuietTrigger: Story = { args: { tone: "quiet" } };

export const English: Story = {
  globals: { locale: "en" },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Sign in" }));
    await expect(
      within(canvasElement.ownerDocument.body).getByRole("heading", {
        name: "Sign in to Hagabadet",
      }),
    ).toBeVisible();
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
  play: async ({ canvasElement }) => {
    await expect(await openDialog(canvasElement)).toBeVisible();
  },
};
