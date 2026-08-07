import { describe, expect, it } from "vite-plus/test";
import type { SavedSearch } from "./savedSearch";
import { applySavedSearch, matchesSavedSearch } from "./savedSearch";

const savedSearch: SavedSearch = {
  version: 1,
  id: "morning-yoga",
  name: "Morning yoga",
  criteria: {
    businessUnitIds: [1, 2],
    instructorIds: [10, 11],
    activityTypeIds: [20, 21],
  },
};

describe("saved-search matching", () => {
  it("does not restrict candidates for empty categories", () => {
    expect(
      matchesSavedSearch(
        { businessUnitId: 99, instructorIds: [], activityTypeId: 88 },
        {
          ...savedSearch,
          criteria: { businessUnitIds: [], instructorIds: [], activityTypeIds: [] },
        },
      ),
    ).toBe(true);
  });

  it("uses OR between values in the same category", () => {
    expect(
      matchesSavedSearch(
        { businessUnitId: 2, instructorIds: [11], activityTypeId: 21 },
        savedSearch,
      ),
    ).toBe(true);
  });

  it("uses AND between populated categories", () => {
    expect(
      matchesSavedSearch(
        { businessUnitId: 2, instructorIds: [11], activityTypeId: 99 },
        savedSearch,
      ),
    ).toBe(false);
    expect(
      matchesSavedSearch(
        { businessUnitId: 99, instructorIds: [11], activityTypeId: 21 },
        savedSearch,
      ),
    ).toBe(false);
  });

  it("activates one search by replacing category selections and preserving presentation state", () => {
    expect(
      applySavedSearch(
        {
          date: "2026-08-07",
          locations: [99],
          instructors: [98],
          activityTypes: [97],
          view: "rooms",
          filters: true,
        },
        savedSearch,
      ),
    ).toEqual({
      date: "2026-08-07",
      locations: [1, 2],
      instructors: [10, 11],
      activityTypes: [20, 21],
      view: "rooms",
      filters: true,
    });
  });
});
