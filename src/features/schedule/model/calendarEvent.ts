import type { ScheduledActivity } from "./schedule";

function escapeCalendarText(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}

function calendarTimestamp(value: string | undefined) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date
    .toISOString()
    .replaceAll("-", "")
    .replaceAll(":", "")
    .replace(/\.\d{3}Z$/, "Z");
}

function activityLocation(activity: ScheduledActivity) {
  return [
    activity.locations
      ?.map(({ name }) => name)
      .filter(Boolean)
      .join(", "),
    activity.businessUnit?.name,
  ]
    .filter(Boolean)
    .join(", ");
}

export function activityCalendarContent(
  activity: ScheduledActivity,
  classUrl: string,
  generatedAt = new Date(),
) {
  const start = calendarTimestamp(activity.duration?.start);
  const end = calendarTimestamp(activity.duration?.end);
  if (!start || !end) return undefined;

  const title = activity.name?.trim() || "Class";
  const uidParts = [activity.businessUnit?.id, activity.id, start].filter(
    (part) => part !== undefined,
  );
  const instructors = activity.instructors
    ?.map(({ name }) => name)
    .filter(Boolean)
    .join(", ");
  const description = [instructors, classUrl].filter(Boolean).join("\n\n");
  const location = activityLocation(activity);

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HB Stunder//Calendar Event//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeCalendarText(uidParts.join("-"))}@hb-stunder`,
    `DTSTAMP:${calendarTimestamp(generatedAt.toISOString())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeCalendarText(title)}`,
    ...(location ? [`LOCATION:${escapeCalendarText(location)}`] : []),
    ...(description ? [`DESCRIPTION:${escapeCalendarText(description)}`] : []),
    `URL:${classUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

function calendarFilename(activity: ScheduledActivity) {
  const name = (activity.name?.trim() || "class")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `${name || "class"}.ics`;
}

function downloadCalendarFile(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function addActivityToCalendar(activity: ScheduledActivity, classUrl: string) {
  const content = activityCalendarContent(activity, classUrl);
  if (!content) return "unavailable" as const;

  const file = new File([content], calendarFilename(activity), { type: "text/calendar" });
  const shareData = { files: [file], title: activity.name ?? "HB Stunder" };
  if (navigator.canShare?.(shareData) && navigator.share) {
    await navigator.share(shareData);
    return "shared" as const;
  }

  downloadCalendarFile(file);
  return "downloaded" as const;
}
