import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../ui/button/Button";
import { AsyncConfirmationAction } from "../../../ui/confirmation/AsyncConfirmationAction";
import { ErrorMessage } from "../../../ui/feedback/ErrorMessage";
import { cancelGroupActivityBookingMutationOptions } from "../api/bookingMutations";
import { customerGroupActivityBookingsQueryOptions } from "../api/bookingQueries";
import type { GroupActivityBooking } from "../model/bookings";
import styles from "./BookingsPage.module.css";

function bookingTime(booking: GroupActivityBooking, language: string) {
  if (!booking.duration?.start) return undefined;
  const start = new Date(booking.duration.start);
  if (Number.isNaN(start.getTime())) return undefined;

  return new Intl.DateTimeFormat(language, {
    timeZone: "Europe/Stockholm",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(start);
}

export function BookingsPage({
  customerId,
  canSignIn,
}: {
  customerId?: string;
  canSignIn: boolean;
}) {
  const { i18n, t } = useTranslation();
  const queryClient = useQueryClient();
  const cancellation = useMutation(cancelGroupActivityBookingMutationOptions(queryClient));
  const pageHeadingRef = useRef<HTMLHeadingElement>(null);
  const bookings = useQuery(customerGroupActivityBookingsQueryOptions(customerId));
  const sortedBookings = [...(bookings.data ?? [])].sort((left, right) =>
    (left.duration?.start ?? "").localeCompare(right.duration?.start ?? ""),
  );

  return (
    <main className={styles.page}>
      <h1 className={styles.srHeading} ref={pageHeadingRef} tabIndex={-1}>
        {t("bookings.title")}
      </h1>

      {!customerId ? (
        <div className={styles.notice}>
          <p>{t(canSignIn ? "bookings.signedOut" : "bookings.signInUnavailable")}</p>
        </div>
      ) : bookings.isPending ? (
        <p className={styles.notice} role="status">
          {t("bookings.loading")}
        </p>
      ) : bookings.isError ? (
        <ErrorMessage
          action={<Button onPress={() => void bookings.refetch()}>{t("bookings.retry")}</Button>}
        >
          {t("bookings.error")}
        </ErrorMessage>
      ) : sortedBookings.length === 0 ? (
        <p className={styles.notice}>{t("bookings.empty")}</p>
      ) : (
        <ul className={styles.list} aria-label={t("bookings.listLabel")}>
          {sortedBookings.map((booking, index) => {
            const isWaiting = booking.type === "groupActivityWaitingListBooking";
            const isOrdinary = booking.type === "groupActivityBooking";
            const bookingId = booking.groupActivityBooking?.id;
            const name = booking.groupActivity?.name ?? t("bookings.unnamedClass");
            const location = booking.businessUnit?.name ?? booking.businessUnit?.location;

            return (
              <li
                className={styles.card}
                key={
                  bookingId ?? `${booking.groupActivity?.id}-${booking.duration?.start}-${index}`
                }
              >
                <time className={styles.date} dateTime={booking.duration?.start}>
                  {bookingTime(booking, i18n.resolvedLanguage ?? "en") ?? t("bookings.timeUnknown")}
                </time>
                <div>
                  <h2>{name}</h2>
                  {location ? <p className={styles.details}>{location}</p> : null}
                </div>
                <div className={styles.actions}>
                  <span className={`${styles.status} ${isWaiting ? styles.waiting : ""}`}>
                    {t(isWaiting ? "bookings.waitingList" : "bookings.booked")}
                  </span>
                  {isOrdinary && bookingId !== undefined && customerId ? (
                    <AsyncConfirmationAction
                      triggerLabel={t("schedule.cancellation.cancelBooking")}
                      title={t("schedule.cancellation.confirmTitle")}
                      message={t("schedule.cancellation.confirmMessage", { name })}
                      cancelLabel={t("schedule.cancellation.keepBooking")}
                      confirmLabel={t("schedule.cancellation.confirm")}
                      retryLabel={t("schedule.cancellation.retry")}
                      pendingMessage={t("schedule.cancellation.pending")}
                      errorMessage={t("bookings.cancellationError")}
                      onConfirm={() => cancellation.mutateAsync({ customerId, bookingId })}
                      focusFallbackRef={pageHeadingRef}
                      tone="quiet"
                    />
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
