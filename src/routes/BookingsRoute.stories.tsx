import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { expect, within } from "storybook/test";
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

const play: Story["play"] = async ({ canvasElement }) => {
  const links = within(canvasElement).getAllByRole("link");
  await expect(links.filter((link) => link.getAttribute("aria-current") === "page")).toEqual([
    expect.objectContaining({ textContent: "Mina bokningar" }),
  ]);
};

export const SignedIn: Story = { play };

export const SignedOut: Story = {
  parameters: { session: { initiallySignedIn: false } },
  play,
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
  play,
};
