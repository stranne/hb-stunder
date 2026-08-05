import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { bookingsRoute } from "../app/router";

const meta = {
  title: "Application/Pages/My bookings/In application",
  parameters: {
    layout: "fullscreen",
    tanstack: {
      router: { route: bookingsRoute },
    },
    session: { initiallySignedIn: true },
  },
} satisfies Meta<typeof bookingsRoute>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedIn: Story = {};

export const SignedOut: Story = {
  parameters: { session: { initiallySignedIn: false } },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
};
