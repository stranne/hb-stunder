import { useLayoutEffect, useRef } from "react";
import { MapPin, User, Xmark } from "iconoir-react";
import { useTranslation } from "react-i18next";
import type { ScheduleFilterOption } from "../api/scheduleFilterQueries";
import { LOCATION_IDS, SCHEDULE_LOCATIONS, type ScheduleSearch } from "../model/scheduleSearch";
import interactionStyles from "../../../ui/interaction/Interaction.module.css";
import styles from "./ScheduleFilterSummary.module.css";

export function ScheduleFilterSummary({
  search,
  onChange,
  instructors = [],
  activityTypes = [],
}: {
  search: ScheduleSearch;
  onChange: (search: ScheduleSearch) => void;
  instructors?: ScheduleFilterOption[];
  activityTypes?: ScheduleFilterOption[];
}) {
  const { t } = useTranslation();
  const regionRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<number | undefined>(undefined);
  const allLocations =
    LOCATION_IDS.every((id) => search.locations.includes(id)) &&
    search.locations.length === LOCATION_IDS.length;
  const selections = [
    ...(!allLocations
      ? search.locations.map((id) => ({
          key: `location-${id}`,
          label:
            SCHEDULE_LOCATIONS.find((location) => location.id === id)?.name ??
            `${t("schedule.filters.location")} ${id}`,
          kind: "location",
          remove: () => {
            const locations = search.locations.filter((value) => value !== id);
            return { ...search, locations: locations.length ? locations : [...LOCATION_IDS] };
          },
        }))
      : []),
    ...search.instructors.map((id) => ({
      key: `instructor-${id}`,
      label:
        instructors.find((option) => option.id === id)?.name ??
        `${t("schedule.filters.instructor")} ${id}`,
      kind: "instructor",
      remove: () => ({
        ...search,
        instructors: search.instructors.filter((value) => value !== id),
      }),
    })),
    ...search.activityTypes.map((id) => ({
      key: `activity-${id}`,
      label:
        activityTypes.find((option) => option.id === id)?.name ??
        `${t("schedule.filters.activityType")} ${id}`,
      kind: "activity",
      remove: () => ({
        ...search,
        activityTypes: search.activityTypes.filter((value) => value !== id),
      }),
    })),
  ];

  useLayoutEffect(() => {
    if (pendingFocus.current === undefined) return;
    const buttons = regionRef.current?.querySelectorAll<HTMLButtonElement>("button[data-filter]");
    const target = buttons?.[Math.min(pendingFocus.current, buttons.length - 1)];
    (target ?? regionRef.current)?.focus();
    pendingFocus.current = undefined;
  }, [search]);

  return (
    <div
      ref={regionRef}
      className={`${styles.summary} ${interactionStyles.focusRing}`}
      role="group"
      aria-label={t("schedule.filters.selectedFilters")}
      tabIndex={-1}
    >
      {allLocations ? (
        <span className={styles.allLocations}>
          <MapPin aria-hidden="true" />
          {t("schedule.filters.allLocations")}
        </span>
      ) : null}
      {selections.map((selection, index) => (
        <button
          key={selection.key}
          type="button"
          data-filter
          className={`${styles.chip} ${interactionStyles.control} ${interactionStyles.secondary}`}
          aria-label={t("schedule.filters.removeSelection", { name: selection.label })}
          onClick={() => {
            pendingFocus.current = index;
            onChange({ ...selection.remove(), activity: undefined });
          }}
        >
          {selection.kind === "location" ? (
            <MapPin aria-hidden="true" />
          ) : selection.kind === "instructor" ? (
            <User aria-hidden="true" />
          ) : null}
          <span>{selection.label}</span>
          <Xmark aria-hidden="true" />
        </button>
      ))}
      {selections.length > 0 ? (
        <button
          type="button"
          className={`${styles.clear} ${interactionStyles.control} ${interactionStyles.quiet}`}
          onClick={() => {
            pendingFocus.current = 0;
            onChange({
              ...search,
              locations: [...LOCATION_IDS],
              instructors: [],
              activityTypes: [],
              activity: undefined,
            });
          }}
        >
          {t("schedule.filters.clearFilters")}
        </button>
      ) : null}
    </div>
  );
}
