import { useEffect, useRef } from "react";
import { NavArrowLeft, NavArrowRight } from "iconoir-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../ui/button/Button";
import { addDays, todayInStockholm } from "../model/scheduleDate";
import type { ScheduleFilterOption } from "../api/scheduleFilterQueries";
import type { ScheduleSearch } from "../model/scheduleSearch";
import { ScheduleFilterPanel } from "./ScheduleFilterPanel";
import styles from "./ScheduleFilters.module.css";

const DAYS_PER_PAGE = 7;
const VISIBLE_DAYS = 21;

export interface ScheduleFiltersProps {
  search: ScheduleSearch;
  onChange: (search: ScheduleSearch) => void;
  instructors?: ScheduleFilterOption[];
  activityTypes?: ScheduleFilterOption[];
  isLoadingOptions?: boolean;
  hasOptionsError?: boolean;
  onRetryOptions?: () => void;
}

function dateForFormatting(date: string) {
  return new Date(`${date}T12:00:00Z`);
}

export function ScheduleFilters({
  search,
  onChange,
  instructors = [],
  activityTypes = [],
  isLoadingOptions = false,
  hasOptionsError = false,
  onRetryOptions,
}: ScheduleFiltersProps) {
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
      <div className={styles.filterToolbar}>
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
        <ScheduleFilterPanel
          search={search}
          onChange={onChange}
          instructors={instructors}
          activityTypes={activityTypes}
          isLoadingOptions={isLoadingOptions}
          hasOptionsError={hasOptionsError}
          onRetryOptions={onRetryOptions}
        />
      </div>

      <div className={styles.weekNavigation}>
        <Button
          tone="quiet"
          aria-label={t("schedule.filters.previousWeek")}
          isDisabled={pageIndex === 0}
          onPress={() => changeDate(addDays(search.date, -DAYS_PER_PAGE))}
        >
          <NavArrowLeft aria-hidden="true" />
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
                <span className={styles.weekday}>
                  {isToday ? t("schedule.filters.today") : weekdayFormatter.format(formattedDate)}
                </span>
                <strong className={styles.dayNumber}>{formattedDate.getUTCDate()}</strong>
                <span className={styles.month}>{monthFormatter.format(formattedDate)}</span>
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
          <NavArrowRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
