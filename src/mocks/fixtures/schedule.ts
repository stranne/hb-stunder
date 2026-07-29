import type { ScheduledActivity } from "../../features/schedule/model/schedule";
import { stableMockInstructorName } from "./mockNames";

const baseActivity = {
  businessUnit: { id: 1, name: "Haga" },
  locations: [{ id: 11, name: "Studion" }],
  cancelled: false,
} satisfies ScheduledActivity;

export const scheduleFixtures = {
  available: {
    ...baseActivity,
    id: 101,
    name: "Morning Flow",
    groupActivityProduct: { id: 201, name: "Yoga" },
    instructors: [{ id: 21, name: stableMockInstructorName(21) }],
    duration: { start: "2026-07-28T06:00:00.000Z", end: "2026-07-28T07:00:00.000Z" },
    slots: { totalBookable: 18, leftToBook: 8, hasWaitingList: false },
  },
  almostFull: {
    ...baseActivity,
    id: 102,
    name: "Strength Circuit",
    groupActivityProduct: { id: 202, name: "Strength" },
    instructors: [{ id: 22, name: stableMockInstructorName(22) }],
    duration: { start: "2026-07-28T09:30:00.000Z", end: "2026-07-28T10:15:00.000Z" },
    slots: { totalBookable: 12, leftToBook: 2, hasWaitingList: false },
  },
  full: {
    ...baseActivity,
    id: 103,
    name: "Reformer Pilates",
    groupActivityProduct: { id: 203, name: "Pilates" },
    instructors: [{ id: 23, name: stableMockInstructorName(23) }],
    duration: { start: "2026-07-28T15:00:00.000Z", end: "2026-07-28T15:50:00.000Z" },
    slots: { totalBookable: 10, leftToBook: 0, hasWaitingList: false },
  },
  waitingList: {
    ...baseActivity,
    id: 104,
    name: "Evening Yoga",
    groupActivityProduct: { id: 201, name: "Yoga" },
    instructors: [{ id: 21, name: stableMockInstructorName(21) }],
    duration: { start: "2026-07-28T17:00:00.000Z", end: "2026-07-28T18:15:00.000Z" },
    slots: { totalBookable: 20, leftToBook: 0, hasWaitingList: true, inWaitingList: 3 },
  },
  cancelled: {
    ...baseActivity,
    id: 105,
    name: "Boxning",
    groupActivityProduct: { id: 204, name: "Boxing" },
    instructors: [{ id: 25, name: stableMockInstructorName(25) }],
    duration: { start: "2026-07-28T18:30:00.000Z", end: "2026-07-28T19:15:00.000Z" },
    cancelled: true,
    slots: { totalBookable: 16, leftToBook: 6, hasWaitingList: false },
  },
} satisfies Record<string, ScheduledActivity>;

export const defaultSchedule = [
  scheduleFixtures.available,
  scheduleFixtures.almostFull,
  scheduleFixtures.full,
  scheduleFixtures.waitingList,
];

export function scheduleForDate(date: string): ScheduledActivity[] {
  return defaultSchedule.map((activity) => ({
    ...activity,
    duration: {
      start: activity.duration?.start?.replace("2026-07-28", date),
      end: activity.duration?.end?.replace("2026-07-28", date),
    },
  }));
}
