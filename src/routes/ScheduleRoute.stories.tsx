import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { expect, within } from "storybook/test";
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

export const Classes: Story = {
  play: async ({ canvasElement }) => {
    const links = within(canvasElement).getAllByRole("link");
    await expect(links.filter((link) => link.getAttribute("aria-current") === "page")).toEqual([
      expect.objectContaining({ textContent: "Klasser" }),
    ]);
  },
};

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
  play: async ({ canvasElement }) => {
    const links = within(canvasElement).getAllByRole("link");
    await expect(links.filter((link) => link.getAttribute("aria-current") === "page")).toEqual([
      expect.objectContaining({ textContent: "Rum" }),
    ]);
  },
};

export const ClassesMobile: Story = {
  ...Classes,
  globals: { viewport: { value: "mobile", isRotated: false } },
};

export const RoomsMobile: Story = {
  ...Rooms,
  globals: { viewport: { value: "mobile", isRotated: false } },
};
