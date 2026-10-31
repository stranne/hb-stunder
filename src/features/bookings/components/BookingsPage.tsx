import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../ui/button/Button";
import { EmptyState } from "../../../ui/feedback/EmptyState";
import { ErrorMessage } from "../../../ui/feedback/ErrorMessage";
import { groupActivityQueryOptions } from "../../schedule/api/scheduleQueries";
import { GymClassCard } from "../../schedule/components/GymClassCard";
import type { ScheduledActivity } from "../../schedule/model/schedule";
import { readSchedulePreferences } from "../../schedule/model/schedulePreferences";
import { cancelGroupActivityBookingMutationOptions } from "../api/bookingMutations";
import { customerGroupActivityBookingsQueryOptions } from "../api/bookingQueries";
import type { GroupActivityBooking } from "../model/bookings";
import styles from "./BookingsPage.module.css";

function bookingTime(booking: GroupActivityBooking, language: string) {
  if (!booking.duration?.start) return undefined;
  const start = new Date(booking.duration.start);
  if (Number.isNaN(start.getTime())) return undefined;

  return {
    day: new Intl.DateTimeFormat(language, {
      timeZone: "Europe/Stockholm",
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(start),
    time: new Intl.DateTimeFormat(language, {
      timeZone: "Europe/Stockholm",
      hour: "2-digit",
      minute: "2-digit",
    }).format(start),
  };
}

function activityFromBooking(booking: GroupActivityBooking): ScheduledActivity {
  return {
    id: booking.groupActivity?.id,
    name: booking.groupActivity?.name,
    duration: booking.duration,
    businessUnit: booking.businessUnit,
  };
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
  const activityQueries = useQueries({
    queries: sortedBookings.map((booking) =>
      groupActivityQueryOptions(booking.businessUnit?.id, booking.groupActivity?.id),
    ),
  });
  const { favoriteInstructorIds, favoriteActivityTypeIds } = readSchedulePreferences();

  return (
    <main className={styles.page}>
      <h1 className={styles.title} ref={pageHeadingRef} tabIndex={-1}>
        {t("bookings.title")}
      </h1>

      {!customerId ? (
        <EmptyState>
          {t(canSignIn ? "bookings.signedOut" : "bookings.signInUnavailable")}
        </EmptyState>
      ) : bookings.isPending ? (
        <EmptyState role="status">{t("bookings.loading")}</EmptyState>
      ) : bookings.isError ? (
        <ErrorMessage
          action={<Button onPress={() => void bookings.refetch()}>{t("bookings.retry")}</Button>}
        >
          {t("bookings.error")}
        </ErrorMessage>
      ) : sortedBookings.length === 0 ? (
        <EmptyState>{t("bookings.empty")}</EmptyState>
      ) : (
        <ul
          className={styles.list}
          aria-label={t("bookings.listLabel")}
          aria-busy={activityQueries.some((query) => query.isFetching)}
        >
          {sortedBookings.map((booking, index) => {
            const bookingId = booking.groupActivityBooking?.id;
            const time = bookingTime(booking, i18n.resolvedLanguage ?? "en");
            const activity = activityQueries[index]?.data ?? activityFromBooking(booking);
            const onCancel =
              booking.type === "groupActivityBooking" &&
              bookingId !== undefined &&
              customerId !== undefined
                ? () => cancellation.mutateAsync({ customerId, bookingId })
                : undefined;

            return (
              <li
                className={styles.booking}
                key={
                  bookingId ?? `${booking.groupActivity?.id}-${booking.duration?.start}-${index}`
                }
              >
                <time className={styles.date} dateTime={booking.duration?.start}>
                  {time ? (
                    <>
                      <span className={styles.dateDay}>{time.day}</span>{" "}
                      <span className={styles.dateTime}>{time.time}</span>
                    </>
                  ) : (
                    <span className={styles.dateDay}>{t("bookings.timeUnknown")}</span>
                  )}
                </time>
                <GymClassCard
                  activity={activity}
                  booking={booking}
                  onCancel={onCancel}
                  headingLevel={2}
                  includeBusinessUnitName
                  favoriteInstructorIds={favoriteInstructorIds}
                  favoriteActivityTypeIds={favoriteActivityTypeIds}
                  cancellationErrorMessage={t("bookings.cancellationError")}
                  cancellationFocusFallbackRef={pageHeadingRef}
                />
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
