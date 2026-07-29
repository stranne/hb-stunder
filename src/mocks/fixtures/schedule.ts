import type { ScheduledActivity } from "../../features/schedule/model/schedule";
import { todayInStockholm } from "../../features/schedule/model/scheduleDate";
import { stableMockInstructorName } from "./mockNames";

const baseActivity = {
  businessUnit: { id: 1, name: "Hagabadet i Haga" },
  locations: [{ id: 18, name: "Yogastudio" }],
  cancelled: false,
} satisfies ScheduledActivity;

/** Small, explicit fixtures used by card stories and component tests. */
export const scheduleFixtures = {
  available: {
    ...baseActivity,
    id: 101,
    name: "Yinyoga, 55 min",
    groupActivityProduct: { id: 3392, name: "Yinyoga, 55 min" },
    instructors: [{ id: 21, name: stableMockInstructorName(21) }],
    duration: { start: "2026-07-28T06:00:00.000Z", end: "2026-07-28T07:00:00.000Z" },
    slots: { totalBookable: 18, leftToBook: 8, hasWaitingList: false },
  },
  almostFull: {
    ...baseActivity,
    id: 102,
    name: "Body pump, 60 min",
    groupActivityProduct: { id: 743, name: "Body pump, 60 min" },
    instructors: [{ id: 22, name: stableMockInstructorName(22) }],
    duration: { start: "2026-07-28T09:30:00.000Z", end: "2026-07-28T10:15:00.000Z" },
    slots: { totalBookable: 12, leftToBook: 2, hasWaitingList: false },
  },
  full: {
    ...baseActivity,
    id: 103,
    name: "Pilates, 55 min",
    groupActivityProduct: { id: 4128, name: "Pilates, 55 min" },
    instructors: [{ id: 23, name: stableMockInstructorName(23) }],
    duration: { start: "2026-07-28T15:00:00.000Z", end: "2026-07-28T15:50:00.000Z" },
    slots: { totalBookable: 10, leftToBook: 0, hasWaitingList: false },
  },
  waitingList: {
    ...baseActivity,
    id: 104,
    name: "Yinyoga, 55 min",
    groupActivityProduct: { id: 3392, name: "Yinyoga, 55 min" },
    instructors: [{ id: 21, name: stableMockInstructorName(21) }],
    duration: { start: "2026-07-28T17:00:00.000Z", end: "2026-07-28T18:15:00.000Z" },
    slots: { totalBookable: 20, leftToBook: 0, hasWaitingList: true, inWaitingList: 3 },
  },
  cancelled: {
    ...baseActivity,
    id: 105,
    name: "BoxFight Small Group, 55 min",
    groupActivityProduct: { id: 12449, name: "BoxFight Small Group, 55 min" },
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

export const mockBusinessUnits = {
  1: { id: 1, name: "Hagabadet i Haga" },
  4128: { id: 4128, name: "Hagabadet Drottningtorget" },
  3509: { id: 3509, name: "Hagabadet Älvstranden" },
} as const;

// IDs and names observed from the public schedule API for each business unit.
export const mockRooms = {
  1: [
    { id: 10, name: "Hotyogastudio" },
    { id: 12, name: "Ägget" },
    { id: 17, name: "Träningsstudio" },
    { id: 18, name: "Yogastudio" },
    { id: 28, name: "Cykelstudion" },
    { id: 31, name: "BC-studion" },
    { id: 203, name: "Publiceras inom kort 2" },
    { id: 496, name: "Gymmet" },
    { id: 1709, name: "Vitality Lab intro Haga" },
  ],
  4128: [
    { id: 945, name: "Yogasal" },
    { id: 946, name: "Hot Yoga sal" },
    { id: 1206, name: "Gymmet" },
    { id: 1264, name: "Spa" },
    { id: 1706, name: "Vitality Lab intro DT" },
  ],
  3509: [
    { id: 627, name: "Träningsstudio" },
    { id: 628, name: "Hotyogasal" },
    { id: 1153, name: "Utomhus" },
    { id: 1710, name: "Vitality Lab intro Älv" },
  ],
} as const;

// Product IDs and names observed from the public group-activity products API.
export const mockActivityProducts = [
  { id: 743, name: "Body pump, 60 min" },
  { id: 3392, name: "Yinyoga, 55 min" },
  { id: 4100, name: "Vattenstyrka, 45 min" },
  { id: 4128, name: "Pilates, 55 min" },
  { id: 5328, name: "Hot Lugn Vinyasa, 55 min" },
  { id: 8843, name: "CYKEL, 45 min" },
  { id: 9191, name: "Gongbad, 55 min" },
  { id: 9759, name: "Dans, 45 min" },
  { id: 10627, name: "Breathwork (Andningsmeditation), 55 min" },
  { id: 11089, name: "Funktionell träning, 45 min" },
  { id: 12170, name: "Senioryoga, 55 min" },
  { id: 12449, name: "BoxFight Small Group, 55 min" },
  { id: 12634, name: "Styrka HIIT,  45 min" },
  { id: 12636, name: "Styrka Core, 30 min" },
  { id: 13448, name: "Pilates Props, 45 min" },
  { id: 13701, name: "VitalityLab intro" },
] as const;

export const mockInstructors = Array.from({ length: 27 }, (_, index) => {
  const id = 21 + index;
  return { id, name: stableMockInstructorName(id), type: "Employee" };
});

type ProductId = (typeof mockActivityProducts)[number]["id"];
type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface ClassTemplate {
  id: number;
  name: string;
  product: ProductId;
  instructor: number;
  weekdays: Weekday[];
  start: string;
  minutes: number;
  capacity: number;
}

const everyDay: Weekday[] = [0, 1, 2, 3, 4, 5, 6];
const weekdays: Weekday[] = [1, 2, 3, 4, 5];
const alternateDays: Weekday[] = [1, 3, 5];
const otherDays: Weekday[] = [0, 2, 4, 6];

const schedules: Record<keyof typeof mockBusinessUnits, ClassTemplate[]> = {
  1: [
    {
      id: 1001,
      name: "Yinyoga, 55 min",
      product: 3392,
      instructor: 21,
      weekdays: everyDay,
      start: "06:00",
      minutes: 60,
      capacity: 22,
    },
    {
      id: 1002,
      name: "Body pump, 60 min",
      product: 743,
      instructor: 22,
      weekdays,
      start: "07:15",
      minutes: 45,
      capacity: 18,
    },
    {
      id: 1003,
      name: "Pilates, 55 min",
      product: 4128,
      instructor: 23,
      weekdays: otherDays,
      start: "09:00",
      minutes: 50,
      capacity: 12,
    },
    {
      id: 1004,
      name: "Pilates Props, 45 min",
      product: 13448,
      instructor: 24,
      weekdays,
      start: "11:30",
      minutes: 45,
      capacity: 16,
    },
    {
      id: 1005,
      name: "Hot Lugn Vinyasa, 55 min",
      product: 5328,
      instructor: 25,
      weekdays: alternateDays,
      start: "15:30",
      minutes: 75,
      capacity: 20,
    },
    {
      id: 1006,
      name: "BoxFight Small Group, 55 min",
      product: 12449,
      instructor: 26,
      weekdays: otherDays,
      start: "16:30",
      minutes: 60,
      capacity: 18,
    },
    {
      id: 1007,
      name: "Yinyoga, 55 min",
      product: 3392,
      instructor: 27,
      weekdays: everyDay,
      start: "18:00",
      minutes: 75,
      capacity: 24,
    },
    {
      id: 1008,
      name: "Gongbad, 55 min",
      product: 9191,
      instructor: 28,
      weekdays: [0, 3, 6],
      start: "19:30",
      minutes: 45,
      capacity: 28,
    },
    {
      id: 1009,
      name: "Styrka Core, 30 min",
      product: 12636,
      instructor: 29,
      weekdays: [2, 4, 6],
      start: "17:15",
      minutes: 45,
      capacity: 20,
    },
  ],
  4128: [
    {
      id: 2001,
      name: "CYKEL, 45 min",
      product: 8843,
      instructor: 30,
      weekdays: everyDay,
      start: "06:30",
      minutes: 45,
      capacity: 26,
    },
    {
      id: 2002,
      name: "Styrka HIIT,  45 min",
      product: 12634,
      instructor: 31,
      weekdays,
      start: "07:30",
      minutes: 30,
      capacity: 20,
    },
    {
      id: 2003,
      name: "Pilates, 55 min",
      product: 4128,
      instructor: 32,
      weekdays: alternateDays,
      start: "10:00",
      minutes: 50,
      capacity: 16,
    },
    {
      id: 2004,
      name: "Dans, 45 min",
      product: 9759,
      instructor: 33,
      weekdays: otherDays,
      start: "12:00",
      minutes: 50,
      capacity: 24,
    },
    {
      id: 2005,
      name: "VitalityLab intro",
      product: 13701,
      instructor: 34,
      weekdays,
      start: "12:10",
      minutes: 40,
      capacity: 18,
    },
    {
      id: 2006,
      name: "CYKEL, 45 min",
      product: 8843,
      instructor: 35,
      weekdays,
      start: "16:45",
      minutes: 45,
      capacity: 26,
    },
    {
      id: 2007,
      name: "BoxFight Small Group, 55 min",
      product: 12449,
      instructor: 36,
      weekdays: alternateDays,
      start: "18:00",
      minutes: 60,
      capacity: 20,
    },
    {
      id: 2008,
      name: "Funktionell träning, 45 min",
      product: 11089,
      instructor: 37,
      weekdays: everyDay,
      start: "19:15",
      minutes: 45,
      capacity: 22,
    },
    {
      id: 2009,
      name: "Breathwork (Andningsmeditation), 55 min",
      product: 10627,
      instructor: 38,
      weekdays: [0, 6],
      start: "10:30",
      minutes: 60,
      capacity: 30,
    },
  ],
  3509: [
    {
      id: 3001,
      name: "Yinyoga, 55 min",
      product: 3392,
      instructor: 39,
      weekdays: everyDay,
      start: "06:15",
      minutes: 60,
      capacity: 24,
    },
    {
      id: 3002,
      name: "Vattenstyrka, 45 min",
      product: 4100,
      instructor: 40,
      weekdays: otherDays,
      start: "08:00",
      minutes: 45,
      capacity: 18,
    },
    {
      id: 3003,
      name: "Senioryoga, 55 min",
      product: 12170,
      instructor: 41,
      weekdays: [1, 3, 5],
      start: "09:30",
      minutes: 50,
      capacity: 20,
    },
    {
      id: 3004,
      name: "Vattenstyrka, 45 min",
      product: 4100,
      instructor: 42,
      weekdays: [1, 3, 6],
      start: "11:00",
      minutes: 45,
      capacity: 16,
    },
    {
      id: 3005,
      name: "VitalityLab intro",
      product: 13701,
      instructor: 43,
      weekdays,
      start: "12:00",
      minutes: 45,
      capacity: 22,
    },
    {
      id: 3006,
      name: "Body pump, 60 min",
      product: 743,
      instructor: 44,
      weekdays: alternateDays,
      start: "16:30",
      minutes: 60,
      capacity: 20,
    },
    {
      id: 3007,
      name: "Hot Lugn Vinyasa, 55 min",
      product: 5328,
      instructor: 45,
      weekdays: otherDays,
      start: "17:30",
      minutes: 75,
      capacity: 24,
    },
    {
      id: 3008,
      name: "Funktionell träning, 45 min",
      product: 11089,
      instructor: 46,
      weekdays: everyDay,
      start: "19:00",
      minutes: 50,
      capacity: 26,
    },
    {
      id: 3009,
      name: "Gongbad, 55 min",
      product: 9191,
      instructor: 47,
      weekdays: [0],
      start: "16:00",
      minutes: 60,
      capacity: 30,
    },
  ],
};

function dayNumber(date: string) {
  return Math.floor(Date.parse(`${date}T00:00:00.000Z`) / 86_400_000);
}

function slotsForDate(template: ClassTemplate, date: string, today: string) {
  const daysAhead = dayNumber(date) - dayNumber(today);
  if (daysAhead < 0 || daysAhead > 7) {
    return {
      totalBookable: template.capacity,
      leftToBook: template.capacity,
      hasWaitingList: false,
    };
  }

  // Regular members fill the first days. Days 4–7 only contain the smaller number
  // of advance VIP bookings, so the final days have the most availability.
  const bookingRates = [0.96, 0.88, 0.76, 0.64, 0.36, 0.24, 0.14, 0.08] as const;
  const variation = ((template.id + dayNumber(date)) % 7) / 100;
  const booked = Math.min(
    template.capacity,
    Math.round(template.capacity * (bookingRates[daysAhead]! + variation)),
  );
  const leftToBook = template.capacity - booked;
  const hasWaitingList = leftToBook === 0 && (template.id + dayNumber(date)) % 3 === 0;

  return {
    totalBookable: template.capacity,
    leftToBook,
    hasWaitingList,
    ...(hasWaitingList ? { inWaitingList: 1 + ((template.id + dayNumber(date)) % 5) } : {}),
  };
}

function duration(date: string, startTime: string, minutes: number) {
  const start = new Date(`${date}T${startTime}:00.000Z`);
  const end = new Date(start.getTime() + minutes * 60_000);
  return { start: start.toISOString(), end: end.toISOString() };
}

/** Builds the recurring weekday schedule for one location with deterministic availability. */
export function scheduleForDate(
  date: string,
  businessUnitId: number = 1,
  today: string = todayInStockholm(),
): ScheduledActivity[] {
  const businessUnit = mockBusinessUnits[businessUnitId as keyof typeof mockBusinessUnits];
  if (!businessUnit) return [];

  const weekday = new Date(`${date}T12:00:00.000Z`).getUTCDay() as Weekday;
  const productById = new Map(mockActivityProducts.map((product) => [product.id, product]));

  return schedules[businessUnit.id]
    .filter((template) => template.weekdays.includes(weekday))
    .map((template) => ({
      id: dayNumber(date) * 10_000 + template.id,
      name: template.name,
      groupActivityProduct: productById.get(template.product),
      businessUnit: { id: businessUnit.id, name: businessUnit.name },
      locations: [mockRooms[businessUnit.id][template.id % mockRooms[businessUnit.id].length]!],
      instructors: [
        { id: template.instructor, name: stableMockInstructorName(template.instructor) },
      ],
      duration: duration(date, template.start, template.minutes),
      cancelled: false,
      slots: slotsForDate(template, date, today),
    }));
}
