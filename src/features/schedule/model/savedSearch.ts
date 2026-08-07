import { LOCATION_IDS, type ScheduleSearch } from "./scheduleSearch";

export const SAVED_SEARCH_VERSION = 1 as const;
export const SAVED_SEARCH_NAME_MAX_LENGTH = 60;

export interface SavedSearchCriteria {
  businessUnitIds: number[];
  instructorIds: number[];
  activityTypeIds: number[];
}

export interface SavedSearch {
  version: typeof SAVED_SEARCH_VERSION;
  id: string;
  name: string;
  criteria: SavedSearchCriteria;
}

export interface SavedSearchCandidate {
  businessUnitId?: number;
  instructorIds: number[];
  activityTypeId?: number;
}

export function criteriaFromScheduleSearch(search: ScheduleSearch): SavedSearchCriteria {
  return {
    businessUnitIds: [...search.locations],
    instructorIds: [...search.instructors],
    activityTypeIds: [...search.activityTypes],
  };
}

export function applySavedSearch(search: ScheduleSearch, savedSearch: SavedSearch): ScheduleSearch {
  return {
    ...search,
    locations:
      savedSearch.criteria.businessUnitIds.length > 0
        ? [...savedSearch.criteria.businessUnitIds]
        : [...LOCATION_IDS],
    instructors: [...savedSearch.criteria.instructorIds],
    activityTypes: [...savedSearch.criteria.activityTypeIds],
  };
}

/** Matches one complete saved-search predicate: OR inside categories, AND between categories. */
export function matchesSavedSearch(
  candidate: SavedSearchCandidate,
  savedSearch: SavedSearch,
): boolean {
  const { businessUnitIds, instructorIds, activityTypeIds } = savedSearch.criteria;

  return (
    (businessUnitIds.length === 0 ||
      (candidate.businessUnitId !== undefined &&
        businessUnitIds.includes(candidate.businessUnitId))) &&
    (instructorIds.length === 0 ||
      candidate.instructorIds.some((id) => instructorIds.includes(id))) &&
    (activityTypeIds.length === 0 ||
      (candidate.activityTypeId !== undefined &&
        activityTypeIds.includes(candidate.activityTypeId)))
  );
}

export function createSavedSearch(name: string, search: ScheduleSearch): SavedSearch {
  return {
    version: SAVED_SEARCH_VERSION,
    id:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `saved-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: name.trim(),
    criteria: criteriaFromScheduleSearch(search),
  };
}

export function hasDuplicateSavedSearchName(
  savedSearches: SavedSearch[],
  name: string,
  exceptId?: string,
): boolean {
  const normalizedName = name.trim().toLocaleLowerCase();
  return savedSearches.some(
    (savedSearch) =>
      savedSearch.id !== exceptId && savedSearch.name.toLocaleLowerCase() === normalizedName,
  );
}
