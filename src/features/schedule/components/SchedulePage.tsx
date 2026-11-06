import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { lazy, Suspense, useId, useLayoutEffect, useRef, useState } from "react";
import { NavArrowDown } from "iconoir-react";
import { Button as AriaButton } from "react-aria-components";
import { useTranslation } from "react-i18next";
import {
  cancelGroupActivityBookingMutationOptions,
  createGroupActivityBookingMutationOptions,
} from "../../bookings/api/bookingMutations";
import { customerGroupActivityBookingsQueryOptions } from "../../bookings/api/bookingQueries";
import type { LoginCredentials } from "../../auth/api/auth";
import type { CustomerSession } from "../../auth/sessionContext";
import { SignInDialog } from "../../auth/SignInAction";
import { bookingsByActivityId } from "../../bookings/model/bookings";
import { Button } from "../../../ui/button/Button";
import { EmptyState } from "../../../ui/feedback/EmptyState";
import { ErrorMessage } from "../../../ui/feedback/ErrorMessage";
import { ViewLoading } from "../../../ui/feedback/ViewLoading";
import { activityTypeQueryOptions, instructorQueryOptions } from "../api/scheduleFilterQueries";
import { scheduleQueryOptions } from "../api/scheduleQueries";
import {
  getAvailability,
  groupActivitiesByStart,
  splitStartedGroups,
  type ScheduledActivity,
  type TimeGroup,
} from "../model/schedule";
import { addDays } from "../model/scheduleDate";
import { readSchedulePreferences } from "../model/schedulePreferences";
import interactionStyles from "../../../ui/interaction/Interaction.module.css";
import type { ScheduleSearch } from "../model/scheduleSearch";
import { GymClassCard, GymClassCardSkeleton } from "./GymClassCard";
import { ScheduleFilters } from "./ScheduleFilters";
import { ScheduleFilterSummary } from "./ScheduleFilterSummary";
import styles from "./SchedulePage.module.css";

const ScheduleFilterPanel = lazy(() =>
  import("./ScheduleFilterPanel").then((module) => ({ default: module.ScheduleFilterPanel })),
);
const RoomCalendar = lazy(() =>
  import("./RoomCalendar").then((module) => ({ default: module.RoomCalendar })),
);

export interface SchedulePageProps {
  search: ScheduleSearch;
  onSearchChange: (search: ScheduleSearch) => void;
  onSelectedActivityChange?: (activity: number | undefined, replace?: boolean) => void;
  customerId?: string;
  /** Lets a signed-out customer start booking: sign-in then continues to the confirmation. */
  onSignIn?: (credentials: LoginCredentials, remember: boolean) => Promise<CustomerSession>;
}

export function SchedulePage({
  search,
  onSearchChange,
  onSelectedActivityChange,
  customerId,
  onSignIn,
}: SchedulePageProps) {
  const { t, i18n } = useTranslation();
  const pageRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLElement>(null);
  const stickyControlsRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const isFiltersOpen = search.view === "filters";
  const [areControlsElevated, setAreControlsElevated] = useState(false);
  /** Undefined until the customer chooses, so a shared link to an earlier class can open it. */
  const [showEarlier, setShowEarlier] = useState<boolean>();
  const earlierClassesId = useId();
  const [favoriteFilters, setFavoriteFilters] = useState(() => {
    const { favoriteInstructorIds, favoriteActivityTypeIds } = readSchedulePreferences();
    return { favoriteInstructorIds, favoriteActivityTypeIds };
  });

  useLayoutEffect(() => {
    const controls = stickyControlsRef.current;
    const page = pageRef.current;
    if (!controls || !page) return;

    const updateStickyOffset = () => {
      page.style.setProperty("--schedule-sticky-offset", `${controls.offsetHeight}px`);
    };
    const updateElevation = () => {
      setAreControlsElevated(
        controls.getBoundingClientRect().top <= 0 && page.getBoundingClientRect().top < 0,
      );
    };

    updateStickyOffset();
    updateElevation();
    window.addEventListener("scroll", updateElevation, { passive: true });

    const observer =
      typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(updateStickyOffset);
    observer?.observe(controls);
    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", updateElevation);
      page.style.removeProperty("--schedule-sticky-offset");
    };
  }, [isFiltersOpen]);
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
  const canCreateBooking = customerId !== undefined && bookings.isSuccess;
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [signInActivity, setSignInActivity] = useState<ScheduledActivity>();
  /** The class whose booking confirmation is open, so sign-in can continue straight into it. */
  const [confirmingBookingId, setConfirmingBookingId] = useState<number>();
  const openSignInToBook =
    customerId === undefined && onSignIn
      ? (activity: ScheduledActivity) => {
          setSignInActivity(activity);
          setIsSignInOpen(true);
        }
      : undefined;

  const continueToBooking = async (signedInCustomerId: string, activityId: number) => {
    try {
      // Booking waits for the customer's bookings anyway, and they show whether this class is taken.
      const customerBookings = await queryClient.fetchQuery(
        customerGroupActivityBookingsQueryOptions(signedInCustomerId),
      );
      if (!bookingsByActivityId(customerBookings).has(activityId)) {
        setConfirmingBookingId(activityId);
      } else {
        // Already booked: the Book button is gone, so focus the row that now says so.
        setTimeout(() =>
          listRef.current
            ?.querySelector<HTMLElement>(`[data-activity-id="${activityId}"]`)
            ?.focus(),
        );
      }
    } catch {
      // The page reports that booking status could not be checked and offers to try again.
    }
  };
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
  const titleDate = new Date(`${search.date}T12:00:00Z`);
  const titleFormatters = {
    weekday: new Intl.DateTimeFormat(i18n.resolvedLanguage, { weekday: "long", timeZone: "UTC" }),
    date: new Intl.DateTimeFormat(i18n.resolvedLanguage, {
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    }),
  };
  const signInTimeFormatter = new Intl.DateTimeFormat(i18n.resolvedLanguage, {
    timeZone: "Europe/Stockholm",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const signInBookingCopy =
    signInActivity && getAvailability(signInActivity).kind === "waitingList"
      ? "schedule.waitingList"
      : "schedule.booking";
  const groupedSchedule = groupActivitiesByStart(scheduleData);
  // Today opens at the next class: classes that have already started cannot be booked.
  const { started: earlierGroups, upcoming: laterGroups } = splitStartedGroups(
    groupedSchedule,
    search.date,
  );
  const earlierClassCount = earlierGroups.reduce(
    (count, group) => count + group.activities.length,
    0,
  );
  const isSelectedActivityEarlier = earlierGroups.some((group) =>
    group.activities.some(({ id }) => id !== undefined && id === search.activity),
  );
  const isEarlierExpanded = showEarlier ?? isSelectedActivityEarlier;
  const view = search.view ?? "classes";
  const isPending = scheduleQueries.some((query) => query.isPending);
  const isFetching = scheduleQueries.some((query) => query.isFetching);
  const failedScheduleQueries = scheduleQueries.filter((query) => query.isError);
  const isError =
    scheduleQueries.length > 0 && failedScheduleQueries.length === scheduleQueries.length;
  const isPartialError = failedScheduleQueries.length > 0 && !isError;
  const isSelectedActivityMissing =
    search.activity !== undefined &&
    !isPending &&
    !isFetching &&
    failedScheduleQueries.length === 0 &&
    !availableScheduleData.some(({ id }) => id === search.activity);
  const failedFilterQueries = [instructors, activityTypes].filter((query) => query.isError);

  const retrySchedule = () => {
    void Promise.all(failedScheduleQueries.map((query) => query.refetch()));
  };
  const retryFilterOptions = () => {
    void Promise.all(failedFilterQueries.map((query) => query.refetch()));
  };

  const renderTimeGroup = (group: TimeGroup) => (
    <section
      className={styles.timeGroup}
      key={group.start || "unknown"}
      aria-labelledby={`time-${group.start || "unknown"}`}
    >
      <h2 id={`time-${group.start || "unknown"}`}>
        {group.start ? timeFormatter.format(new Date(group.start)) : t("schedule.timeUnknown")}
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
              headingLevel={3}
              favoriteInstructorIds={favoriteFilters.favoriteInstructorIds}
              favoriteActivityTypeIds={favoriteFilters.favoriteActivityTypeIds}
              includeBusinessUnitName={search.locations.length > 1}
              allowShare
              {...(onSelectedActivityChange
                ? {
                    isExpanded: search.activity === activity.id,
                    onExpandedChange: (isExpanded: boolean) =>
                      onSelectedActivityChange(isExpanded ? activity.id : undefined, !isExpanded),
                  }
                : {})}
              onBook={
                !canCreateBooking || activity.id === undefined
                  ? undefined
                  : () =>
                      createBooking.mutateAsync({
                        customerId,
                        groupActivity: activity.id!,
                        allowWaitingList: getAvailability(activity).kind === "waitingList",
                      })
              }
              onSignInToBook={
                openSignInToBook && activity.id !== undefined
                  ? () => openSignInToBook(activity)
                  : undefined
              }
              isBookingConfirmationOpen={
                activity.id !== undefined && activity.id === confirmingBookingId
              }
              onBookingConfirmationOpenChange={(isOpen) =>
                setConfirmingBookingId(isOpen ? activity.id : undefined)
              }
              onCancel={onCancel}
            />
          );
        })}
      </div>
    </section>
  );

  return (
    <main
      ref={pageRef}
      className={`${styles.page} ${view === "rooms" ? styles.roomsPage : ""}`}
      data-filters-open={isFiltersOpen || undefined}
      aria-label={t(
        view === "filters"
          ? "schedule.filters.filters"
          : view === "rooms"
            ? "rooms.title"
            : "schedule.title",
      )}
    >
      {!isFiltersOpen ? (
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>
            <span className={styles.titleWeekday}>{titleFormatters.weekday.format(titleDate)}</span>{" "}
            <em>{titleFormatters.date.format(titleDate)}</em>
          </h1>
          <ScheduleFilterSummary
            search={search}
            onChange={onSearchChange}
            instructors={instructors.data}
            activityTypes={activityTypes.data}
          />
        </header>
      ) : null}

      {!isFiltersOpen ? (
        <div
          ref={stickyControlsRef}
          className={styles.stickyControls}
          data-elevated={areControlsElevated || undefined}
        >
          <ScheduleFilters search={search} onChange={onSearchChange} />
        </div>
      ) : null}

      {isFiltersOpen ? (
        <Suspense fallback={<ViewLoading />}>
          <ScheduleFilterPanel
            search={search}
            onChange={onSearchChange}
            instructors={instructors.data}
            activityTypes={activityTypes.data}
            isLoadingOptions={instructors.isPending || activityTypes.isPending}
            hasOptionsError={failedFilterQueries.length > 0}
            onRetryOptions={retryFilterOptions}
            onFavoriteFiltersChange={setFavoriteFilters}
          />
        </Suspense>
      ) : (
        <>
          {customerId !== undefined && bookings.isPending ? (
            <p className={styles.statusRegion} role="status">
              {t("bookings.loading")}
            </p>
          ) : null}
          {customerId !== undefined && bookings.isError ? (
            <div className={styles.statusRegion}>
              <ErrorMessage
                action={
                  <Button
                    tone="quiet"
                    isDisabled={bookings.isFetching}
                    onPress={() => void bookings.refetch()}
                  >
                    {t("bookings.retry")}
                  </Button>
                }
              >
                {t("schedule.bookingStatusError")}
              </ErrorMessage>
            </div>
          ) : null}
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
            ref={listRef}
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
            {isSelectedActivityMissing ? (
              <EmptyState>{t("schedule.sharedClassUnavailable")}</EmptyState>
            ) : null}
            {!isPending && !isError && !isSelectedActivityMissing && scheduleData.length === 0 ? (
              <EmptyState>{t(view === "rooms" ? "rooms.empty" : "schedule.empty")}</EmptyState>
            ) : null}
            {!isPending && !isError && scheduleData.length > 0 && view === "rooms" ? (
              <Suspense fallback={<ViewLoading />}>
                <RoomCalendar
                  activities={scheduleData}
                  date={search.date}
                  bookingsByActivity={bookingsByActivity}
                  customerId={customerId}
                  favoriteInstructorIds={favoriteFilters.favoriteInstructorIds}
                  favoriteActivityTypeIds={favoriteFilters.favoriteActivityTypeIds}
                  includeBusinessUnitName={search.locations.length > 1}
                  selectedActivityId={search.activity}
                  onSelectedActivityChange={onSelectedActivityChange}
                  onBook={
                    canCreateBooking
                      ? (activity) =>
                          createBooking.mutateAsync({
                            customerId: customerId!,
                            groupActivity: activity.id!,
                            allowWaitingList: getAvailability(activity).kind === "waitingList",
                          })
                      : undefined
                  }
                  onSignInToBook={openSignInToBook}
                  confirmingBookingId={confirmingBookingId}
                  onConfirmingBookingChange={setConfirmingBookingId}
                  onCancel={(bookingId) =>
                    cancelBooking.mutateAsync({ customerId: customerId!, bookingId })
                  }
                />
              </Suspense>
            ) : null}
            {!isPending && !isError && view === "classes" && earlierGroups.length > 0 ? (
              <>
                <AriaButton
                  className={`${styles.earlierToggle} ${interactionStyles.control}`}
                  aria-expanded={isEarlierExpanded}
                  aria-controls={earlierClassesId}
                  onPress={() => setShowEarlier(!isEarlierExpanded)}
                >
                  <span>
                    <strong>{t("schedule.earlier.title")}</strong>
                    <span aria-hidden="true"> · </span>
                    <span className={styles.visuallyHidden}>, </span>
                    {t("schedule.earlier.count", { count: earlierClassCount })}
                  </span>
                  <NavArrowDown aria-hidden="true" />
                </AriaButton>
                <div
                  id={earlierClassesId}
                  className={styles.earlierGroups}
                  hidden={!isEarlierExpanded}
                >
                  {isEarlierExpanded ? earlierGroups.map(renderTimeGroup) : null}
                </div>
              </>
            ) : null}
            {!isPending && !isError && view === "classes" ? laterGroups.map(renderTimeGroup) : null}
            {!isPending &&
            !isError &&
            view === "classes" &&
            earlierGroups.length > 0 &&
            laterGroups.length === 0 ? (
              <EmptyState
                action={
                  <Button
                    tone="secondary"
                    onPress={() => onSearchChange({ ...search, date: addDays(search.date, 1) })}
                  >
                    {t("schedule.earlier.showTomorrow")}
                  </Button>
                }
              >
                {t("schedule.earlier.noMoreToday")}
              </EmptyState>
            ) : null}
          </section>
        </>
      )}
      {onSignIn ? (
        <SignInDialog
          isOpen={isSignInOpen}
          onOpenChange={setIsSignInOpen}
          onSignIn={async (credentials, remember) => {
            const customer = await onSignIn(credentials, remember);
            if (signInActivity?.id !== undefined) {
              await continueToBooking(customer.customerId, signInActivity.id);
            }
          }}
          title={t(`${signInBookingCopy}.signInTitle`)}
          description={
            signInActivity ? (
              <>
                <p>
                  {[
                    signInActivity.name ?? t("schedule.unnamedClass"),
                    signInActivity.duration?.start
                      ? signInTimeFormatter.format(new Date(signInActivity.duration.start))
                      : undefined,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p>{t(`${signInBookingCopy}.signInNext`)}</p>
              </>
            ) : undefined
          }
          submitLabel={t("schedule.booking.signInSubmit")}
        />
      ) : null}
    </main>
  );
}
