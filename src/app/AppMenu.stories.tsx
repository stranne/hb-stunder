import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { fn, userEvent, within } from "storybook/test";
import { AppMenu } from "./AppMenu";

const meta = {
  title: "App/App menu",
  component: AppMenu,
  args: {
    customer: { customerId: "900001", displayName: "Anna Andersson" },
    canSignIn: true,
    onSignIn: fn(),
    onSignOut: fn(),
  },
  parameters: { layout: "centered" },
} satisfies Meta<typeof AppMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedIn: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button"));
  },
};
export const SignedInWithoutName: Story = { args: { customer: { customerId: "900001" } } };
export const SignedOut: Story = {
  args: { customer: undefined },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button"));
  },
};
export const SignInUnavailable: Story = {
  args: { customer: undefined, canSignIn: false },
};
export const English: Story = { globals: { locale: "en" } };
export const Mobile: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
};
