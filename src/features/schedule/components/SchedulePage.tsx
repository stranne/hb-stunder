import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLayoutEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  cancelGroupActivityBookingMutationOptions,
  createGroupActivityBookingMutationOptions,
} from "../../bookings/api/bookingMutations";
import { customerGroupActivityBookingsQueryOptions } from "../../bookings/api/bookingQueries";
import { bookingsByActivityId } from "../../bookings/model/bookings";
import { Button } from "../../../ui/button/Button";
import { ErrorMessage } from "../../../ui/feedback/ErrorMessage";
import { activityTypeQueryOptions, instructorQueryOptions } from "../api/scheduleFilterQueries";
import { scheduleQueryOptions } from "../api/scheduleQueries";
import { getAvailability, groupActivitiesByStart } from "../model/schedule";
import type { ScheduleSearch } from "../model/scheduleSearch";
import { GymClassCard, GymClassCardSkeleton } from "./GymClassCard";
import { ScheduleFilters } from "./ScheduleFilters";
import { RoomCalendar } from "./RoomCalendar";
import styles from "./SchedulePage.module.css";

export interface SchedulePageProps {
  search: ScheduleSearch;
  onSearchChange: (search: ScheduleSearch) => void;
  customerId?: string;
}

export function SchedulePage({ search, onSearchChange, customerId }: SchedulePageProps) {
  const { t, i18n } = useTranslation();
  const pageRef = useRef<HTMLElement>(null);
  const stickyControlsRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  useLayoutEffect(() => {
    const controls = stickyControlsRef.current;
    const page = pageRef.current;
    if (!controls || !page) return;

    const updateStickyOffset = () => {
      page.style.setProperty("--schedule-sticky-offset", `${controls.offsetHeight}px`);
    };

    updateStickyOffset();
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(updateStickyOffset);
    observer.observe(controls);
    return () => observer.disconnect();
  }, []);
  const createBooking = useMutation(createGroupActivityBookingMutationOptions(queryClient));
  const cancelBooking = useMutation(cancelGroupActivityBookingMutationOptions(queryClient));
  const scheduleQueries = useQueries({
    queries: search.locations.map((businessUnit) =>
      scheduleQueryOptions({ businessUnit, date: search.date }),
    ),
  });
  const instructors = useQuery(instructorQueryOptions());
  const activityTypes = useQuery(activityTypeQueryOptions());
  const bookings = useQuery(customerGroupActivityBookingsQueryOptions(customerId));
  const bookingsByActivity = bookingsByActivityId(bookings.data ?? []);
  const availableScheduleData = [
    ...new Map(
      scheduleQueries
        .flatMap((query) => query.data ?? [])
        .map((activity) => [
          activity.id ?? `${activity.businessUnit?.id}-${activity.duration?.start}`,
          activity,
        ]),
    ).values(),
  ];
  const availableInstructorIds = new Set(
    availableScheduleData.flatMap(
      (activity) => activity.instructors?.flatMap(({ id }) => (id ? [id] : [])) ?? [],
    ),
  );
  const availableActivityTypeIds = new Set(
    availableScheduleData.flatMap((activity) =>
      activity.groupActivityProduct?.id ? [activity.groupActivityProduct.id] : [],
    ),
  );
  const availableInstructors = instructors.data?.filter(({ id }) => availableInstructorIds.has(id));
  const availableActivityTypes = activityTypes.data?.filter(({ id }) =>
    availableActivityTypeIds.has(id),
  );
  const scheduleData = availableScheduleData
    .filter(
      (activity) =>
        (search.instructors.length === 0 ||
          activity.instructors?.some((instructor) =>
            instructor.id ? search.instructors.includes(instructor.id) : false,
          )) &&
        (search.activityTypes.length === 0 ||
          (activity.groupActivityProduct?.id
            ? search.activityTypes.includes(activity.groupActivityProduct.id)
            : false)),
    )
    .sort((a, b) => (a.duration?.start ?? "").localeCompare(b.duration?.start ?? ""));
  const timeFormatter = new Intl.DateTimeFormat(i18n.resolvedLanguage, {
    timeZone: "Europe/Stockholm",
    hour: "2-digit",
    minute: "2-digit",
  });
  const groupedSchedule = groupActivitiesByStart(scheduleData);
  const view = search.view ?? "classes";
  const isPending = scheduleQueries.some((query) => query.isPending);
  const isFetching = scheduleQueries.some((query) => query.isFetching);
  const failedScheduleQueries = scheduleQueries.filter((query) => query.isError);
  const isError =
    scheduleQueries.length > 0 && failedScheduleQueries.length === scheduleQueries.length;
  const isPartialError = failedScheduleQueries.length > 0 && !isError;
  const failedFilterQueries = [instructors, activityTypes].filter((query) => query.isError);

  const retrySchedule = () => {
    void Promise.all(failedScheduleQueries.map((query) => query.refetch()));
  };
  const retryFilterOptions = () => {
    void Promise.all(failedFilterQueries.map((query) => query.refetch()));
  };

  return (
    <main ref={pageRef} className={`${styles.page} ${view === "rooms" ? styles.roomsPage : ""}`}>
      <div ref={stickyControlsRef} className={styles.stickyControls}>
        <ScheduleFilters
          search={search}
          onChange={onSearchChange}
          instructors={availableInstructors}
          activityTypes={availableActivityTypes}
          isLoadingOptions={instructors.isPending || activityTypes.isPending}
          hasOptionsError={failedFilterQueries.length > 0}
          onRetryOptions={retryFilterOptions}
        />
      </div>

      {isPartialError ? (
        <div className={styles.statusRegion}>
          <ErrorMessage
            action={
              <Button tone="quiet" onPress={retrySchedule}>
                {t("schedule.retry")}
              </Button>
            }
          >
            {t("schedule.partialError", { count: failedScheduleQueries.length })}
          </ErrorMessage>
        </div>
      ) : null}
      <section
        className={styles.list}
        data-view={view}
        aria-label={t(view === "rooms" ? "rooms.calendarLabel" : "schedule.listLabel")}
        aria-busy={isFetching}
      >
        {isPending ? (
          <>
            <GymClassCardSkeleton />
            <GymClassCardSkeleton />
          </>
        ) : null}
        {isError ? (
          <ErrorMessage action={<Button onPress={retrySchedule}>{t("schedule.retry")}</Button>}>
            {t("schedule.error")}
          </ErrorMessage>
        ) : null}
        {!isPending && !isError && scheduleData.length === 0 ? (
          <p className={styles.notice}>{t(view === "rooms" ? "rooms.empty" : "schedule.empty")}</p>
        ) : null}
        {!isPending && !isError && scheduleData.length > 0 && view === "rooms" ? (
          <RoomCalendar
            activities={scheduleData}
            date={search.date}
            bookingsByActivity={bookingsByActivity}
            customerId={customerId}
            onBook={(activity) =>
              createBooking.mutateAsync({
                customerId: customerId!,
                groupActivity: activity.id!,
                allowWaitingList: getAvailability(activity).kind === "waitingList",
              })
            }
            onCancel={(bookingId) =>
              cancelBooking.mutateAsync({ customerId: customerId!, bookingId })
            }
          />
        ) : null}
        {!isPending && !isError && view === "classes"
          ? groupedSchedule.map((group) => (
              <section
                className={styles.timeGroup}
                key={group.start || "unknown"}
                aria-labelledby={`time-${group.start || "unknown"}`}
              >
                <h2 id={`time-${group.start || "unknown"}`}>
                  {group.start
                    ? timeFormatter.format(new Date(group.start))
                    : t("schedule.timeUnknown")}
                </h2>
                <div className={styles.groupCards}>
                  {group.activities.map((activity, index) => {
                    const booking =
                      activity.id === undefined ? undefined : bookingsByActivity.get(activity.id);
                    const bookingId = booking?.groupActivityBooking?.id;
                    const onCancel =
                      customerId !== undefined &&
                      booking?.type === "groupActivityBooking" &&
                      bookingId !== undefined
                        ? () => cancelBooking.mutateAsync({ customerId, bookingId })
                        : undefined;
                    return (
                      <GymClassCard
                        key={activity.id ?? `${activity.duration?.start}-${index}`}
                        activity={activity}
                        booking={booking}
                        showTime={false}
                        headingLevel={3}
                        onBook={
                          customerId === undefined || activity.id === undefined
                            ? undefined
                            : () =>
                                createBooking.mutateAsync({
                                  customerId,
                                  groupActivity: activity.id!,
                                  allowWaitingList:
                                    getAvailability(activity).kind === "waitingList",
                                })
                        }
                        onCancel={onCancel}
                      />
                    );
                  })}
                </div>
              </section>
            ))
          : null}
      </section>
    </main>
  );
}
