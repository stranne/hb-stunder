import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { indexRoute } from "../app/router";

const meta = {
  title: "Application/Pages/Schedule/In application",
  parameters: {
    layout: "fullscreen",
    tanstack: {
      router: {
        route: indexRoute,
        query: {
          date: "2026-07-28",
          locations: [1, 4128, 3509],
          instructors: [],
          activityTypes: [],
        },
      },
    },
  },
} satisfies Meta<typeof indexRoute>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Classes: Story = {};

export const Rooms: Story = {
  parameters: {
    tanstack: {
      router: {
        route: indexRoute,
        query: {
          date: "2026-07-28",
          locations: [1, 4128, 3509],
          instructors: [],
          activityTypes: [],
          view: "rooms",
        },
      },
    },
  },
};

export const ClassesMobile: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
};

export const RoomsMobile: Story = {
  ...Rooms,
  globals: { viewport: { value: "mobile", isRotated: false } },
};
