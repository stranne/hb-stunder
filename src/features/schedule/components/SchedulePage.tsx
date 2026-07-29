import { useQueries, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
  const scheduleData = [
    ...new Map(
      scheduleQueries
        .flatMap((query) => query.data ?? [])
        .map((activity) => [
          activity.id ?? `${activity.businessUnit?.id}-${activity.duration?.start}`,
          activity,
        ]),
    ).values(),
  ]
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
  const isError = scheduleQueries.every((query) => query.isError);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{t("app.name")}</p>
        <h1>{t("schedule.title")}</h1>
      </header>

      <ScheduleFilters
        search={search}
        onChange={onSearchChange}
        instructors={instructors.data}
        activityTypes={activityTypes.data}
        isLoadingOptions={instructors.isPending || activityTypes.isPending}
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
        {isError ? <p className={styles.notice}>{t("schedule.error")}</p> : null}
        {!isPending && !isError && scheduleData.length === 0 ? (
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
