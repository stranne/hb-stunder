import type { GroupActivityBooking } from "../../features/bookings/model/bookings";
import { todayInStockholm } from "../../features/schedule/model/scheduleDate";
import { MOCK_CUSTOMER_ID } from "../mockSession";
import { scheduleForDate } from "./schedule";

function nextDate(date: string) {
  const value = new Date(`${date}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
}

function bookingForActivity(
  activity: ReturnType<typeof scheduleForDate>[number] | undefined,
  bookingId: number,
): GroupActivityBooking {
  if (!activity?.id) {
    throw new Error("The mock schedule must contain an activity for the mock booking");
  }

  return {
    businessUnit: activity.businessUnit,
    customer: { id: Number(MOCK_CUSTOMER_ID), firstName: "Mock", lastName: "Customer" },
    duration: activity.duration,
    groupActivity: { id: activity.id, name: activity.name },
    groupActivityBooking: { id: bookingId },
    type: "groupActivityBooking",
  };
}

const today = todayInStockholm();
const bookedToday = scheduleForDate(today, 1)[0];
const upcomingActivity = scheduleForDate(nextDate(today), 1)[0];

export const customerBookingFixtures = {
  scheduleMatch: bookingForActivity(bookedToday, 700001),
  upcomingOrdinary: bookingForActivity(upcomingActivity, 700002),
} satisfies Record<string, GroupActivityBooking>;

export const mockCustomerBookings: GroupActivityBooking[] = Object.values(customerBookingFixtures);
