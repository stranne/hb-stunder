import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "../../../ui/button/Button";
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
  onSignIn,
}: {
  customerId?: string;
  canSignIn: boolean;
  onSignIn: () => void;
}) {
  const { i18n, t } = useTranslation();
  const bookings = useQuery(customerGroupActivityBookingsQueryOptions(customerId));
  const sortedBookings = [...(bookings.data ?? [])].sort((left, right) =>
    (left.duration?.start ?? "").localeCompare(right.duration?.start ?? ""),
  );

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>{t("bookings.title")}</h1>
        <p>{t("bookings.description")}</p>
      </header>

      {!customerId ? (
        <div className={styles.notice}>
          <p>{t(canSignIn ? "bookings.signedOut" : "bookings.signInUnavailable")}</p>
          {canSignIn ? <Button onPress={onSignIn}>{t("auth.signIn")}</Button> : null}
        </div>
      ) : bookings.isPending ? (
        <p className={styles.notice} role="status">
          {t("bookings.loading")}
        </p>
      ) : bookings.isError ? (
        <div className={styles.notice} role="alert">
          <p>{t("bookings.error")}</p>
          <Button onPress={() => void bookings.refetch()}>{t("bookings.retry")}</Button>
        </div>
      ) : sortedBookings.length === 0 ? (
        <p className={styles.notice}>{t("bookings.empty")}</p>
      ) : (
        <ul className={styles.list} aria-label={t("bookings.listLabel")}>
          {sortedBookings.map((booking, index) => {
            const isWaiting = booking.type === "groupActivityWaitingListBooking";
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
                <span className={`${styles.status} ${isWaiting ? styles.waiting : ""}`}>
                  {t(isWaiting ? "bookings.waitingList" : "bookings.booked")}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
