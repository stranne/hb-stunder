import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { Button } from "./Button";

const meta = {
  title: "Design system/Components/Button",
  component: Button,
  args: { children: "Continue" },
  parameters: { layout: "centered" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Accent: Story = {};
export const Secondary: Story = { args: { tone: "secondary" } };
export const Quiet: Story = { args: { tone: "quiet" } };
export const Danger: Story = { args: { children: "Cancel booking", tone: "danger" } };
export const Disabled: Story = { args: { isDisabled: true } };
