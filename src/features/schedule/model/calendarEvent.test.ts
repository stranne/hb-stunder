import { describe, expect, it } from "vite-plus/test";
import type { ScheduledActivity } from "./schedule";
import { activityCalendarContent } from "./calendarEvent";

describe("activityCalendarContent", () => {
  it("creates a portable UTC event with a stable identity and class link", () => {
    const activity = {
      id: 123,
      name: "Yoga, calm; focused",
      businessUnit: { id: 1, name: "Haga" },
      locations: [{ id: 18, name: "Yogastudio" }],
      instructors: [{ id: 21, name: "Alex Example" }],
      duration: {
        start: "2026-07-28T06:00:00.000Z",
        end: "2026-07-28T07:00:00.000Z",
      },
    } satisfies ScheduledActivity;

    const result = activityCalendarContent(
      activity,
      "https://example.test/?activity=123",
      new Date("2026-07-01T12:34:56.000Z"),
    );

    expect(result).toContain("UID:1-123-20260728T060000Z@hb-stunder\r\n");
    expect(result).toContain("DTSTAMP:20260701T123456Z\r\n");
    expect(result).toContain("DTSTART:20260728T060000Z\r\nDTEND:20260728T070000Z\r\n");
    expect(result).toContain("SUMMARY:Yoga\\, calm\\; focused\r\n");
    expect(result).toContain("LOCATION:Yogastudio\\, Haga\r\n");
    expect(result).toContain(
      "DESCRIPTION:Alex Example\\n\\nhttps://example.test/?activity=123\r\n",
    );
    expect(result).toContain("URL:https://example.test/?activity=123\r\n");
  });

  it("does not create an event without a complete time range", () => {
    expect(activityCalendarContent({ id: 123 }, "https://example.test/")).toBeUndefined();
  });
});
