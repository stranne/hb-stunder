import type { ScheduledActivity } from "./schedule";
import { todayInStockholm } from "./scheduleDate";
import type { ScheduleView } from "./scheduleSearch";

export function classShareUrl(
  activity: ScheduledActivity,
  view: Exclude<ScheduleView, "filters">,
  baseUrl = window.location.href,
) {
  const url = new URL(baseUrl);
  const start = activity.duration?.start ? new Date(activity.duration.start) : undefined;

  url.searchParams.delete("locations");
  url.searchParams.delete("location");
  url.searchParams.delete("instructors");
  url.searchParams.delete("activityTypes");
  if (start && !Number.isNaN(start.getTime())) {
    url.searchParams.set("date", todayInStockholm(start));
  }
  if (activity.businessUnit?.id !== undefined) {
    url.searchParams.set("locations", JSON.stringify([activity.businessUnit.id]));
  }
  if (activity.id !== undefined) url.searchParams.set("activity", String(activity.id));
  url.searchParams.set("view", view);
  url.hash = "";

  return url.toString();
}

export async function shareClass(title: string, url: string) {
  if (navigator.share) {
    await navigator.share({ title, text: title, url });
    return "shared" as const;
  }

  await navigator.clipboard.writeText(url);
  return "copied" as const;
}
