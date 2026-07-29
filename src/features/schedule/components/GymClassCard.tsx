import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { ScheduledActivity } from "../model/schedule";
import { getAvailability } from "../model/schedule";
import styles from "./GymClassCard.module.css";

export interface GymClassCardProps {
  activity: ScheduledActivity;
}

function usePrevious<T>(value: T) {
  const previousValue = useRef<T | undefined>(undefined);

  useEffect(() => {
    previousValue.current = value;
  }, [value]);

  return previousValue.current;
}

export function GymClassCard({ activity }: GymClassCardProps) {
  const { i18n, t } = useTranslation();
  const availability = getAvailability(activity);
  const remaining = "remaining" in availability ? availability.remaining : undefined;
  const previousRemaining = usePrevious(remaining);
  const availabilityChanged =
    remaining !== undefined && previousRemaining !== undefined && remaining !== previousRemaining;
  const availabilityDirection =
    remaining !== undefined && previousRemaining !== undefined && remaining > previousRemaining
      ? "increase"
      : "decrease";
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
  const hasRemaining = availability.kind === "available" || availability.kind === "almostFull";
  const availabilityLabel = hasRemaining
    ? t(`schedule.availability.${availability.kind}`, { count: availability.remaining })
    : t(`schedule.availability.${availability.kind}`);
  const availabilityText = hasRemaining
    ? t(`schedule.availability.${availability.kind}Text`, { count: availability.remaining })
    : undefined;

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
      <div className={styles.availability} aria-live="polite" aria-atomic="true">
        {hasRemaining ? (
          <>
            <span
              className={styles.availabilityNumber}
              data-availability-value
              data-direction={availabilityChanged ? availabilityDirection : undefined}
              data-updated={availabilityChanged || undefined}
            >
              <span
                key={availability.remaining}
                className={styles.currentNumber}
                data-current-value
              >
                {availability.remaining}
              </span>
              {availabilityChanged ? (
                <span className={styles.previousNumber} data-previous-value aria-hidden="true">
                  {previousRemaining}
                </span>
              ) : null}
            </span>{" "}
            <span className={styles.availabilityText} data-availability-text>
              {availabilityText}
            </span>
          </>
        ) : (
          availabilityLabel
        )}
      </div>
    </article>
  );
}

export function GymClassCardSkeleton() {
  const { t } = useTranslation();
  return <div className={styles.skeleton} aria-label={t("schedule.loading")} />;
}
