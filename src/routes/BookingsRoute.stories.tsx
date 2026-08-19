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

const expectActiveBookingsLink = async (canvasElement: HTMLElement) => {
  const links = within(canvasElement).getAllByRole("link");
  await expect(links.filter((link) => link.getAttribute("aria-current") === "page")).toEqual([
    expect.objectContaining({ textContent: expect.stringContaining("Mina bokningar") }),
  ]);
};

const signedInPlay: Story["play"] = async ({ canvasElement }) => {
  await expectActiveBookingsLink(canvasElement);
  await expect(
    await within(canvasElement).findByRole("link", { name: "Mina bokningar 2 bokningar" }),
  ).toBeVisible();
};

export const SignedIn: Story = { play: signedInPlay };

export const SignedOut: Story = {
  parameters: { session: { initiallySignedIn: false } },
  play: async ({ canvasElement }) => expectActiveBookingsLink(canvasElement),
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
  play: signedInPlay,
};
