// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { readSchedulePreferencesResult, writeFavoriteFilters } from "./schedulePreferences";

const storageKey = "hb-stunder.schedule-preferences";

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("schedule preferences", () => {
  it("migrates version 1 preferences without losing existing values", () => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        version: 1,
        favoriteInstructorIds: [2],
        favoriteActivityTypeIds: [3],
        lastUsed: { locations: [1], instructors: [2], activityTypes: [3] },
      }),
    );

    expect(readSchedulePreferencesResult()).toEqual({
      preferences: {
        version: 2,
        favoriteInstructorIds: [2],
        favoriteActivityTypeIds: [3],
        lastUsed: { locations: [1], instructors: [2], activityTypes: [3] },
      },
    });
  });

  it("ignores saved searches left by an earlier application version", () => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        version: 2,
        favoriteInstructorIds: [2],
        favoriteActivityTypeIds: [3],
        savedSearches: [{ id: "old-search" }],
      }),
    );

    expect(readSchedulePreferencesResult()).toEqual({
      preferences: {
        version: 2,
        favoriteInstructorIds: [2],
        favoriteActivityTypeIds: [3],
      },
    });
  });

  it("does not overwrite preferences from a newer application version", () => {
    const newerPayload = JSON.stringify({ version: 99, futurePreferences: true });
    window.localStorage.setItem(storageKey, newerPayload);

    expect(writeFavoriteFilters([], [])).toBe(false);
    expect(window.localStorage.getItem(storageKey)).toBe(newerPayload);
  });

  it("reports storage failures without throwing", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });

    expect(writeFavoriteFilters([], [])).toBe(false);
  });
});
