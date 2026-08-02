import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { GroupActivityBooking } from "../../bookings/model/bookings";
import { AsyncConfirmationAction } from "../../../ui/confirmation/AsyncConfirmationAction";
import type { ScheduledActivity } from "../model/schedule";
import { getAvailability } from "../model/schedule";
import styles from "./GymClassCard.module.css";

export interface GymClassCardProps {
  activity: ScheduledActivity;
  booking?: GroupActivityBooking;
  onBook?: () => Promise<void>;
  onCancel?: () => Promise<void>;
  /** A time-group heading supplies the start time when this is false. */
  showTime?: boolean;
  headingLevel?: 2 | 3;
}

function usePrevious<T>(value: T) {
  const previousValue = useRef<T | undefined>(undefined);

  useEffect(() => {
    previousValue.current = value;
  }, [value]);

  return previousValue.current;
}

export function GymClassCard({
  activity,
  booking,
  onBook,
  onCancel,
  showTime = true,
  headingLevel = 2,
}: GymClassCardProps) {
  const { i18n, t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const detailsId = useId();
  const cardRef = useRef<HTMLElement>(null);
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
  const externalMessage = activity.externalMessage?.trim();
  const internalMessage = activity.internalMessage?.trim();
  const hasMessages = Boolean(externalMessage || internalMessage);
  const hasRemaining = availability.kind === "available" || availability.kind === "almostFull";
  const isWaitingList = availability.kind === "waitingList";
  const isWaitingListBooking = booking?.type === "groupActivityWaitingListBooking";
  const bookingCopy = isWaitingList ? "schedule.waitingList" : "schedule.booking";
  const availabilityLabel = hasRemaining
    ? t(`schedule.availability.${availability.kind}`, { count: availability.remaining })
    : t(`schedule.availability.${availability.kind}`);
  const availabilityText = hasRemaining
    ? t(`schedule.availability.${availability.kind}Text`, { count: availability.remaining })
    : undefined;
  const canBook = !booking && (hasRemaining || isWaitingList) && onBook !== undefined;
  const canCancel =
    booking?.type === "groupActivityBooking" &&
    booking.groupActivityBooking?.id !== undefined &&
    onCancel !== undefined;
  const Heading = `h${headingLevel}` as const;
  const durationLabel =
    start && end
      ? `${timeFormatter.format(start)}–${timeFormatter.format(end)}`
      : t("schedule.timeUnknown");

  return (
    <article
      ref={cardRef}
      className={`${styles.card} ${!showTime ? styles.grouped : ""}`}
      data-availability={
        booking ? (isWaitingListBooking ? "waitingListBooked" : "booked") : availability.kind
      }
      tabIndex={-1}
    >
      {showTime ? <div className={styles.time}>{durationLabel}</div> : null}
      <div className={styles.content}>
        <Heading>{activity.name ?? t("schedule.unnamedClass")}</Heading>
        {instructor || location ? (
          <p>{[instructor, location].filter(Boolean).join(" · ")}</p>
        ) : null}
        <button
          type="button"
          className={styles.expand}
          aria-expanded={isExpanded}
          aria-controls={detailsId}
          onClick={() => setIsExpanded((expanded) => !expanded)}
        >
          {t(isExpanded ? "schedule.details.hide" : "schedule.details.show")}
        </button>
        {isExpanded ? (
          <div className={styles.information} id={detailsId}>
            <p className={styles.duration}>{t("schedule.details.time", { time: durationLabel })}</p>
            {hasMessages ? (
              <div className={styles.messages}>
                {externalMessage ? (
                  <section className={styles.message} data-message-type="external">
                    <h3>{t("schedule.information.forThisClass")}</h3>
                    <p>{externalMessage}</p>
                  </section>
                ) : null}
                {internalMessage ? (
                  <section className={styles.message} data-message-type="internal">
                    <h3>{t("schedule.information.aboutClass")}</h3>
                    <p>{internalMessage}</p>
                  </section>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className={styles.actions}>
        <div className={styles.availability} aria-live="polite" aria-atomic="true">
          {booking ? (
            t(
              isWaitingListBooking
                ? "schedule.availability.waitingListBooked"
                : "schedule.availability.booked",
            )
          ) : hasRemaining ? (
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
        {canBook && onBook ? (
          <AsyncConfirmationAction
            triggerLabel={t(`${bookingCopy}.book`)}
            title={t(`${bookingCopy}.confirmTitle`)}
            message={t(`${bookingCopy}.confirmMessage`, {
              name: activity.name ?? t("schedule.unnamedClass"),
            })}
            cancelLabel={t("schedule.booking.cancel")}
            confirmLabel={t(`${bookingCopy}.confirm`)}
            retryLabel={t(`${bookingCopy}.retry`)}
            pendingMessage={t(`${bookingCopy}.pending`)}
            errorMessage={t(`${bookingCopy}.error`)}
            onConfirm={onBook}
            focusFallbackRef={cardRef}
          />
        ) : null}
        {canCancel && onCancel ? (
          <AsyncConfirmationAction
            triggerLabel={t("schedule.cancellation.cancelBooking")}
            title={t("schedule.cancellation.confirmTitle")}
            message={t("schedule.cancellation.confirmMessage", {
              name: activity.name ?? t("schedule.unnamedClass"),
            })}
            cancelLabel={t("schedule.cancellation.keepBooking")}
            confirmLabel={t("schedule.cancellation.confirm")}
            retryLabel={t("schedule.cancellation.retry")}
            pendingMessage={t("schedule.cancellation.pending")}
            errorMessage={t("schedule.cancellation.error")}
            onConfirm={onCancel}
            focusFallbackRef={cardRef}
            tone="quiet"
          />
        ) : null}
      </div>
    </article>
  );
}

export function GymClassCardSkeleton() {
  const { t } = useTranslation();
  return <div className={styles.skeleton} aria-label={t("schedule.loading")} />;
}
