import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { fn } from "storybook/test";
import { UserMenu } from "./UserMenu";

const meta = {
  title: "Auth/UserMenu",
  component: UserMenu,
  args: {
    customer: { customerId: "900001", displayName: "Anna Andersson" },
    canSignIn: true,
    onSignIn: fn(),
    onSignOut: fn(),
  },
  parameters: { layout: "centered" },
} satisfies Meta<typeof UserMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedIn: Story = {};
export const SignedInWithoutName: Story = { args: { customer: { customerId: "900001" } } };
export const SignedOut: Story = { args: { customer: undefined } };
export const Mobile: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
};
