const STOCKHOLM_TIME_ZONE = "Europe/Stockholm";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function dateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

function timeZoneOffset(date: Date, timeZone: string) {
  const parts = dateParts(date, timeZone);
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - date.getTime();
}

function localMidnightUtc(year: number, month: number, day: number) {
  const guess = Date.UTC(year, month - 1, day);
  let result = guess - timeZoneOffset(new Date(guess), STOCKHOLM_TIME_ZONE);
  result = guess - timeZoneOffset(new Date(result), STOCKHOLM_TIME_ZONE);
  return new Date(result);
}

export function isDateString(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year!, month! - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month! - 1 &&
    parsed.getUTCDate() === day
  );
}

export function todayInStockholm(now = new Date()) {
  const parts = dateParts(now, STOCKHOLM_TIME_ZONE);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getStockholmDayPeriod(date: string) {
  if (!isDateString(date)) throw new Error("Invalid schedule date");

  const [year, month, day] = date.split("-").map(Number);
  const start = localMidnightUtc(year!, month!, day!);
  const nextDate = new Date(Date.UTC(year!, month! - 1, day! + 1));
  const end = localMidnightUtc(
    nextDate.getUTCFullYear(),
    nextDate.getUTCMonth() + 1,
    nextDate.getUTCDate(),
  );

  return { start: start.toISOString(), end: end.toISOString() };
}
