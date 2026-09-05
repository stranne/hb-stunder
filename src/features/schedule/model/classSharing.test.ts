import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import type { ScheduledActivity } from "./schedule";
import { classShareUrl } from "./classSharing";

const activity = {
  id: 123,
  name: "Yinyoga",
  businessUnit: { id: 1, name: "Hagabadet i Haga" },
  duration: {
    start: "2026-07-28T22:30:00.000Z",
    end: "2026-07-28T23:30:00.000Z",
  },
} satisfies ScheduledActivity;

describe("classShareUrl", () => {
  afterEach(() => vi.unstubAllEnvs());

  it.each(["/", "/hb-stunder/"])("links from My bookings to the schedule under %s", (basePath) => {
    vi.stubEnv("BASE_URL", basePath);
    const result = new URL(
      classShareUrl(activity, "classes", `https://example.test${basePath}bookings`),
    );
    expect(result.pathname).toBe(basePath);
    expect(result.searchParams.get("activity")).toBe("123");
    expect(result.searchParams.get("date")).toBe("2026-07-29");
  });

  it("creates a filter-independent deep link in the requested view", () => {
    const result = new URL(
      classShareUrl(
        activity,
        "rooms",
        "https://example.test/?locations=%5B4128%5D&instructors=%5B21%5D&activityTypes=%5B3%5D#old",
      ),
    );

    expect(result.origin + result.pathname).toBe("https://example.test/");
    expect(Object.fromEntries(result.searchParams)).toEqual({
      date: "2026-07-29",
      locations: "[1]",
      activity: "123",
      view: "rooms",
    });
    expect(result.hash).toBe("");
  });
});
