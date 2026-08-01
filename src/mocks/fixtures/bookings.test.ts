import { describe, expect, it } from "vite-plus/test";
import { todayInStockholm } from "../../features/schedule/model/scheduleDate";
import { scheduleForDate } from "./schedule";
import { customerBookingFixtures, mockCustomerBookings } from "./bookings";

describe("booking fixtures", () => {
  it("includes a booking matched to today's schedule and an upcoming ordinary booking", () => {
    const today = todayInStockholm();
    const scheduleIds = new Set(scheduleForDate(today, 1).map(({ id }) => id));

    expect(scheduleIds.has(customerBookingFixtures.scheduleMatch.groupActivity?.id)).toBe(true);
    const upcomingDate = customerBookingFixtures.upcomingOrdinary.duration?.start?.slice(0, 10);
    expect(upcomingDate).toBeDefined();
    expect(upcomingDate! > today).toBe(true);
    expect(mockCustomerBookings).toHaveLength(2);
  });
});
