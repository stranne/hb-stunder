import { http, HttpResponse } from "msw";
import { API_BASE_URL } from "../../api/client";
import type { GroupActivityBooking } from "../../features/bookings/model/bookings";
import { mockCustomerBookings } from "../fixtures/bookings";
import { MOCK_CUSTOMER_ID } from "../mockSession";

let customerBookings: GroupActivityBooking[] = [];
let nextBookingId = 800001;

export function resetMockBookingState() {
  customerBookings = structuredClone(mockCustomerBookings);
  nextBookingId = 800001;
}

resetMockBookingState();

function isCreateBookingBody(
  value: unknown,
): value is { groupActivity: number; allowWaitingList: boolean } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const body = value as Record<string, unknown>;
  const keys = Object.keys(body);
  return (
    keys.length === 2 &&
    keys.includes("groupActivity") &&
    keys.includes("allowWaitingList") &&
    Number.isInteger(body.groupActivity) &&
    Number(body.groupActivity) > 0 &&
    typeof body.allowWaitingList === "boolean"
  );
}

export const bookingHandlers = [
  http.get(`${API_BASE_URL}/customers/:customerId/bookings/groupactivities`, ({ params }) => {
    if (params.customerId !== MOCK_CUSTOMER_ID) {
      return HttpResponse.json({ message: "Mock customer not found" }, { status: 404 });
    }

    return HttpResponse.json(customerBookings);
  }),
  http.delete(
    `${API_BASE_URL}/customers/:customerId/bookings/groupactivities/:bookingId`,
    ({ request, params }) => {
      if (params.customerId !== MOCK_CUSTOMER_ID) {
        return HttpResponse.json({ message: "Mock customer not found" }, { status: 404 });
      }

      if (new URL(request.url).searchParams.get("bookingType") !== "groupActivityBooking") {
        return HttpResponse.json({ message: "Invalid booking type" }, { status: 400 });
      }

      const bookingIndex = customerBookings.findIndex(
        (booking) =>
          booking.type === "groupActivityBooking" &&
          String(booking.groupActivityBooking?.id) === params.bookingId,
      );
      if (bookingIndex === -1) {
        return HttpResponse.json({ message: "Mock booking not found" }, { status: 404 });
      }

      customerBookings.splice(bookingIndex, 1);
      return new HttpResponse(null, { status: 204 });
    },
  ),
  http.post(
    `${API_BASE_URL}/customers/:customerId/bookings/groupactivities`,
    async ({ request, params }) => {
      if (params.customerId !== MOCK_CUSTOMER_ID) {
        return HttpResponse.json({ message: "Mock customer not found" }, { status: 404 });
      }

      const body: unknown = await request.json().catch(() => undefined);
      if (!isCreateBookingBody(body)) {
        return HttpResponse.json({ message: "Invalid booking request" }, { status: 400 });
      }

      customerBookings.push({
        customer: { id: Number(MOCK_CUSTOMER_ID), firstName: "Mock", lastName: "Customer" },
        groupActivity: { id: body.groupActivity },
        groupActivityBooking: { id: nextBookingId++ },
        type: body.allowWaitingList ? "groupActivityWaitingListBooking" : "groupActivityBooking",
      });

      return new HttpResponse(null, { status: 201 });
    },
  ),
];
