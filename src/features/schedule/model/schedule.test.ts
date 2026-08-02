import { describe, expect, it } from "vite-plus/test";
import { getAvailability, groupActivitiesByStart } from "./schedule";
import { addDays, getStockholmDayPeriod, isDateString } from "./scheduleDate";
import { parseScheduleSearch } from "./scheduleSearch";

describe("schedule model", () => {
  it("derives the main availability states", () => {
    expect(getAvailability({ slots: { leftToBook: 8 } })).toEqual({
      kind: "available",
      remaining: 8,
    });
    expect(getAvailability({ slots: { leftToBook: 2 } })).toEqual({
      kind: "almostFull",
      remaining: 2,
    });
    expect(getAvailability({ slots: { leftToBook: 0, hasWaitingList: true } })).toEqual({
      kind: "waitingList",
    });
    expect(getAvailability({ cancelled: true })).toEqual({ kind: "cancelled" });
  });

  it("moves between calendar days across month, year, and daylight-saving boundaries", () => {
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-29", -1)).toBe("2026-03-28");
  });

  it("creates Stockholm day boundaries across daylight-saving changes", () => {
    expect(getStockholmDayPeriod("2026-03-29")).toEqual({
      start: "2026-03-28T23:00:00.000Z",
      end: "2026-03-29T22:00:00.000Z",
    });
    expect(getStockholmDayPeriod("2026-10-25")).toEqual({
      start: "2026-10-24T22:00:00.000Z",
      end: "2026-10-25T23:00:00.000Z",
    });
  });

  it("validates route search values", () => {
    expect(isDateString("2026-02-29")).toBe(false);
    expect(
      parseScheduleSearch({
        date: "2026-07-28",
        locations: "[1,4128]",
        instructors: "21,25",
        activityTypes: [201, "203"],
      }),
    ).toEqual({
      date: "2026-07-28",
      locations: [1, 4128],
      instructors: [21, 25],
      activityTypes: [201, 203],
      view: "classes",
    });
    expect(parseScheduleSearch({ view: "rooms" }).view).toBe("rooms");
  });

  it("groups classes by their exact start time without changing order inside a group", () => {
    const grouped = groupActivitiesByStart([
      { id: 1, duration: { start: "2026-07-28T08:00:00.000Z" } },
      { id: 2, duration: { start: "2026-07-28T08:00:00.000Z" } },
      { id: 3, duration: { start: "2026-07-28T09:00:00.000Z" } },
    ]);
    expect(grouped.map(({ start, activities }) => [start, activities.map(({ id }) => id)])).toEqual(
      [
        ["2026-07-28T08:00:00.000Z", [1, 2]],
        ["2026-07-28T09:00:00.000Z", [3]],
      ],
    );
  });
});
