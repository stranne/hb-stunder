import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { scheduleQueryOptions } from "../api/scheduleQueries";
import type { ScheduleSearch } from "../model/scheduleSearch";
import { GymClassCard, GymClassCardSkeleton } from "./GymClassCard";
import styles from "./SchedulePage.module.css";

const locations = [
  { id: 1, name: "Haga" },
  { id: 4128, name: "Drottningtorget" },
  { id: 3509, name: "Älvstranden" },
] as const;

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

      <div className={styles.filters} aria-label={t("schedule.filters.label")}>
        <label>
          <span>{t("schedule.filters.date")}</span>
          <input
            type="date"
            value={search.date}
            onChange={(event) => {
              const date = event.currentTarget.value;
              if (date) onSearchChange({ ...search, date });
            }}
          />
        </label>
        <label>
          <span>{t("schedule.filters.location")}</span>
          <select
            value={search.location}
            onChange={(event) =>
              onSearchChange({ ...search, location: Number(event.currentTarget.value) })
            }
          >
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section className={styles.list} aria-label={t("schedule.listLabel")}>
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
