import { describe, expect, it } from "vite-plus/test";
import { getAvailability } from "./schedule";
import { getStockholmDayPeriod, isDateString } from "./scheduleDate";
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
    expect(parseScheduleSearch({ date: "2026-07-28", location: "4128" })).toEqual({
      date: "2026-07-28",
      location: 4128,
    });
  });
});
