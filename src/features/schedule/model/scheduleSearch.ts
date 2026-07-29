import { isDateString, todayInStockholm } from "./scheduleDate";

export const LOCATION_IDS = [1, 4128, 3509] as const;

export interface ScheduleSearch {
  date: string;
  locations: number[];
  instructors: number[];
  activityTypes: number[];
}

function parseIds(value: unknown): number[] {
  let values: unknown[];

  if (Array.isArray(value)) {
    values = value;
  } else if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      values = Array.isArray(parsed) ? parsed : value.split(",");
    } catch {
      values = value.split(",");
    }
  } else {
    values = value == null ? [] : [value];
  }

  return [...new Set(values.map(Number).filter((id) => Number.isInteger(id) && id > 0))].sort(
    (a, b) => a - b,
  );
}

export function parseScheduleSearch(search: Record<string, unknown>): ScheduleSearch {
  const locations = parseIds(search.locations ?? search.location);

  return {
    date: isDateString(search.date) ? search.date : todayInStockholm(),
    locations: locations.length > 0 ? locations : [...LOCATION_IDS],
    instructors: parseIds(search.instructors),
    activityTypes: parseIds(search.activityTypes),
  };
}
