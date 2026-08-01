import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { expect, userEvent, within } from "storybook/test";
import { AsyncConfirmationAction } from "./AsyncConfirmationAction";

const meta = {
  title: "UI primitives/AsyncConfirmationAction",
  component: AsyncConfirmationAction,
  args: {
    triggerLabel: "Delete booking",
    title: "Delete booking?",
    message: "This action cannot be undone.",
    cancelLabel: "Cancel",
    confirmLabel: "Delete",
    retryLabel: "Try again",
    pendingMessage: "Deleting booking…",
    errorMessage: "The booking could not be deleted.",
    onConfirm: async (): Promise<void> => undefined,
  },
  parameters: { layout: "centered" },
} satisfies Meta<typeof AsyncConfirmationAction>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ConfirmationOpen: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Delete booking" }));
    await expect(within(canvasElement.ownerDocument.body).getByRole("dialog")).toBeVisible();
  },
};

export const Pending: Story = {
  args: { onConfirm: () => new Promise<void>(() => undefined) },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Delete booking" }));
    await userEvent.click(within(page.getByRole("dialog")).getByRole("button", { name: "Delete" }));
    await expect(page.getByRole("status")).toHaveTextContent("Deleting booking…");
  },
};

export const Error: Story = {
  args: {
    onConfirm: async () => {
      throw new globalThis.Error("Delete failed");
    },
  },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Delete booking" }));
    await userEvent.click(within(page.getByRole("dialog")).getByRole("button", { name: "Delete" }));
    await expect(page.getByRole("alert")).toHaveTextContent("The booking could not be deleted.");
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  },
};

export const QuietTrigger: Story = { args: { tone: "quiet" } };
