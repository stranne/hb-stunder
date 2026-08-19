import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Dialog, Heading, Modal } from "react-aria-components";
import { Calendar, Clock, MapPin, User, Xmark } from "iconoir-react";
import { useTranslation } from "react-i18next";
import type { GroupActivityBooking } from "../../bookings/model/bookings";
import { AsyncConfirmationAction } from "../../../ui/confirmation/AsyncConfirmationAction";
import interactionStyles from "../../../ui/interaction/Interaction.module.css";
import type { ActivityState, ScheduledActivity } from "../model/schedule";
import { getActivityState } from "../model/schedule";
import { todayInStockholm } from "../model/scheduleDate";
import { ActivitySpotAvailability } from "./ActivitySpotAvailability";
import { FavoriteInstructorNames, FavoriteMarker } from "./ScheduleFavoriteLabels";
import styles from "./RoomCalendar.module.css";

interface RoomActivity {
  key: string;
  roomKey: string;
  roomName: string;
  businessUnitKey: string;
  businessUnitName?: string;
  activity: ScheduledActivity;
}

export interface RoomCalendarProps {
  activities: ScheduledActivity[];
  date: string;
  bookingsByActivity: Map<number, GroupActivityBooking>;
  customerId?: string;
  onBook: (activity: ScheduledActivity) => Promise<void>;
  onCancel: (bookingId: number) => Promise<void>;
  favoriteInstructorIds?: number[];
  favoriteActivityTypeIds?: number[];
  includeBusinessUnitName?: boolean;
}

function minutesInStockholm(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Stockholm",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  const minute = Number(parts.find((part) => part.type === "minute")?.value);
  return Number.isFinite(hour) && Number.isFinite(minute) ? hour * 60 + minute : undefined;
}

function timeLabel(value: string | undefined, language: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(language, {
    timeZone: "Europe/Stockholm",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function dateLabel(value: string | undefined, language: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(language, {
    timeZone: "Europe/Stockholm",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(value));
}

function instructorNames(activity: ScheduledActivity) {
  return activity.instructors
    ?.map(({ name }) => name)
    .filter(Boolean)
    .join(", ");
}

// Business-unit and room names are Swedish proper names, so keep their order
// consistent across browser and interface locales (Å, Ä and Ö sort after Z).
const nameCollator = new Intl.Collator("sv", {
  usage: "sort",
  sensitivity: "base",
  numeric: true,
});

/** One block is rendered for every assigned room, including activities assigned to multiple rooms. */
export function RoomCalendar({
  activities,
  date,
  bookingsByActivity,
  customerId,
  onBook,
  onCancel,
  favoriteInstructorIds = [],
  favoriteActivityTypeIds = [],
  includeBusinessUnitName = false,
}: RoomCalendarProps) {
  const { i18n, t } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const [detail, setDetail] = useState<RoomActivity | undefined>();
  const [now, setNow] = useState(() => new Date());
  const scrollerRef = useRef<HTMLDivElement>(null);
  const headerViewportRef = useRef<HTMLDivElement>(null);
  const roomHeadersRef = useRef<HTMLDivElement>(null);
  const updateBusinessUnitLabels = useCallback((scrollLeft: number) => {
    const viewportWidth = headerViewportRef.current?.clientWidth ?? 0;
    roomHeadersRef.current
      ?.querySelectorAll<HTMLElement>(`.${styles.businessUnitGroup}`)
      .forEach((group) => {
        const groupStart = group.offsetLeft;
        const visibleStart = Math.max(groupStart, scrollLeft);
        const visibleEnd = Math.min(groupStart + group.offsetWidth, scrollLeft + viewportWidth);
        group.style.setProperty("--business-unit-visible-start", `${visibleStart - groupStart}px`);
        group.style.setProperty(
          "--business-unit-visible-width",
          `${Math.max(0, visibleEnd - visibleStart)}px`,
        );
      });
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(interval);
  }, []);
  const roomActivities = activities.flatMap((activity) =>
    (activity.locations ?? []).flatMap((room) => {
      if (room.id === undefined) return [];
      const businessUnitKey =
        activity.businessUnit?.id === undefined
          ? `name:${activity.businessUnit?.name ?? "unknown"}`
          : String(activity.businessUnit.id);
      const roomKey = `${businessUnitKey}-${room.id}`;
      return [
        {
          key: `${activity.id ?? activity.duration?.start}-${roomKey}`,
          roomKey,
          roomName: room.name ?? t("rooms.unnamedRoom"),
          businessUnitKey,
          businessUnitName: activity.businessUnit?.name,
          activity,
        },
      ];
    }),
  );
  const rooms = [...new Map(roomActivities.map((item) => [item.roomKey, item])).values()].sort(
    (left, right) =>
      nameCollator.compare(left.businessUnitName ?? "", right.businessUnitName ?? "") ||
      nameCollator.compare(left.businessUnitKey, right.businessUnitKey) ||
      nameCollator.compare(left.roomName, right.roomName) ||
      nameCollator.compare(left.roomKey, right.roomKey),
  );
  const businessUnitGroups = rooms.reduce<
    Array<{ key: string; name?: string; start: number; count: number }>
  >((groups, room, roomIndex) => {
    const previous = groups.at(-1);
    if (previous?.key === room.businessUnitKey) {
      previous.count += 1;
    } else {
      groups.push({
        key: room.businessUnitKey,
        name: room.businessUnitName,
        start: roomIndex,
        count: 1,
      });
    }
    return groups;
  }, []);
  const groupLayoutKey = businessUnitGroups.map(({ key, count }) => `${key}:${count}`).join("|");
  const timedActivities = roomActivities.filter(
    ({ activity }) =>
      minutesInStockholm(activity.duration?.start) !== undefined &&
      minutesInStockholm(activity.duration?.end) !== undefined,
  );
  const starts = timedActivities.map(({ activity }) =>
    minutesInStockholm(activity.duration?.start)!,
  );
  const ends = timedActivities.map(({ activity }) => minutesInStockholm(activity.duration?.end)!);
  const currentMinute =
    date === todayInStockholm(now) ? minutesInStockholm(now.toISOString()) : undefined;
  const visibleMinutes = currentMinute === undefined ? [] : [currentMinute];
  const startMinute = Math.max(
    0,
    Math.floor((Math.min(...starts, ...visibleMinutes, 8 * 60) - 30) / 60) * 60,
  );
  const endMinute = Math.min(
    24 * 60,
    Math.ceil((Math.max(...ends, ...visibleMinutes, 20 * 60) + 30) / 60) * 60,
  );
  const hourHeight = 72;
  const calendarInset = 12;
  const contentHeight = Math.max(hourHeight * 4, ((endMinute - startMinute) / 60) * hourHeight);
  const gridStyle = {
    gridTemplateColumns: `4rem repeat(${rooms.length}, minmax(12rem, 1fr))`,
    "--calendar-height": `${contentHeight + calendarInset * 2}px`,
    "--calendar-inset": `${calendarInset}px`,
    "--hour-height": `${hourHeight}px`,
  } as CSSProperties;
  const roomHeaderStyle = {
    gridTemplateColumns: `repeat(${rooms.length}, minmax(12rem, 1fr))`,
  } as CSSProperties;
  const currentTimeStyle =
    currentMinute === undefined
      ? undefined
      : ({
          "--current-time-top": `${calendarInset + ((currentMinute - startMinute) / 60) * hourHeight}px`,
        } as CSSProperties);
  const detailInstructors = detail ? instructorNames(detail.activity) : undefined;
  const detailState = detail ? getActivityState(detail.activity, now.getTime()) : undefined;
  const detailBooking =
    detail?.activity.id === undefined ? undefined : bookingsByActivity.get(detail.activity.id);

  useLayoutEffect(() => {
    const update = () => updateBusinessUnitLabels(scrollerRef.current?.scrollLeft ?? 0);
    update();
    window.addEventListener("resize", update);
    const resizeObserver =
      typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(update);
    if (headerViewportRef.current) resizeObserver?.observe(headerViewportRef.current);
    if (roomHeadersRef.current) resizeObserver?.observe(roomHeadersRef.current);
    return () => {
      window.removeEventListener("resize", update);
      resizeObserver?.disconnect();
    };
  }, [groupLayoutKey, updateBusinessUnitLabels]);

  if (rooms.length === 0) return <p className={styles.empty}>{t("rooms.empty")}</p>;

  return (
    <>
      <div className={styles.calendarFrame} aria-label={t("rooms.calendarLabel")}>
        <div className={styles.stickyHeader}>
          <div className={styles.corner} />
          <div ref={headerViewportRef} className={styles.headerViewport}>
            <div ref={roomHeadersRef} className={styles.roomHeaders} style={roomHeaderStyle}>
              {businessUnitGroups.map((group) => (
                <div
                  className={styles.businessUnitGroup}
                  key={group.key}
                  style={{ gridColumn: `${group.start + 1} / span ${group.count}` }}
                >
                  {group.name ? (
                    <div className={styles.businessUnitVisibleLabel}>
                      <strong title={group.name}>{group.name}</strong>
                    </div>
                  ) : null}
                </div>
              ))}
              {rooms.map((room, roomIndex) => (
                <div
                  className={styles.roomHeader}
                  key={room.roomKey}
                  style={{ gridColumn: roomIndex + 1 }}
                >
                  <strong>{room.roomName}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div
          ref={scrollerRef}
          className={styles.scroller}
          onScroll={(event) => {
            const scrollLeft = event.currentTarget.scrollLeft;
            if (roomHeadersRef.current) {
              roomHeadersRef.current.style.transform = `translateX(-${scrollLeft}px)`;
            }
            updateBusinessUnitLabels(scrollLeft);
          }}
        >
          <div className={styles.calendar} style={gridStyle}>
            <div className={styles.timeGutter} aria-hidden="true">
              {Array.from({ length: Math.ceil((endMinute - startMinute) / 60) + 1 }, (_, index) => (
                <span key={index} style={{ "--time-index": index } as CSSProperties}>
                  {String((startMinute / 60 + index) % 24).padStart(2, "0")}:00
                </span>
              ))}
            </div>
            {rooms.map((room, roomIndex) => (
              <div className={styles.roomTrack} key={room.roomKey}>
                {currentTimeStyle ? (
                  <div
                    className={styles.currentTimeLine}
                    style={currentTimeStyle}
                    role={roomIndex === 0 ? "img" : undefined}
                    aria-label={
                      roomIndex === 0
                        ? t("rooms.currentTime", { time: timeLabel(now.toISOString(), locale) })
                        : undefined
                    }
                    aria-hidden={roomIndex === 0 ? undefined : true}
                  />
                ) : null}
                {timedActivities
                  .filter((item) => item.roomKey === room.roomKey)
                  .map((item) => {
                    const start = minutesInStockholm(item.activity.duration?.start)!;
                    const end = minutesInStockholm(item.activity.duration?.end)!;
                    const top = calendarInset + ((start - startMinute) / 60) * hourHeight;
                    const blockHeight = Math.max(32, ((end - start) / 60) * hourHeight);
                    const instructors = instructorNames(item.activity);
                    const isFavoriteActivityType =
                      item.activity.groupActivityProduct?.id !== undefined &&
                      favoriteActivityTypeIds.includes(item.activity.groupActivityProduct.id);
                    const activityState = getActivityState(item.activity, now.getTime());
                    const { hasStarted } = activityState;
                    const booking =
                      item.activity.id === undefined
                        ? undefined
                        : bookingsByActivity.get(item.activity.id);
                    const bookingState = booking
                      ? booking.type === "groupActivityWaitingListBooking"
                        ? "waitingListBooked"
                        : "booked"
                      : undefined;
                    const spotDetails =
                      activityState.leftToBook !== undefined &&
                      activityState.totalBookable !== undefined
                        ? t("schedule.details.spots", {
                            available: activityState.leftToBook,
                            total: activityState.totalBookable,
                          })
                        : undefined;
                    const activityDetails = [
                      item.activity.name ?? t("schedule.unnamedClass"),
                      `${timeLabel(item.activity.duration?.start, locale)}–${timeLabel(item.activity.duration?.end, locale)}`,
                      item.roomName,
                      item.businessUnitName,
                      instructors,
                      spotDetails,
                      bookingState ? t(`schedule.availability.${bookingState}`) : undefined,
                      hasStarted ? t("schedule.availability.started") : undefined,
                    ]
                      .filter(Boolean)
                      .join(", ");
                    return (
                      <div
                        key={item.key}
                        className={styles.block}
                        style={{ top: top + 1, height: Math.max(30, blockHeight - 2) }}
                        data-started={hasStarted || undefined}
                        data-booking-state={bookingState}
                      >
                        <button
                          type="button"
                          className={styles.blockDetails}
                          onClick={() => setDetail(item)}
                          aria-label={t("rooms.openDetails", { details: activityDetails })}
                        >
                          <strong>
                            {item.activity.name ?? t("schedule.unnamedClass")}
                            <FavoriteMarker isFavorite={isFavoriteActivityType} />
                          </strong>
                          {instructors ? (
                            <span className={styles.instructors}>
                              <User aria-hidden="true" data-instructor-icon />
                              <span className={styles.visuallyHidden}>
                                {t("schedule.filters.instructor")}:{" "}
                              </span>
                              <FavoriteInstructorNames
                                instructors={item.activity.instructors}
                                favoriteInstructorIds={favoriteInstructorIds}
                              />
                            </span>
                          ) : null}
                        </button>
                        <ActivitySpotAvailability
                          available={activityState.leftToBook}
                          total={activityState.totalBookable}
                          hasStarted={hasStarted}
                          waitingCount={item.activity.slots?.inWaitingList}
                          presentation="edge"
                        />
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Modal
        className={styles.dialogBackdrop}
        isOpen={detail !== undefined}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDetail(undefined);
        }}
        isDismissable
      >
        <Dialog className={styles.dialog}>
          {({ close }) =>
            detail ? (
              <>
                <button
                  className={`${styles.close} ${interactionStyles.control} ${interactionStyles.quiet}`}
                  type="button"
                  onClick={close}
                  aria-label={t("rooms.closeDetails")}
                >
                  <Xmark aria-hidden="true" />
                </button>
                <Heading slot="title">
                  {detail.activity.name ?? t("schedule.unnamedClass")}
                  <FavoriteMarker
                    isFavorite={
                      detail.activity.groupActivityProduct?.id !== undefined &&
                      favoriteActivityTypeIds.includes(detail.activity.groupActivityProduct.id)
                    }
                  />
                </Heading>
                <div className={styles.dialogMetadata}>
                  <p>
                    <Calendar aria-hidden="true" />
                    {t("schedule.details.date", {
                      date: dateLabel(detail.activity.duration?.start, locale),
                    })}
                  </p>
                  <p>
                    <Clock aria-hidden="true" />
                    {t("schedule.details.time", {
                      time: `${timeLabel(detail.activity.duration?.start, locale)}–${timeLabel(detail.activity.duration?.end, locale)}`,
                    })}
                  </p>
                  <p>
                    <MapPin aria-hidden="true" />
                    <span className={styles.visuallyHidden}>
                      {t("schedule.filters.location")}:{" "}
                    </span>
                    {[
                      detail.roomName,
                      includeBusinessUnitName ? detail.businessUnitName : undefined,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  {detailInstructors ? (
                    <p>
                      <User aria-hidden="true" />
                      <span className={styles.visuallyHidden}>
                        {t("schedule.filters.instructor")}:{" "}
                      </span>
                      <FavoriteInstructorNames
                        instructors={detail.activity.instructors}
                        favoriteInstructorIds={favoriteInstructorIds}
                      />
                    </p>
                  ) : null}
                </div>
                {detailState ? (
                  <RoomActivityInformation activity={detail.activity} activityState={detailState} />
                ) : null}
                <RoomBookingAction
                  activity={detail.activity}
                  activityState={detailState!}
                  booking={detailBooking}
                  customerId={customerId}
                  onBook={onBook}
                  onCancel={onCancel}
                />
              </>
            ) : null
          }
        </Dialog>
      </Modal>
    </>
  );
}

function RoomActivityInformation({
  activity,
  activityState,
}: {
  activity: ScheduledActivity;
  activityState: ActivityState;
}) {
  const { t } = useTranslation();
  const externalMessage = activity.externalMessage?.trim();
  const internalMessage = activity.internalMessage?.trim();

  return (
    <div className={styles.activityInformation}>
      <ActivitySpotAvailability
        available={activityState.leftToBook}
        total={activityState.totalBookable}
        hasStarted={activityState.hasStarted}
        waitingCount={activity.slots?.inWaitingList}
      />
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
  );
}

function RoomBookingAction({
  activity,
  activityState,
  booking,
  customerId,
  onBook,
  onCancel,
}: Pick<RoomCalendarProps, "customerId" | "onBook" | "onCancel"> & {
  activity: ScheduledActivity;
  activityState: ActivityState;
  booking?: GroupActivityBooking;
}) {
  const { t } = useTranslation();
  const { availability } = activityState;
  const bookingId = booking?.groupActivityBooking?.id;
  if (booking?.type === "groupActivityBooking" && bookingId !== undefined && customerId) {
    return (
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
        onConfirm={() => onCancel(bookingId)}
        tone="danger"
        presentation="inline"
      />
    );
  }
  const canBook = !booking && customerId && activity.id !== undefined && activityState.canBook;
  if (!canBook) return null;
  const waiting = availability.kind === "waitingList";
  return (
    <AsyncConfirmationAction
      triggerLabel={t(waiting ? "schedule.waitingList.book" : "schedule.booking.book")}
      title={t(waiting ? "schedule.waitingList.confirmTitle" : "schedule.booking.confirmTitle")}
      message={t(
        waiting ? "schedule.waitingList.confirmMessage" : "schedule.booking.confirmMessage",
        { name: activity.name ?? t("schedule.unnamedClass") },
      )}
      cancelLabel={t("schedule.booking.cancel")}
      confirmLabel={t(waiting ? "schedule.waitingList.confirm" : "schedule.booking.confirm")}
      retryLabel={t(waiting ? "schedule.waitingList.retry" : "schedule.booking.retry")}
      pendingMessage={t(waiting ? "schedule.waitingList.pending" : "schedule.booking.pending")}
      errorMessage={t(waiting ? "schedule.waitingList.error" : "schedule.booking.error")}
      onConfirm={() => onBook(activity)}
      presentation="inline"
    />
  );
}
