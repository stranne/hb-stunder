import { describe, expect, it } from "vite-plus/test";
import { bookingsByActivityId, type GroupActivityBooking } from "./bookings";

const bookings: GroupActivityBooking[] = [
  { groupActivity: { id: 101 }, groupActivityBooking: { id: 701 } },
  { groupActivityBooking: { id: 702 } },
];

describe("bookingsByActivityId", () => {
  it("indexes bookings with observed schedule activity IDs", () => {
    const indexed = bookingsByActivityId(bookings);

    expect(indexed.get(101)).toBe(bookings[0]);
    expect(indexed.size).toBe(1);
  });
});
