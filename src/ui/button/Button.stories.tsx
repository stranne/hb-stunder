import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";

const meta = {
  title: "UI primitives/Button",
  component: Button,
  args: { children: "Continue" },
  parameters: { layout: "centered" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Accent: Story = {};
export const Quiet: Story = { args: { tone: "quiet" } };
export const Disabled: Story = { args: { isDisabled: true } };
