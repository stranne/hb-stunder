import type { components } from "../../../api/generated/schema";

export type ScheduledActivity = components["schemas"]["ScheduledGroupActivity"];

export interface ScheduleFilters {
  businessUnit: number;
  date: string;
}

export type Availability =
  | { kind: "available" | "almostFull"; remaining: number }
  | { kind: "waitingList" | "full" | "cancelled" };

export interface ActivityState {
  availability: Availability;
  hasStarted: boolean;
  hasEnded: boolean;
  canBook: boolean;
  totalBookable?: number;
  leftToBook?: number;
  participantCount?: number;
}

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

/** Shared booking and attendance state for every schedule presentation. */
export function getActivityState(activity: ScheduledActivity, now = Date.now()): ActivityState {
  const availability = getAvailability(activity);
  const hasStarted = hasActivityStarted(activity, now);
  const hasEnded = hasActivityEnded(activity, now);
  const totalBookable = activity.slots?.totalBookable;
  const leftToBook = activity.slots?.leftToBook;
  const hasSpotDetails = totalBookable !== undefined && leftToBook !== undefined;
  const bookableEarliest = activity.bookableEarliest
    ? Date.parse(activity.bookableEarliest)
    : undefined;
  const bookableLatest = activity.bookableLatest ? Date.parse(activity.bookableLatest) : undefined;
  const isWithinBookingWindow =
    (bookableEarliest === undefined || Number.isNaN(bookableEarliest) || now >= bookableEarliest) &&
    (bookableLatest === undefined || Number.isNaN(bookableLatest) || now <= bookableLatest);

  return {
    availability,
    hasStarted,
    hasEnded,
    canBook:
      !hasStarted &&
      isWithinBookingWindow &&
      (availability.kind === "available" ||
        availability.kind === "almostFull" ||
        availability.kind === "waitingList"),
    totalBookable,
    leftToBook,
    participantCount: hasSpotDetails
      ? Math.max(0, Math.min(totalBookable, totalBookable - leftToBook))
      : undefined,
  };
}
