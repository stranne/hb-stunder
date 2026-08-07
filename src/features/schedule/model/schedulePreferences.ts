import type { ScheduleSearch } from "./scheduleSearch";

const STORAGE_KEY = "hb-stunder.schedule-preferences";
export interface StoredFilterSelection {
  locations: number[];
  instructors: number[];
  activityTypes: number[];
}

export interface FavoriteFilterSelection {
  favoriteInstructorIds: number[];
  favoriteActivityTypeIds: number[];
}

export interface SchedulePreferences extends FavoriteFilterSelection {
  version: 2;
  lastUsed?: StoredFilterSelection;
}

export interface SchedulePreferencesResult {
  preferences: SchedulePreferences;
  issue?: "storage" | "unsupported";
}

function emptyPreferences(): SchedulePreferences {
  return {
    version: 2,
    favoriteInstructorIds: [],
    favoriteActivityTypeIds: [],
  };
}

function validIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is number => Number.isInteger(id) && id > 0))];
}

export function readSchedulePreferencesResult(): SchedulePreferencesResult {
  if (typeof window === "undefined") return { preferences: emptyPreferences() };

  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as Record<
      string,
      unknown
    > | null;
    if (!value) return { preferences: emptyPreferences() };
    if (value.version !== 1 && value.version !== 2) {
      return { preferences: emptyPreferences(), issue: "unsupported" };
    }

    const lastUsedValue = value.lastUsed as Partial<StoredFilterSelection> | undefined;
    const lastUsed = lastUsedValue
      ? {
          locations: validIds(lastUsedValue.locations),
          instructors: validIds(lastUsedValue.instructors),
          activityTypes: validIds(lastUsedValue.activityTypes),
        }
      : undefined;
    return {
      preferences: {
        version: 2,
        ...(lastUsed?.locations.length ? { lastUsed } : {}),
        favoriteInstructorIds: validIds(value.favoriteInstructorIds),
        favoriteActivityTypeIds: validIds(value.favoriteActivityTypeIds),
      },
    };
  } catch {
    return { preferences: emptyPreferences(), issue: "storage" };
  }
}

export function readSchedulePreferences(): SchedulePreferences {
  return readSchedulePreferencesResult().preferences;
}

export function writeLastUsedFilters(search: ScheduleSearch): void {
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
): boolean {
  return writeSchedulePreferences({ favoriteInstructorIds, favoriteActivityTypeIds });
}

function writeSchedulePreferences(update: Partial<SchedulePreferences>): boolean {
  if (typeof window === "undefined") return false;

  try {
    const stored = readSchedulePreferencesResult();
    if (stored.issue === "unsupported" || stored.issue === "storage") return false;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...stored.preferences, ...update, version: 2 }),
    );
    return true;
  } catch {
    // Browser privacy settings or quota limits may make localStorage unavailable.
    return false;
  }
}
