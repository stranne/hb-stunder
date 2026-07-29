import type { ScheduleSearch } from "./scheduleSearch";

const STORAGE_KEY = "hb-stunder.schedule-preferences";

export interface StoredFilterSelection {
  locations: number[];
  instructors: number[];
  activityTypes: number[];
}

interface SchedulePreferences {
  version: 1;
  lastUsed?: StoredFilterSelection;
  favoriteInstructorIds: number[];
  favoriteActivityTypeIds: number[];
}

const emptyPreferences: SchedulePreferences = {
  version: 1,
  favoriteInstructorIds: [],
  favoriteActivityTypeIds: [],
};

function validIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is number => Number.isInteger(id) && id > 0))];
}

export function readSchedulePreferences(): SchedulePreferences {
  if (typeof window === "undefined") return emptyPreferences;

  try {
    const value = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "null",
    ) as Partial<SchedulePreferences> | null;
    if (!value || value.version !== 1) return emptyPreferences;

    const lastUsed = value.lastUsed
      ? {
          locations: validIds(value.lastUsed.locations),
          instructors: validIds(value.lastUsed.instructors),
          activityTypes: validIds(value.lastUsed.activityTypes),
        }
      : undefined;

    return {
      version: 1,
      ...(lastUsed?.locations.length ? { lastUsed } : {}),
      favoriteInstructorIds: validIds(value.favoriteInstructorIds),
      favoriteActivityTypeIds: validIds(value.favoriteActivityTypeIds),
    };
  } catch {
    return emptyPreferences;
  }
}

export function writeLastUsedFilters(search: ScheduleSearch) {
  writeSchedulePreferences({
    lastUsed: {
      locations: search.locations,
      instructors: search.instructors,
      activityTypes: search.activityTypes,
    },
  });
}

export function writeFavoriteFilters(
  favoriteInstructorIds: number[],
  favoriteActivityTypeIds: number[],
) {
  writeSchedulePreferences({ favoriteInstructorIds, favoriteActivityTypeIds });
}

function writeSchedulePreferences(update: Partial<SchedulePreferences>) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...readSchedulePreferences(), ...update, version: 1 }),
    );
  } catch {
    // Browser privacy settings or quota limits may make localStorage unavailable.
  }
}
