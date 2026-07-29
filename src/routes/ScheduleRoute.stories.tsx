import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { indexRoute } from "../app/router";

const meta = {
  title: "Routes/Schedule",
  parameters: {
    layout: "fullscreen",
    tanstack: {
      router: {
        route: indexRoute,
        query: { date: "2026-07-28", location: 1 },
      },
    },
  },
} satisfies Meta<typeof indexRoute>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Mobile: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
};
