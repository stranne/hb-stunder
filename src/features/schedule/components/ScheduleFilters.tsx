import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../ui/button/Button";
import { addDays, todayInStockholm } from "../model/scheduleDate";
import type { ScheduleSearch } from "../model/scheduleSearch";
import styles from "./ScheduleFilters.module.css";

const locations = [
  { id: 1, name: "Haga" },
  { id: 4128, name: "Drottningtorget" },
  { id: 3509, name: "Älvstranden" },
] as const;

const DAYS_PER_PAGE = 7;
const VISIBLE_DAYS = 21;

export interface ScheduleFiltersProps {
  search: ScheduleSearch;
  onChange: (search: ScheduleSearch) => void;
}

function dateForFormatting(date: string) {
  return new Date(`${date}T12:00:00Z`);
}

export function ScheduleFilters({ search, onChange }: ScheduleFiltersProps) {
  const { t, i18n } = useTranslation();
  const today = todayInStockholm();
  const lastVisibleDate = addDays(today, VISIBLE_DAYS - 1);
  const visibleDates = Array.from({ length: VISIBLE_DAYS }, (_, index) => addDays(today, index));
  const selectedIndex = visibleDates.indexOf(search.date);
  const pageIndex = selectedIndex < 0 ? 0 : Math.floor(selectedIndex / DAYS_PER_PAGE);
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const weekdayFormatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const monthFormatter = new Intl.DateTimeFormat(locale, { month: "short" });
  const fullDateFormatter = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const selectedDayRef = useRef<HTMLButtonElement>(null);
  const pendingFocusDateRef = useRef<string>(null);
  const changeDate = (date: string) => onChange({ ...search, date });

  useEffect(() => {
    selectedDayRef.current?.scrollIntoView?.({ block: "nearest", inline: "center" });

    if (pendingFocusDateRef.current === search.date) {
      selectedDayRef.current?.focus();
      pendingFocusDateRef.current = null;
    }
  }, [search.date]);

  return (
    <div className={styles.filters} role="group" aria-label={t("schedule.filters.label")}>
      <label className={styles.locationFilter}>
        <span className={styles.label}>{t("schedule.filters.location")}</span>
        <select
          value={search.location}
          onChange={(event) => onChange({ ...search, location: Number(event.currentTarget.value) })}
        >
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
      </label>

      <div className={styles.dateFilter}>
        <div className={styles.dateHeading}>
          <span className={styles.label}>{t("schedule.filters.upcomingDays")}</span>
          <input
            className={styles.datePickerInput}
            aria-label={t("schedule.filters.chooseDate")}
            type="date"
            min={today}
            max={lastVisibleDate}
            value={search.date}
            onChange={(event) => {
              const date = event.currentTarget.value;
              if (date) changeDate(date);
            }}
          />
        </div>

        <div className={styles.weekNavigation}>
          <Button
            tone="quiet"
            aria-label={t("schedule.filters.previousWeek")}
            isDisabled={pageIndex === 0}
            onPress={() => changeDate(addDays(search.date, -DAYS_PER_PAGE))}
          >
            <span aria-hidden="true">←</span>
          </Button>

          <div
            className={styles.dayStrip}
            role="group"
            aria-label={t("schedule.filters.upcomingDays")}
          >
            {visibleDates.map((date, index) => {
              const formattedDate = dateForFormatting(date);
              const isSelected = date === search.date;
              const isToday = date === today;

              return (
                <button
                  key={date}
                  ref={isSelected ? selectedDayRef : undefined}
                  type="button"
                  className={styles.dayButton}
                  data-visible={Math.floor(index / DAYS_PER_PAGE) === pageIndex}
                  tabIndex={isSelected ? 0 : -1}
                  aria-label={fullDateFormatter.format(formattedDate)}
                  aria-pressed={isSelected}
                  aria-current={isSelected ? "date" : undefined}
                  onClick={() => changeDate(date)}
                  onKeyDown={(event) => {
                    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

                    const nextIndex = index + (event.key === "ArrowLeft" ? -1 : 1);
                    const nextDate = visibleDates[nextIndex];
                    if (!nextDate) return;

                    event.preventDefault();
                    pendingFocusDateRef.current = nextDate;
                    changeDate(nextDate);
                  }}
                >
                  <span className={styles.weekday}>{weekdayFormatter.format(formattedDate)}</span>
                  <strong className={styles.dayNumber}>{formattedDate.getUTCDate()}</strong>
                  <span className={styles.month}>
                    {monthFormatter.format(formattedDate)}
                    {isToday ? ` · ${t("schedule.filters.today")}` : ""}
                  </span>
                </button>
              );
            })}
          </div>

          <Button
            tone="quiet"
            aria-label={t("schedule.filters.nextWeek")}
            isDisabled={pageIndex === VISIBLE_DAYS / DAYS_PER_PAGE - 1}
            onPress={() => changeDate(addDays(search.date, DAYS_PER_PAGE))}
          >
            <span aria-hidden="true">→</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
