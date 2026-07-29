import { useQueries, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "../../../ui/button/Button";
import { activityTypeQueryOptions, instructorQueryOptions } from "../api/scheduleFilterQueries";
import { scheduleQueryOptions } from "../api/scheduleQueries";
import type { ScheduleSearch } from "../model/scheduleSearch";
import { GymClassCard, GymClassCardSkeleton } from "./GymClassCard";
import { ScheduleFilters } from "./ScheduleFilters";
import styles from "./SchedulePage.module.css";

export interface SchedulePageProps {
  search: ScheduleSearch;
  onSearchChange: (search: ScheduleSearch) => void;
}

export function SchedulePage({ search, onSearchChange }: SchedulePageProps) {
  const { t } = useTranslation();
  const scheduleQueries = useQueries({
    queries: search.locations.map((businessUnit) =>
      scheduleQueryOptions({ businessUnit, date: search.date }),
    ),
  });
  const instructors = useQuery(instructorQueryOptions());
  const activityTypes = useQuery(activityTypeQueryOptions());
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
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{t("app.name")}</p>
        <h1>{t("schedule.title")}</h1>
      </header>

      <ScheduleFilters
        search={search}
        onChange={onSearchChange}
        instructors={availableInstructors}
        activityTypes={availableActivityTypes}
        isLoadingOptions={instructors.isPending || activityTypes.isPending}
        hasOptionsError={failedFilterQueries.length > 0}
        onRetryOptions={retryFilterOptions}
      />

      {isFetching && !isPending ? (
        <p className={styles.refreshing} role="status">
          {t("schedule.refreshing")}
        </p>
      ) : null}
      <section className={styles.list} aria-label={t("schedule.listLabel")} aria-busy={isFetching}>
        {isPending ? (
          <>
            <GymClassCardSkeleton />
            <GymClassCardSkeleton />
          </>
        ) : null}
        {isError ? (
          <div className={styles.notice} role="alert">
            <p>{t("schedule.error")}</p>
            <Button onPress={retrySchedule}>{t("schedule.retry")}</Button>
          </div>
        ) : null}
        {isPartialError ? (
          <div className={`${styles.notice} ${styles.warning}`} role="status">
            <p>{t("schedule.partialError", { count: failedScheduleQueries.length })}</p>
            <Button tone="quiet" onPress={retrySchedule}>
              {t("schedule.retry")}
            </Button>
          </div>
        ) : null}
        {!isPending && failedScheduleQueries.length === 0 && scheduleData.length === 0 ? (
          <p className={styles.notice}>{t("schedule.empty")}</p>
        ) : null}
        {scheduleData.map((activity, index) => (
          <GymClassCard
            key={activity.id ?? `${activity.duration?.start}-${index}`}
            activity={activity}
          />
        ))}
      </section>
    </main>
  );
}
