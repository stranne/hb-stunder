import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, FilterList, MapPin, Star, User, Xmark } from "iconoir-react";
import { useTranslation } from "react-i18next";
import {
  Button as AriaButton,
  Checkbox,
  CheckboxGroup,
  Dialog,
  DialogTrigger,
  Heading,
  Input,
  Popover,
  SearchField,
  ToggleButton,
} from "react-aria-components";
import { Button } from "../../../ui/button/Button";
import { ErrorMessage } from "../../../ui/feedback/ErrorMessage";
import type { ScheduleFilterOption } from "../api/scheduleFilterQueries";
import { readSchedulePreferences, writeFavoriteFilters } from "../model/schedulePreferences";
import { LOCATION_IDS, SCHEDULE_LOCATIONS, type ScheduleSearch } from "../model/scheduleSearch";
import styles from "./ScheduleFilterPanel.module.css";

interface ScheduleFilterPanelProps {
  search: ScheduleSearch;
  onChange: (search: ScheduleSearch) => void;
  instructors: ScheduleFilterOption[];
  activityTypes: ScheduleFilterOption[];
  isLoadingOptions?: boolean;
  hasOptionsError?: boolean;
  onRetryOptions?: () => void;
}

function toggleId(ids: number[], id: number) {
  return ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
}

const OPTION_ROW_HEIGHT = 44;
const OPTION_GROUP_LABEL_HEIGHT = 36;
const OPTION_LIST_FALLBACK_HEIGHT = 208;
const OPTION_LIST_OVERSCAN = 3;

interface VirtualRange {
  start: number;
  end: number;
  paddingBefore: number;
  paddingAfter: number;
}

function getVirtualRange(
  itemCount: number,
  itemOffset: number,
  scrollTop: number,
  viewportHeight: number,
): VirtualRange {
  const overscan = OPTION_LIST_OVERSCAN * OPTION_ROW_HEIGHT;
  const start = Math.min(
    itemCount,
    Math.max(0, Math.floor((scrollTop - overscan - itemOffset) / OPTION_ROW_HEIGHT)),
  );
  const end = Math.max(
    start,
    Math.min(
      itemCount,
      Math.ceil((scrollTop + viewportHeight + overscan - itemOffset) / OPTION_ROW_HEIGHT),
    ),
  );

  return {
    start,
    end,
    paddingBefore: start * OPTION_ROW_HEIGHT,
    paddingAfter: (itemCount - end) * OPTION_ROW_HEIGHT,
  };
}

function normalized(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase();
}

interface SearchableOptionsProps {
  label: string;
  icon?: ReactNode;
  searchLabel: string;
  emptyLabel: string;
  favoriteLabel: string;
  options: ScheduleFilterOption[];
  selectedIds: number[];
  favoriteIds: number[];
  onSelectedChange: (ids: number[]) => void;
  onFavoriteChange: (ids: number[]) => void;
}

function SearchableOptions({
  label,
  icon,
  searchLabel,
  emptyLabel,
  favoriteLabel,
  options,
  selectedIds,
  favoriteIds,
  onSelectedChange,
  onFavoriteChange,
}: SearchableOptionsProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(OPTION_LIST_FALLBACK_HEIGHT);
  const optionListRef = useRef<HTMLDivElement>(null);
  const normalizedQuery = normalized(query);
  const preparedOptions = useMemo(
    () =>
      options
        .map((option) => ({ option, searchName: normalized(option.name) }))
        .sort((a, b) => a.option.name.localeCompare(b.option.name)),
    [options],
  );
  const filteredOptions = useMemo(
    () =>
      preparedOptions
        .filter(({ searchName }) => searchName.includes(normalizedQuery))
        .map(({ option }) => option),
    [normalizedQuery, preparedOptions],
  );
  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const favorites = useMemo(
    () => preparedOptions.map(({ option }) => option).filter(({ id }) => favoriteIdSet.has(id)),
    [favoriteIdSet, preparedOptions],
  );

  const favoriteRowsOffset = OPTION_GROUP_LABEL_HEIGHT;
  const allRowsOffset =
    (favorites.length > 0
      ? OPTION_GROUP_LABEL_HEIGHT + favorites.length * OPTION_ROW_HEIGHT
      : 0) + OPTION_GROUP_LABEL_HEIGHT;
  const filteredRange = getVirtualRange(
    filteredOptions.length,
    0,
    scrollTop,
    viewportHeight,
  );
  const favoriteRange = getVirtualRange(
    favorites.length,
    favoriteRowsOffset,
    scrollTop,
    viewportHeight,
  );
  const allRange = getVirtualRange(
    filteredOptions.length,
    allRowsOffset,
    scrollTop,
    viewportHeight,
  );

  useEffect(() => {
    const optionList = optionListRef.current;
    if (!optionList) return;

    const updateViewportHeight = () => {
      setViewportHeight(optionList.clientHeight || OPTION_LIST_FALLBACK_HEIGHT);
    };

    updateViewportHeight();
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(updateViewportHeight);
    observer.observe(optionList);
    return () => observer.disconnect();
  }, [filteredOptions.length]);

  function changeQuery(nextQuery: string) {
    setQuery(nextQuery);
    setScrollTop(0);
    if (optionListRef.current) optionListRef.current.scrollTop = 0;
  }

  function optionRow(option: ScheduleFilterOption) {
    const isFavorite = favoriteIdSet.has(option.id);
    return (
      <div className={styles.optionRow} key={option.id}>
        <Checkbox className={styles.checkbox} value={String(option.id)}>
          {({ isSelected }) => (
            <>
              <span className={styles.checkboxBox} aria-hidden="true">
                {isSelected ? <Check /> : null}
              </span>
              <span className={styles.optionName}>{option.name}</span>
            </>
          )}
        </Checkbox>
        <ToggleButton
          className={styles.starButton}
          isSelected={isFavorite}
          aria-label={t(
            isFavorite ? "schedule.filters.removeFavorite" : "schedule.filters.addFavorite",
            { name: option.name },
          )}
          onChange={() => onFavoriteChange(toggleId(favoriteIds, option.id))}
        >
          <Star aria-hidden="true" fill={isFavorite ? "currentColor" : "none"} />
        </ToggleButton>
      </div>
    );
  }

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionHeading}>
        {icon}
        {label}
      </h3>
      <SearchField
        className={styles.searchField}
        aria-label={searchLabel}
        value={query}
        onChange={changeQuery}
      >
        <Input aria-label={searchLabel} placeholder={searchLabel} />
        {query ? (
          <AriaButton aria-label={t("schedule.filters.clearSearch")}>
            <Xmark aria-hidden="true" />
          </AriaButton>
        ) : null}
      </SearchField>

      {filteredOptions.length > 0 ? (
        <CheckboxGroup
          ref={optionListRef}
          className={styles.optionList}
          aria-label={label}
          value={selectedIds.map(String)}
          onChange={(values) => onSelectedChange(values.map(Number))}
          onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
        >
          {query ? (
            <>
              <div
                className={styles.virtualSpacer}
                style={{ blockSize: filteredRange.paddingBefore }}
                aria-hidden="true"
              />
              {filteredOptions.slice(filteredRange.start, filteredRange.end).map(optionRow)}
              <div
                className={styles.virtualSpacer}
                style={{ blockSize: filteredRange.paddingAfter }}
                aria-hidden="true"
              />
            </>
          ) : (
            <>
              {favorites.length > 0 ? (
                <div className={styles.optionGroup} role="group" aria-label={favoriteLabel}>
                  <span className={styles.optionGroupLabel}>{favoriteLabel}</span>
                  <div
                    className={styles.virtualSpacer}
                    style={{ blockSize: favoriteRange.paddingBefore }}
                    aria-hidden="true"
                  />
                  {favorites.slice(favoriteRange.start, favoriteRange.end).map(optionRow)}
                  <div
                    className={styles.virtualSpacer}
                    style={{ blockSize: favoriteRange.paddingAfter }}
                    aria-hidden="true"
                  />
                </div>
              ) : null}
              <div
                className={styles.optionGroup}
                role="group"
                aria-label={t("schedule.filters.all")}
              >
                <span className={styles.optionGroupLabel}>{t("schedule.filters.all")}</span>
                <div
                  className={styles.virtualSpacer}
                  style={{ blockSize: allRange.paddingBefore }}
                  aria-hidden="true"
                />
                {filteredOptions.slice(allRange.start, allRange.end).map(optionRow)}
                <div
                  className={styles.virtualSpacer}
                  style={{ blockSize: allRange.paddingAfter }}
                  aria-hidden="true"
                />
              </div>
            </>
          )}
        </CheckboxGroup>
      ) : (
        <p className={styles.empty}>{emptyLabel}</p>
      )}
    </section>
  );
}

export function ScheduleFilterPanel({
  search,
  onChange,
  instructors,
  activityTypes,
  isLoadingOptions = false,
  hasOptionsError = false,
  onRetryOptions,
}: ScheduleFilterPanelProps) {
  const { t } = useTranslation();
  const preferences = readSchedulePreferences();
  const [favoriteInstructorIds, setFavoriteInstructorIds] = useState(
    preferences.favoriteInstructorIds,
  );
  const [favoriteActivityTypeIds, setFavoriteActivityTypeIds] = useState(
    preferences.favoriteActivityTypeIds,
  );

  useEffect(() => {
    writeFavoriteFilters(favoriteInstructorIds, favoriteActivityTypeIds);
  }, [favoriteInstructorIds, favoriteActivityTypeIds]);

  const activeFilterCount =
    Number(search.locations.length < LOCATION_IDS.length) +
    Number(search.instructors.length > 0) +
    Number(search.activityTypes.length > 0);

  return (
    <DialogTrigger>
      <Button tone="quiet" aria-label={t("schedule.filters.openFilters")}>
        <FilterList className={styles.filterIcon} aria-hidden="true" />
        <span className={styles.filterLabel}>
          {t("schedule.filters.filters")}
          {activeFilterCount > 0 ? <span className={styles.count}>{activeFilterCount}</span> : null}
        </span>
      </Button>
      <Popover className={styles.popover} placement="bottom start">
        <Dialog className={styles.dialog}>
          <div className={styles.headingRow}>
            <Heading slot="title">{t("schedule.filters.filters")}</Heading>
            <AriaButton
              className={styles.clearButton}
              onPress={() =>
                onChange({
                  ...search,
                  locations: [...LOCATION_IDS],
                  instructors: [],
                  activityTypes: [],
                })
              }
            >
              {t("schedule.filters.clearFilters")}
            </AriaButton>
          </div>

          {isLoadingOptions ? (
            <p className={styles.loading} role="status">
              {t("schedule.filters.loadingOptions")}
            </p>
          ) : null}
          {hasOptionsError ? (
            <ErrorMessage
              action={
                <Button tone="quiet" onPress={onRetryOptions}>
                  {t("schedule.filters.retryOptions")}
                </Button>
              }
            >
              {t("schedule.filters.optionsError")}
            </ErrorMessage>
          ) : null}

          <section className={`${styles.section} ${styles.locationSection}`}>
            <h3 className={styles.sectionHeading}>
              <MapPin aria-hidden="true" />
              {t("schedule.filters.location")}
            </h3>
            <CheckboxGroup
              className={styles.locationOptions}
              aria-label={t("schedule.filters.location")}
              value={search.locations.map(String)}
              onChange={(values) => {
                const selected = values.map(Number);
                onChange({
                  ...search,
                  locations: selected.length > 0 ? selected : [...LOCATION_IDS],
                });
              }}
            >
              {SCHEDULE_LOCATIONS.map((location) => (
                <Checkbox
                  className={styles.locationCheckbox}
                  key={location.id}
                  value={String(location.id)}
                >
                  {({ isSelected }) => (
                    <>
                      <span className={styles.checkboxBox} aria-hidden="true">
                        {isSelected ? <Check /> : null}
                      </span>
                      {location.name}
                    </>
                  )}
                </Checkbox>
              ))}
            </CheckboxGroup>
          </section>

          <div className={styles.optionColumns}>
            <SearchableOptions
              label={t("schedule.filters.instructor")}
              icon={<User aria-hidden="true" />}
              searchLabel={t("schedule.filters.searchInstructors")}
              emptyLabel={t("schedule.filters.noInstructors")}
              favoriteLabel={t("schedule.filters.favorites")}
              options={instructors}
              selectedIds={search.instructors}
              favoriteIds={favoriteInstructorIds}
              onSelectedChange={(ids) => onChange({ ...search, instructors: ids })}
              onFavoriteChange={setFavoriteInstructorIds}
            />

            <SearchableOptions
              label={t("schedule.filters.activityType")}
              searchLabel={t("schedule.filters.searchActivityTypes")}
              emptyLabel={t("schedule.filters.noActivityTypes")}
              favoriteLabel={t("schedule.filters.favorites")}
              options={activityTypes}
              selectedIds={search.activityTypes}
              favoriteIds={favoriteActivityTypeIds}
              onSelectedChange={(ids) => onChange({ ...search, activityTypes: ids })}
              onFavoriteChange={setFavoriteActivityTypeIds}
            />
          </div>

          <div className={styles.footer}>
            <Button slot="close">{t("schedule.filters.done")}</Button>
          </div>
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}
