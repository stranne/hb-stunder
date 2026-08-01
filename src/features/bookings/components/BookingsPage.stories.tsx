import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { delay, http, HttpResponse } from "msw";
import { API_BASE_URL } from "../../../api/client";
import { mockCustomerBookings } from "../../../mocks/fixtures/bookings";
import { MOCK_CUSTOMER_ID } from "../../../mocks/mockSession";
import { BookingsPage } from "./BookingsPage";

const endpoint = `${API_BASE_URL}/customers/:customerId/bookings/groupactivities`;

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
