import type { components } from "../../../api/generated/schema";

export type ScheduledActivity = components["schemas"]["ScheduledGroupActivity"];

export interface ScheduleFilters {
  businessUnit: number;
  date: string;
}

export type Availability =
  | { kind: "available" | "almostFull"; remaining: number }
  | { kind: "waitingList" | "full" | "cancelled" };

export interface TimeGroup {
  start: string;
  activities: ScheduledActivity[];
}

/** Groups a sorted schedule by the exact API start timestamp. */
export function groupActivitiesByStart(activities: ScheduledActivity[]): TimeGroup[] {
  const groups = new Map<string, ScheduledActivity[]>();

  for (const activity of activities) {
    const start = activity.duration?.start ?? "";
    const group = groups.get(start);
    if (group) group.push(activity);
    else groups.set(start, [activity]);
  }

  return [...groups].map(([start, groupedActivities]) => ({
    start,
    activities: groupedActivities,
  }));
}

export function hasActivityStarted(activity: ScheduledActivity, now = Date.now()): boolean {
  const start = activity.duration?.start;
  return start !== undefined && Date.parse(start) <= now;
}

export function hasActivityEnded(activity: ScheduledActivity, now = Date.now()): boolean {
  const end = activity.duration?.end;
  return end !== undefined && Date.parse(end) <= now;
}

export function getAvailability(activity: ScheduledActivity): Availability {
  if (activity.cancelled) return { kind: "cancelled" };

  const remaining = Math.max(0, activity.slots?.leftToBook ?? 0);
  if (remaining > 3) return { kind: "available", remaining };
  if (remaining > 0) return { kind: "almostFull", remaining };
  if (activity.slots?.hasWaitingList) return { kind: "waitingList" };
  return { kind: "full" };
}
