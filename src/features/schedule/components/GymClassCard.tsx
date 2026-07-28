import { useTranslation } from "react-i18next";
import type { ScheduledActivity } from "../model/schedule";
import { getAvailability } from "../model/schedule";
import styles from "./GymClassCard.module.css";

export interface GymClassCardProps {
  activity: ScheduledActivity;
}

export function GymClassCard({ activity }: GymClassCardProps) {
  const { i18n, t } = useTranslation();
  const availability = getAvailability(activity);
  const timeFormatter = new Intl.DateTimeFormat(i18n.resolvedLanguage, {
    timeZone: "Europe/Stockholm",
    hour: "2-digit",
    minute: "2-digit",
  });
  const start = activity.duration?.start ? new Date(activity.duration.start) : undefined;
  const end = activity.duration?.end ? new Date(activity.duration.end) : undefined;
  const instructor = activity.instructors
    ?.map(({ name }) => name)
    .filter(Boolean)
    .join(", ");
  const location = activity.locations
    ?.map(({ name }) => name)
    .filter(Boolean)
    .join(", ");
  const availabilityLabel =
    availability.kind === "available" || availability.kind === "almostFull"
      ? t(`schedule.availability.${availability.kind}`, { count: availability.remaining })
      : t(`schedule.availability.${availability.kind}`);

  return (
    <article className={styles.card} data-availability={availability.kind}>
      <div className={styles.time}>
        {start && end ? `${timeFormatter.format(start)}–${timeFormatter.format(end)}` : "—"}
      </div>
      <div className={styles.content}>
        <h2>{activity.name ?? t("schedule.unnamedClass")}</h2>
        {instructor || location ? (
          <p>{[instructor, location].filter(Boolean).join(" · ")}</p>
        ) : null}
      </div>
      <div className={styles.availability} aria-live="polite">
        {availabilityLabel}
      </div>
    </article>
  );
}

export function GymClassCardSkeleton() {
  const { t } = useTranslation();
  return <div className={styles.skeleton} aria-label={t("schedule.loading")} />;
}
