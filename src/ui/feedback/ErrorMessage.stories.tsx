import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { Button } from "../button/Button";
import { ErrorMessage } from "./ErrorMessage";

const meta = {
  title: "Design system/Components/Error message",
  component: ErrorMessage,
  args: {
    children: "Sign-in failed. Check your username and password and try again.",
  },
  parameters: { layout: "centered" },
} satisfies Meta<typeof ErrorMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAction: Story = {
  args: {
    children: "The schedule could not be loaded.",
    action: <Button>Try again</Button>,
  },
};

export const LongMessage: Story = {
  args: {
    children:
      "The class could not be booked. Your schedule has not changed. Check your connection and try again.",
  },
};
