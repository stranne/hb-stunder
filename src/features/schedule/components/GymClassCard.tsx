import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogTrigger, Heading, Modal } from "react-aria-components";
import type { GroupActivityBooking } from "../../bookings/model/bookings";
import { Button } from "../../../ui/button/Button";
import type { ScheduledActivity } from "../model/schedule";
import { getAvailability } from "../model/schedule";
import styles from "./GymClassCard.module.css";

export interface GymClassCardProps {
  activity: ScheduledActivity;
  booking?: GroupActivityBooking;
  onBook?: () => Promise<void>;
}

function usePrevious<T>(value: T) {
  const previousValue = useRef<T | undefined>(undefined);

  useEffect(() => {
    previousValue.current = value;
  }, [value]);

  return previousValue.current;
}

export function GymClassCard({ activity, booking, onBook }: GymClassCardProps) {
  const { i18n, t } = useTranslation();
  const [isBooking, setIsBooking] = useState(false);
  const [bookingFailed, setBookingFailed] = useState(false);
  const bookingTriggerRef = useRef<HTMLButtonElement>(null);
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

  const closeConfirmation = (close: () => void) => {
    close();
    setTimeout(() => (bookingTriggerRef.current ?? cardRef.current)?.focus(), 0);
  };

  const confirmBooking = async (close: () => void) => {
    if (!onBook || isBooking) return;

    setBookingFailed(false);
    setIsBooking(true);
    try {
      await onBook();
      closeConfirmation(close);
    } catch {
      setBookingFailed(true);
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <article
      ref={cardRef}
      className={styles.card}
      data-availability={
        booking ? (isWaitingListBooking ? "waitingListBooked" : "booked") : availability.kind
      }
      tabIndex={-1}
    >
      <div className={styles.time}>
        {start && end ? `${timeFormatter.format(start)}–${timeFormatter.format(end)}` : "—"}
      </div>
      <div className={styles.content}>
        <h2>{activity.name ?? t("schedule.unnamedClass")}</h2>
        {instructor || location ? (
          <p>{[instructor, location].filter(Boolean).join(" · ")}</p>
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
        {canBook ? (
          <DialogTrigger>
            <Button ref={bookingTriggerRef} onPress={() => setBookingFailed(false)}>
              {t(`${bookingCopy}.book`)}
            </Button>
            <Modal className={styles.modal} isDismissable={!isBooking}>
              <Dialog className={styles.dialog}>
                {({ close }) => (
                  <>
                    <Heading slot="title">{t(`${bookingCopy}.confirmTitle`)}</Heading>
                    <p>
                      {t(`${bookingCopy}.confirmMessage`, {
                        name: activity.name ?? t("schedule.unnamedClass"),
                      })}
                    </p>
                    <div className={styles.dialogActions}>
                      <Button
                        tone="quiet"
                        isDisabled={isBooking}
                        onPress={() => closeConfirmation(close)}
                      >
                        {t("schedule.booking.cancel")}
                      </Button>
                      <Button isDisabled={isBooking} onPress={() => void confirmBooking(close)}>
                        {bookingFailed ? t(`${bookingCopy}.retry`) : t(`${bookingCopy}.confirm`)}
                      </Button>
                    </div>
                    {isBooking || bookingFailed ? (
                      <p
                        className={styles.bookingStatus}
                        role={bookingFailed ? "alert" : "status"}
                        aria-live={bookingFailed ? "assertive" : "polite"}
                      >
                        {bookingFailed ? t(`${bookingCopy}.error`) : t(`${bookingCopy}.pending`)}
                      </p>
                    ) : null}
                  </>
                )}
              </Dialog>
            </Modal>
          </DialogTrigger>
        ) : null}
      </div>
    </article>
  );
}

export function GymClassCardSkeleton() {
  const { t } = useTranslation();
  return <div className={styles.skeleton} aria-label={t("schedule.loading")} />;
}
