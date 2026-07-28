import { isDateString, todayInStockholm } from "./scheduleDate";

export interface ScheduleSearch {
  date: string;
  location: number;
}

export function parseScheduleSearch(search: Record<string, unknown>): ScheduleSearch {
  const location = Number(search.location);

  return {
    date: isDateString(search.date) ? search.date : todayInStockholm(),
    location: Number.isInteger(location) && location > 0 ? location : 1,
  };
}
