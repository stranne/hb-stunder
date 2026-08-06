import { Clock, MapPin, NavArrowDown, User } from "iconoir-react";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { GroupActivityBooking } from "../../bookings/model/bookings";
import { AsyncConfirmationAction } from "../../../ui/confirmation/AsyncConfirmationAction";
import { StatusLabel } from "../../../ui/status-label/StatusLabel";
import type { ScheduledActivity } from "../model/schedule";
import { getActivityState } from "../model/schedule";
import { ActivitySpotAvailability } from "./ActivitySpotAvailability";
import { FavoriteInstructorNames, FavoriteMarker } from "./ScheduleFavoriteLabels";
import styles from "./GymClassCard.module.css";

export interface GymClassCardProps {
  activity: ScheduledActivity;
  booking?: GroupActivityBooking;
  onBook?: () => Promise<void>;
  onCancel?: () => Promise<void>;
  headingLevel?: 2 | 3;
  favoriteInstructorIds?: number[];
  favoriteActivityTypeIds?: number[];
  includeBusinessUnitName?: boolean;
}

function classTitleParts(name: string) {
  const match = name.match(
    /^(.*?)(?:,\s*|\s+)(\d+(?:[.,]\d+)?\s*(?:min(?:uter)?|tim(?:me|mar)))\s*$/i,
  );
  if (!match) return { title: name };

  return { title: match[1]!.trim(), duration: match[2]!.replace(/\s+/g, " ") };
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
  headingLevel = 3,
  favoriteInstructorIds = [],
  favoriteActivityTypeIds = [],
  includeBusinessUnitName = false,
}: GymClassCardProps) {
  const { i18n, t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const detailsId = useId();
  const cardRef = useRef<HTMLElement>(null);
  const activityState = getActivityState(activity);
  const { availability, hasStarted, hasEnded, participantCount } = activityState;
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
  const hasInstructors = activity.instructors?.some(({ name }) => Boolean(name));
  const isFavoriteActivityType =
    activity.groupActivityProduct?.id !== undefined &&
    favoriteActivityTypeIds.includes(activity.groupActivityProduct.id);
  const locations = [
    activity.locations
      ?.map(({ name }) => name)
      .filter(Boolean)
      .join(", "),
    includeBusinessUnitName ? activity.businessUnit?.name : undefined,
  ]
    .filter(Boolean)
    .join(", ");
  const externalMessage = activity.externalMessage?.trim();
  const internalMessage = activity.internalMessage?.trim();
  const fullName = activity.name ?? t("schedule.unnamedClass");
  const titleParts = classTitleParts(fullName);
  const displayName = titleParts.title;
  const elapsedMinutes = start && end ? Math.round((end.getTime() - start.getTime()) / 60_000) : 0;
  const elapsedHours = elapsedMinutes / 60;
  const formattedHours = new Intl.NumberFormat(i18n.resolvedLanguage, {
    maximumFractionDigits: 2,
  }).format(elapsedHours);
  const rangeDuration =
    elapsedMinutes > 90
      ? t("schedule.details.durationHours", { count: elapsedHours, duration: formattedHours })
      : elapsedMinutes > 0
        ? t("schedule.details.durationMinutes", { count: elapsedMinutes })
        : undefined;
  const classListDuration = titleParts.duration ?? rangeDuration;
  const { totalBookable, leftToBook } = activityState;
  const waitingCount = activity.slots?.inWaitingList;
  const hasSpotDetails = totalBookable !== undefined && leftToBook !== undefined;
  const hasRemaining = availability.kind === "available" || availability.kind === "almostFull";
  const isWaitingList = availability.kind === "waitingList";
  const isWaitingListBooking = booking?.type === "groupActivityWaitingListBooking";
  const displayedAvailabilityKind = booking
    ? isWaitingListBooking
      ? "waitingListBooked"
      : "booked"
    : availability.kind;
  const statusTone =
    hasStarted || availability.kind === "full" || availability.kind === "cancelled"
      ? "neutral"
      : displayedAvailabilityKind === "almostFull" ||
          displayedAvailabilityKind === "waitingList" ||
          displayedAvailabilityKind === "waitingListBooked"
        ? "warning"
        : "positive";
  const bookingCopy = isWaitingList ? "schedule.waitingList" : "schedule.booking";
  const availabilityLabel = hasRemaining
    ? t(`schedule.availability.${availability.kind}`, { count: availability.remaining })
    : t(`schedule.availability.${availability.kind}`);
  const availabilityText = hasRemaining
    ? t(`schedule.availability.${availability.kind}Text`, { count: availability.remaining })
    : undefined;
  const canBook = !booking && activityState.canBook && onBook !== undefined;
  const canCancel =
    booking?.type === "groupActivityBooking" &&
    booking.groupActivityBooking?.id !== undefined &&
    onCancel !== undefined;
  const Heading = `h${headingLevel}` as const;
  const showWaitingCount =
    waitingCount !== undefined &&
    (isWaitingListBooking || (availability.kind === "waitingList" && !hasStarted));
  const waitingCountLabel = showWaitingCount
    ? t(
        isWaitingListBooking
          ? "schedule.availability.waitingListBookedSummary"
          : "schedule.availability.waitingListSummary",
        { count: waitingCount },
      )
    : undefined;
  const hasDetails = Boolean(internalMessage || hasSpotDetails);
  const durationLabel =
    start && end
      ? `${timeFormatter.format(start)}–${timeFormatter.format(end)}`
      : t("schedule.timeUnknown");

  return (
    <article
      ref={cardRef}
      className={`${styles.card} ${hasDetails ? styles.clickable : ""}`}
      data-availability={displayedAvailabilityKind}
      data-started={(hasStarted && !activity.cancelled) || undefined}
      onClick={(event) => {
        if (
          !hasDetails ||
          (event.target as Element).closest("button, a, input, select, textarea, [role='button']")
        )
          return;
        setIsExpanded((expanded) => !expanded);
      }}
      tabIndex={-1}
    >
      <div className={styles.content}>
        <Heading>
          {displayName}
          <FavoriteMarker isFavorite={isFavoriteActivityType} />
        </Heading>
        {classListDuration || hasInstructors || locations ? (
          <p className={styles.metadata}>
            {classListDuration ? (
              <span className={styles.metadataItem}>
                <Clock aria-hidden="true" />
                <span className={styles.visuallyHidden}>{t("schedule.details.duration")}: </span>
                {classListDuration}
              </span>
            ) : null}
            {hasInstructors ? (
              <span className={styles.metadataItem}>
                <User aria-hidden="true" />
                <span className={styles.visuallyHidden}>{t("schedule.filters.instructor")}: </span>
                <span>
                  <FavoriteInstructorNames
                    instructors={activity.instructors}
                    favoriteInstructorIds={favoriteInstructorIds}
                  />
                </span>
              </span>
            ) : null}
            {locations ? (
              <span className={styles.metadataItem}>
                <MapPin aria-hidden="true" />
                <span className={styles.visuallyHidden}>{t("schedule.filters.location")}: </span>
                {locations}
              </span>
            ) : null}
          </p>
        ) : null}
        {hasDetails ? (
          <button
            type="button"
            className={styles.expand}
            aria-expanded={isExpanded}
            aria-controls={detailsId}
            onClick={() => setIsExpanded((expanded) => !expanded)}
          >
            <span className={styles.visuallyHidden}>
              {t(isExpanded ? "schedule.details.hide" : "schedule.details.show")}
            </span>
            <NavArrowDown aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <div className={styles.actions}>
        <StatusLabel
          tone={statusTone}
          dynamic={!hasStarted && availability.kind !== "cancelled"}
          aria-live="polite"
          aria-atomic="true"
        >
          {waitingCountLabel ? (
            waitingCountLabel
          ) : booking ? (
            t(
              isWaitingListBooking
                ? "schedule.availability.waitingListBooked"
                : "schedule.availability.booked",
            )
          ) : availability.kind === "cancelled" ? (
            availabilityLabel
          ) : hasStarted ? (
            participantCount !== undefined ? (
              t(
                hasEnded
                  ? "schedule.availability.participated"
                  : "schedule.availability.participating",
                { count: participantCount },
              )
            ) : null
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
        </StatusLabel>
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
      {externalMessage ? (
        <section className={styles.message} data-message-type="external">
          <h3>{t("schedule.information.forThisClass")}</h3>
          <p>{externalMessage}</p>
        </section>
      ) : null}
      {isExpanded ? (
        <div className={styles.information} id={detailsId}>
          <p className={styles.detailItem}>
            <Clock aria-hidden="true" />
            {t("schedule.details.time", { time: durationLabel })}
          </p>
          <ActivitySpotAvailability available={leftToBook} total={totalBookable} />
          {internalMessage ? (
            <section className={styles.message} data-message-type="internal">
              <h3>{t("schedule.information.aboutClass")}</h3>
              <p>{internalMessage}</p>
            </section>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export function GymClassCardSkeleton() {
  const { t } = useTranslation();
  return <div className={styles.skeleton} aria-label={t("schedule.loading")} />;
}
