import { describe, expect, it } from "vite-plus/test";
import {
  getActivityState,
  getAvailability,
  groupActivitiesByStart,
  hasActivityEnded,
  hasActivityStarted,
} from "./schedule";
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

  it("derives shared booking and participant state", () => {
    const activity = {
      duration: {
        start: "2026-07-28T08:00:00.000Z",
        end: "2026-07-28T09:00:00.000Z",
      },
      slots: { totalBookable: 20, leftToBook: 4 },
    };

    expect(getActivityState(activity, Date.parse("2026-07-28T07:59:59.999Z"))).toMatchObject({
      canBook: true,
      hasStarted: false,
      participantCount: 16,
    });
    expect(getActivityState(activity, Date.parse("2026-07-28T08:00:00.000Z"))).toMatchObject({
      canBook: false,
      hasStarted: true,
      hasEnded: false,
      participantCount: 16,
    });
  });

  it("only permits booking inside the activity booking window", () => {
    const activity = {
      duration: {
        start: "2026-07-28T08:00:00.000Z",
        end: "2026-07-28T09:00:00.000Z",
      },
      bookableEarliest: "2026-07-21T08:00:00.000Z",
      bookableLatest: "2026-07-28T07:30:00.000Z",
      slots: { totalBookable: 20, leftToBook: 4 },
    };

    expect(getActivityState(activity, Date.parse("2026-07-21T07:59:59.999Z")).canBook).toBe(false);
    expect(getActivityState(activity, Date.parse("2026-07-21T08:00:00.000Z")).canBook).toBe(true);
    expect(getActivityState(activity, Date.parse("2026-07-28T07:30:00.001Z")).canBook).toBe(false);
  });

  it("recognizes activity boundaries at their exact times", () => {
    const activity = {
      duration: {
        start: "2026-07-28T08:00:00.000Z",
        end: "2026-07-28T09:00:00.000Z",
      },
    };

    expect(hasActivityStarted(activity, Date.parse("2026-07-28T07:59:59.999Z"))).toBe(false);
    expect(hasActivityStarted(activity, Date.parse("2026-07-28T08:00:00.000Z"))).toBe(true);
    expect(hasActivityEnded(activity, Date.parse("2026-07-28T08:59:59.999Z"))).toBe(false);
    expect(hasActivityEnded(activity, Date.parse("2026-07-28T09:00:00.000Z"))).toBe(true);
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
