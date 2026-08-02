import { isDateString, todayInStockholm } from "./scheduleDate";

export const SCHEDULE_LOCATIONS = [
  { id: 1, name: "Hagabadet i Haga" },
  { id: 4128, name: "Hagabadet Drottningtorget" },
  { id: 3509, name: "Hagabadet Älvstranden" },
] as const;

export const LOCATION_IDS = SCHEDULE_LOCATIONS.map(({ id }) => id);

export type ScheduleView = "classes" | "rooms";

export interface ScheduleSearch {
  date: string;
  locations: number[];
  instructors: number[];
  activityTypes: number[];
  /** Omitted links remain compatible and open the classes view. */
  view?: ScheduleView;
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
    view: search.view === "rooms" ? "rooms" : "classes",
  };
}
