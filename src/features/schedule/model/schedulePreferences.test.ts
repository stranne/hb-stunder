// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { readSchedulePreferencesResult, writeSavedSearches } from "./schedulePreferences";

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
        savedSearches: [],
      },
    });
  });

  it("retains valid searches and reports malformed stored entries", () => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        version: 2,
        favoriteInstructorIds: [],
        favoriteActivityTypeIds: [],
        savedSearches: [
          {
            version: 1,
            id: "valid",
            name: " Yoga ",
            criteria: { businessUnitIds: [1, 1], instructorIds: [2], activityTypeIds: [3] },
          },
          { id: "broken" },
        ],
      }),
    );

    const result = readSchedulePreferencesResult();
    expect(result.issue).toBe("malformed");
    expect(result.preferences.savedSearches).toEqual([
      {
        version: 1,
        id: "valid",
        name: "Yoga",
        criteria: { businessUnitIds: [1], instructorIds: [2], activityTypeIds: [3] },
      },
    ]);
  });

  it("rejects malformed wildcard criteria and does not overwrite newer versions", () => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        version: 2,
        savedSearches: [
          {
            version: 1,
            id: "unsafe",
            name: "Unsafe wildcard",
            criteria: { businessUnitIds: [1] },
          },
        ],
      }),
    );
    expect(readSchedulePreferencesResult()).toMatchObject({
      issue: "malformed",
      preferences: { savedSearches: [] },
    });

    const newerPayload = JSON.stringify({ version: 99, futurePreferences: true });
    window.localStorage.setItem(storageKey, newerPayload);
    expect(writeSavedSearches([])).toBe(false);
    expect(window.localStorage.getItem(storageKey)).toBe(newerPayload);
  });

  it("reports storage failures without throwing", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });

    expect(writeSavedSearches([])).toBe(false);
  });
});
