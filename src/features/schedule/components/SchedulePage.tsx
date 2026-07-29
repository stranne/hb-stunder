import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
  const schedule = useQuery(
    scheduleQueryOptions({ businessUnit: search.location, date: search.date }),
  );

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{t("app.name")}</p>
        <h1>{t("schedule.title")}</h1>
      </header>

      <ScheduleFilters search={search} onChange={onSearchChange} />

      {schedule.isFetching && !schedule.isPending ? (
        <p className={styles.refreshing} role="status">
          {t("schedule.refreshing")}
        </p>
      ) : null}
      <section
        className={styles.list}
        aria-label={t("schedule.listLabel")}
        aria-busy={schedule.isFetching}
      >
        {schedule.isPending ? (
          <>
            <GymClassCardSkeleton />
            <GymClassCardSkeleton />
          </>
        ) : null}
        {schedule.isError ? <p className={styles.notice}>{t("schedule.error")}</p> : null}
        {schedule.data?.length === 0 ? (
          <p className={styles.notice}>{t("schedule.empty")}</p>
        ) : null}
        {schedule.data?.map((activity, index) => (
          <GymClassCard
            key={activity.id ?? `${activity.duration?.start}-${index}`}
            activity={activity}
          />
        ))}
      </section>
    </main>
  );
}
