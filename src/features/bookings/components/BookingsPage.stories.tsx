import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { delay, http, HttpResponse } from "msw";
import { expect, userEvent, within } from "storybook/test";
import { API_BASE_URL } from "../../../api/client";
import { mockCustomerBookings } from "../../../mocks/fixtures/bookings";
import { MOCK_CUSTOMER_ID } from "../../../mocks/mockSession";
import { BookingsPage } from "./BookingsPage";

const endpoint = `${API_BASE_URL}/customers/:customerId/bookings/groupactivities`;
const cancellationEndpoint = `${endpoint}/:bookingId`;

function cancellationHandlers(fails = false) {
  let bookings = [...mockCustomerBookings];

  return [
    http.get(endpoint, () => HttpResponse.json(bookings)),
    http.delete(cancellationEndpoint, ({ params }) => {
      if (fails) return HttpResponse.json({ message: "Unavailable" }, { status: 503 });
      bookings = bookings.filter(
        ({ groupActivityBooking }) => groupActivityBooking?.id !== Number(params.bookingId),
      );
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}

const meta = {
  title: "Bookings/BookingsPage",
  component: BookingsPage,
  args: {
    customerId: MOCK_CUSTOMER_ID,
    canSignIn: true,
    onSignIn: () => undefined,
  },
  parameters: {
    layout: "fullscreen",
    msw: [http.get(endpoint, () => HttpResponse.json(mockCustomerBookings))],
  },
} satisfies Meta<typeof BookingsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CancellationConfirmation: Story = {
  parameters: { msw: cancellationHandlers() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getAllByRole("button", { name: "Avboka" })[0]!);
    await expect(page.getByRole("dialog")).toBeVisible();
  },
};

export const CancellationError: Story = {
  parameters: { msw: cancellationHandlers(true) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getAllByRole("button", { name: "Avboka" })[0]!);
    await userEvent.click(within(page.getByRole("dialog")).getByRole("button", { name: "Avboka" }));
    await expect(page.getByRole("alert")).toBeVisible();
  },
};

export const CancellationCompleted: Story = {
  parameters: { msw: cancellationHandlers() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const initialCount = canvas.getAllByRole("listitem").length;
    await userEvent.click(canvas.getAllByRole("button", { name: "Avboka" })[0]!);
    await userEvent.click(within(page.getByRole("dialog")).getByRole("button", { name: "Avboka" }));
    await expect(canvas.getAllByRole("listitem")).toHaveLength(initialCount - 1);
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
};

export const SignedOut: Story = {
  args: { customerId: undefined },
};

export const Empty: Story = {
  parameters: { msw: [http.get(endpoint, () => HttpResponse.json([]))] },
};

export const Loading: Story = {
  parameters: {
    msw: [
      http.get(endpoint, async () => {
        await delay("infinite");
        return HttpResponse.json([]);
      }),
    ],
  },
};

export const Error: Story = {
  parameters: {
    msw: [http.get(endpoint, () => HttpResponse.json({ message: "Unavailable" }, { status: 503 }))],
  },
};
