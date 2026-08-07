import type { SavedSearch } from "./savedSearch";
import { SAVED_SEARCH_VERSION } from "./savedSearch";
import type { ScheduleSearch } from "./scheduleSearch";

const STORAGE_KEY = "hb-stunder.schedule-preferences";
export const SAVED_SEARCH_LIMIT = 20;

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
  savedSearches: SavedSearch[];
}

export interface SchedulePreferencesResult {
  preferences: SchedulePreferences;
  issue?: "malformed" | "storage" | "unsupported";
}

function emptyPreferences(): SchedulePreferences {
  return {
    version: 2,
    favoriteInstructorIds: [],
    favoriteActivityTypeIds: [],
    savedSearches: [],
  };
}

function validIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is number => Number.isInteger(id) && id > 0))];
}

function parseSavedSearch(value: unknown): SavedSearch | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const candidate = value as Partial<SavedSearch>;
  const criteria = candidate.criteria as Partial<SavedSearch["criteria"]> | undefined;
  const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
  if (
    candidate.version !== SAVED_SEARCH_VERSION ||
    typeof candidate.id !== "string" ||
    candidate.id.length === 0 ||
    name.length === 0 ||
    !criteria ||
    !Array.isArray(criteria.businessUnitIds) ||
    !Array.isArray(criteria.instructorIds) ||
    !Array.isArray(criteria.activityTypeIds)
  ) {
    return undefined;
  }

  return {
    version: SAVED_SEARCH_VERSION,
    id: candidate.id,
    name,
    criteria: {
      businessUnitIds: validIds(criteria.businessUnitIds),
      instructorIds: validIds(criteria.instructorIds),
      activityTypeIds: validIds(criteria.activityTypeIds),
    },
  };
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
    const rawSavedSearches =
      value.version === 2 && Array.isArray(value.savedSearches) ? value.savedSearches : [];
    const seenIds = new Set<string>();
    const savedSearches = rawSavedSearches
      .map(parseSavedSearch)
      .filter((savedSearch): savedSearch is SavedSearch => {
        if (!savedSearch || seenIds.has(savedSearch.id)) return false;
        seenIds.add(savedSearch.id);
        return true;
      })
      .slice(0, SAVED_SEARCH_LIMIT);
    const hasMalformedSavedSearches =
      value.version === 2 &&
      (!Array.isArray(value.savedSearches) || savedSearches.length !== rawSavedSearches.length);

    return {
      preferences: {
        version: 2,
        ...(lastUsed?.locations.length ? { lastUsed } : {}),
        favoriteInstructorIds: validIds(value.favoriteInstructorIds),
        favoriteActivityTypeIds: validIds(value.favoriteActivityTypeIds),
        savedSearches,
      },
      ...(hasMalformedSavedSearches ? { issue: "malformed" as const } : {}),
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

export function writeSavedSearches(savedSearches: SavedSearch[]): boolean {
  return writeSchedulePreferences({ savedSearches: savedSearches.slice(0, SAVED_SEARCH_LIMIT) });
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
