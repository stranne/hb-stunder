import { http, HttpResponse } from "msw";
import { API_BASE_URL } from "../../api/client";
import { mockCustomerBookings } from "../fixtures/bookings";
import { MOCK_CUSTOMER_ID } from "../mockSession";

export const bookingHandlers = [
  http.get(`${API_BASE_URL}/customers/:customerId/bookings/groupactivities`, ({ params }) => {
    if (params.customerId !== MOCK_CUSTOMER_ID) {
      return HttpResponse.json({ message: "Mock customer not found" }, { status: 404 });
    }

    return HttpResponse.json(mockCustomerBookings);
  }),
];
