import { FilterList, Star } from "iconoir-react";
import { ToggleButton, ToggleButtonGroup } from "react-aria-components";
import { useTranslation } from "react-i18next";
import { Button } from "../../../ui/button/Button";
import interactionStyles from "../../../ui/interaction/Interaction.module.css";
import type { ScheduleView } from "../model/scheduleSearch";
import styles from "./ScheduleViewControls.module.css";

export interface ScheduleViewControlsProps {
  view: ScheduleView;
  activeFilterCount: number;
  showFavorites: boolean;
  onOpenFilters: () => void;
  onShowFavoritesChange: (showFavorites: boolean) => void;
  onViewChange: (view: ScheduleView) => void;
}

const VIEWS: ScheduleView[] = ["classes", "rooms"];

/** The schedule's own controls, kept beside the date strip they refine. */
export function ScheduleViewControls({
  view,
  activeFilterCount,
  showFavorites,
  onOpenFilters,
  onShowFavoritesChange,
  onViewChange,
}: ScheduleViewControlsProps) {
  const { t } = useTranslation();
  const selectable = `${interactionStyles.control} ${interactionStyles.selectable}`;

  return (
    <div className={styles.controls}>
      <Button
        tone="secondary"
        className={styles.control}
        aria-haspopup="dialog"
        onPress={onOpenFilters}
      >
        <FilterList className={styles.filterIcon} aria-hidden="true" />
        <span>{t("schedule.filters.filters")}</span>
        {activeFilterCount > 0 ? (
          <>
            <span className={styles.count} aria-hidden="true">
              {activeFilterCount}
            </span>
            <span className={styles.visuallyHidden}>
              , {t("schedule.filters.activeCount", { count: activeFilterCount })}
            </span>
          </>
        ) : null}
      </Button>
      <ToggleButton
        className={`${styles.control} ${styles.favorites} ${selectable} ${interactionStyles.secondary}`}
        isSelected={showFavorites}
        onChange={onShowFavoritesChange}
      >
        <Star aria-hidden="true" />
        <span>{t("schedule.filters.favorites")}</span>
      </ToggleButton>
      <ToggleButtonGroup
        className={styles.viewSwitch}
        aria-label={t("schedule.view.label")}
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={[view]}
        onSelectionChange={(keys) => {
          const [nextView] = [...keys];
          if (nextView === "classes" || nextView === "rooms") onViewChange(nextView);
        }}
      >
        {VIEWS.map((option) => (
          <ToggleButton
            key={option}
            id={option}
            className={`${styles.segment} ${selectable} ${interactionStyles.quiet}`}
          >
            {t(`schedule.view.${option}`)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  );
}
