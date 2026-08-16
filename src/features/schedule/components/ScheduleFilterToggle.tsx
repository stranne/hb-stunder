import { FilterList } from "iconoir-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../ui/button/Button";
import interactionStyles from "../../../ui/interaction/Interaction.module.css";
import { LOCATION_IDS, type ScheduleSearch } from "../model/scheduleSearch";
import styles from "./ScheduleFilterToggle.module.css";

interface ScheduleFilterToggleProps {
  search: ScheduleSearch;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ScheduleFilterToggle({ search, isOpen, onOpenChange }: ScheduleFilterToggleProps) {
  const { t } = useTranslation();
  const activeFilterCount =
    Number(search.locations.length < LOCATION_IDS.length) +
    Number(search.instructors.length > 0) +
    Number(search.activityTypes.length > 0);

  return (
    <Button
      type="button"
      tone="quiet"
      aria-label={t(isOpen ? "schedule.filters.showSchedule" : "schedule.filters.openFilters")}
      aria-expanded={isOpen}
      aria-controls="schedule-filter-panel"
      className={`${styles.toggle} ${interactionStyles.selectable}`}
      data-filters-open={isOpen || undefined}
      onPress={() => onOpenChange(!isOpen)}
    >
      <FilterList className={styles.icon} aria-hidden="true" />
      <span className={styles.label}>{t("schedule.filters.filters")}</span>
      {activeFilterCount > 0 ? (
        <span className={styles.count} aria-hidden="true">
          {activeFilterCount}
        </span>
      ) : null}
    </Button>
  );
}
