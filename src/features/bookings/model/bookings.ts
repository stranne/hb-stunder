import type { components } from "../../../api/generated/schema";

export type GroupActivityBooking = components["schemas"]["GroupActivityBooking"];

export function bookingsByActivityId(bookings: GroupActivityBooking[]) {
  const byActivityId = new Map<number, GroupActivityBooking>();

  for (const booking of bookings) {
    if (booking.groupActivity?.id !== undefined) {
      byActivityId.set(booking.groupActivity.id, booking);
    }
  }

  return byActivityId;
}
