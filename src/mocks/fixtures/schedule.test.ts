import { describe, expect, it } from "vite-plus/test";
import { addDays } from "../../features/schedule/model/scheduleDate";
import { mockActivityProducts, mockInstructors, scheduleForDate } from "./schedule";

function bookedSlots(date: string, businessUnit: number, today: string) {
  return scheduleForDate(date, businessUnit, today).reduce(
    (total, activity) =>
      total + (activity.slots?.totalBookable ?? 0) - (activity.slots?.leftToBook ?? 0),
    0,
  );
}

describe("mock schedule", () => {
  const today = "2026-07-27";

  it("gives every location its own recurring weekday schedule", () => {
    const date = "2026-07-28";
    const nextWeek = addDays(date, 7);
    const haga = scheduleForDate(date, 1, today);
    const drottningtorget = scheduleForDate(date, 4128, today);
    const alvstranden = scheduleForDate(date, 3509, today);

    expect(haga.map(({ name }) => name)).not.toEqual(drottningtorget.map(({ name }) => name));
    expect(drottningtorget.map(({ name }) => name)).not.toEqual(
      alvstranden.map(({ name }) => name),
    );
    expect(scheduleForDate(nextWeek, 1, today).map(({ name }) => name)).toEqual(
      haga.map(({ name }) => name),
    );
    expect(haga.every(({ businessUnit }) => businessUnit?.name === "Hagabadet i Haga")).toBe(true);
    expect(
      haga.every(({ businessUnit, locations }) =>
        locations?.every(({ name }) => Boolean(name) && name !== businessUnit?.name),
      ),
    ).toBe(true);
  });

  it("only creates bookings in the rolling seven-day booking window", () => {
    expect(bookedSlots(addDays(today, -1), 1, today)).toBe(0);
    expect(bookedSlots(addDays(today, 8), 1, today)).toBe(0);
    expect(bookedSlots(addDays(today, 1), 1, today)).toBeGreaterThan(0);
  });

  it("leaves the VIP-only end of the window with more availability", () => {
    const soon = bookedSlots(addDays(today, 1), 1, today);
    const vipOnly = bookedSlots(addDays(today, 6), 1, today);

    expect(soon).toBeGreaterThan(vipOnly);
  });

  it("offers a broader filter catalog backed by scheduled classes", () => {
    const week = Array.from({ length: 7 }, (_, day) =>
      [1, 4128, 3509].flatMap((location) => scheduleForDate(addDays(today, day), location, today)),
    ).flat();
    const scheduledProducts = new Set(
      week.map(({ groupActivityProduct }) => groupActivityProduct?.id),
    );
    const scheduledInstructors = new Set(
      week.flatMap(({ instructors }) => instructors?.map(({ id }) => id) ?? []),
    );

    expect(mockActivityProducts).toHaveLength(16);
    expect(mockInstructors).toHaveLength(27);
    expect(new Set(mockInstructors.map(({ name }) => name)).size).toBe(27);
    expect(scheduledProducts).toEqual(new Set(mockActivityProducts.map(({ id }) => id)));
    expect(scheduledInstructors).toEqual(new Set(mockInstructors.map(({ id }) => id)));
  });
});
