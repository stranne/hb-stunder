import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
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
import {
  readSchedulePreferences,
  writeFavoriteFilters,
  type FavoriteFilterSelection,
} from "../model/schedulePreferences";
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
  onFavoriteFiltersChange?: (favorites: FavoriteFilterSelection) => void;
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
}

interface PendingOptionFocus {
  index: number;
  control: "checkbox" | "favorite";
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

  return { start, end };
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
  const [activeIndex, setActiveIndex] = useState(0);
  const [pendingFocus, setPendingFocus] = useState<PendingOptionFocus | null>(null);
  const optionListRef = useRef<HTMLDivElement>(null);
  const optionCountId = useId();
  const optionInstructionsId = useId();
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
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const favorites = useMemo(
    () => preparedOptions.map(({ option }) => option).filter(({ id }) => favoriteIdSet.has(id)),
    [favoriteIdSet, preparedOptions],
  );

  const favoriteRowsOffset = OPTION_GROUP_LABEL_HEIGHT;
  const allRowsOffset =
    (favorites.length > 0 ? OPTION_GROUP_LABEL_HEIGHT + favorites.length * OPTION_ROW_HEIGHT : 0) +
    OPTION_GROUP_LABEL_HEIGHT;
  const filteredRange = getVirtualRange(filteredOptions.length, 0, scrollTop, viewportHeight);
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

  useEffect(() => {
    if (!pendingFocus) return;

    const rowTop = query
      ? pendingFocus.index * OPTION_ROW_HEIGHT
      : pendingFocus.index < favorites.length
        ? OPTION_GROUP_LABEL_HEIGHT + pendingFocus.index * OPTION_ROW_HEIGHT
        : allRowsOffset + (pendingFocus.index - favorites.length) * OPTION_ROW_HEIGHT;
    const optionList = optionListRef.current;
    if (!optionList) return;

    let nextScrollTop = optionList.scrollTop;
    if (rowTop < nextScrollTop + OPTION_GROUP_LABEL_HEIGHT) {
      nextScrollTop = Math.max(0, rowTop - OPTION_GROUP_LABEL_HEIGHT);
    } else if (rowTop + OPTION_ROW_HEIGHT > nextScrollTop + viewportHeight) {
      nextScrollTop = rowTop + OPTION_ROW_HEIGHT - viewportHeight;
    }
    optionList.scrollTop = nextScrollTop;
    setScrollTop(nextScrollTop);

    const row = optionList.querySelector<HTMLElement>(
      `[data-navigation-index="${pendingFocus.index}"]`,
    );
    const control = row?.querySelector<HTMLElement>(
      pendingFocus.control === "checkbox" ? 'input[type="checkbox"]' : "button",
    );
    if (!control) return;

    control.focus({ preventScroll: true });
    setPendingFocus(null);
  }, [allRowsOffset, favorites.length, pendingFocus, query, viewportHeight]);

  function changeQuery(nextQuery: string) {
    setQuery(nextQuery);
    setScrollTop(0);
    setActiveIndex(0);
    setPendingFocus(null);
    if (optionListRef.current) optionListRef.current.scrollTop = 0;
  }

  function optionRow(
    option: ScheduleFilterOption,
    key: string,
    navigationIndex: number,
    group: "favorite" | "all" | "filtered",
  ) {
    const isFavorite = favoriteIdSet.has(option.id);
    const isActive = navigationIndex === activeIndex;
    return (
      <div
        className={styles.optionRow}
        key={key}
        data-navigation-index={navigationIndex}
        onKeyDown={handleOptionKeyDown}
      >
        <Checkbox
          className={styles.checkbox}
          value={String(option.id)}
          excludeFromTabOrder={!isActive}
          aria-keyshortcuts="ArrowUp ArrowDown PageUp PageDown Home End"
          onFocus={() => handleOptionFocus(navigationIndex)}
        >
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
          excludeFromTabOrder={!isActive}
          onFocus={() => handleOptionFocus(navigationIndex)}
          aria-keyshortcuts="ArrowUp ArrowDown PageUp PageDown Home End"
          onKeyDown={handleFavoriteKeyDown}
          aria-label={t(
            isFavorite ? "schedule.filters.removeFavorite" : "schedule.filters.addFavorite",
            { name: option.name },
          )}
          onChange={() => {
            if (!query && group === "all") {
              setActiveIndex(navigationIndex + (isFavorite ? -1 : 1));
            } else if (!query && group === "favorite" && isFavorite) {
              const nextIndex =
                favorites.length - 1 + filteredOptions.findIndex(({ id }) => id === option.id);
              setActiveIndex(nextIndex);
              setPendingFocus({ index: nextIndex, control: "favorite" });
            }
            onFavoriteChange(toggleId(favoriteIds, option.id));
          }}
        >
          <Star aria-hidden="true" fill={isFavorite ? "currentColor" : "none"} />
        </ToggleButton>
      </div>
    );
  }

  function virtualizedRows(
    rows: ScheduleFilterOption[],
    range: VirtualRange,
    group: "favorite" | "all" | "filtered",
    navigationOffset: number,
    keepSelectedMounted: boolean,
  ) {
    const renderedIndexes = new Set<number>();
    for (let index = range.start; index < range.end; index += 1) {
      renderedIndexes.add(index);
    }
    if (activeIndex >= navigationOffset && activeIndex < navigationOffset + rows.length) {
      renderedIndexes.add(activeIndex - navigationOffset);
    }
    if (keepSelectedMounted) {
      rows.forEach((option, index) => {
        if (selectedIdSet.has(option.id)) renderedIndexes.add(index);
      });
    }

    const indexes = [...renderedIndexes].sort((a, b) => a - b);
    const renderedRows: ReactNode[] = [];
    let nextIndex = 0;

    indexes.forEach((index) => {
      if (index > nextIndex) {
        renderedRows.push(
          <div
            className={styles.virtualSpacer}
            style={{ blockSize: (index - nextIndex) * OPTION_ROW_HEIGHT }}
            aria-hidden="true"
            key={`${group}-spacer-${nextIndex}`}
          />,
        );
      }
      renderedRows.push(
        optionRow(rows[index]!, `${group}-${rows[index]!.id}`, navigationOffset + index, group),
      );
      nextIndex = index + 1;
    });

    if (nextIndex < rows.length) {
      renderedRows.push(
        <div
          className={styles.virtualSpacer}
          style={{ blockSize: (rows.length - nextIndex) * OPTION_ROW_HEIGHT }}
          aria-hidden="true"
          key={`${group}-spacer-${nextIndex}`}
        />,
      );
    }

    return renderedRows;
  }

  function scrollOptionIntoView(index: number) {
    const rowTop = query
      ? index * OPTION_ROW_HEIGHT
      : index < favorites.length
        ? OPTION_GROUP_LABEL_HEIGHT + index * OPTION_ROW_HEIGHT
        : allRowsOffset + (index - favorites.length) * OPTION_ROW_HEIGHT;
    const optionList = optionListRef.current;
    if (!optionList) return;

    let nextScrollTop = optionList.scrollTop;
    if (rowTop < nextScrollTop + OPTION_GROUP_LABEL_HEIGHT) {
      nextScrollTop = Math.max(0, rowTop - OPTION_GROUP_LABEL_HEIGHT);
    } else if (rowTop + OPTION_ROW_HEIGHT > nextScrollTop + viewportHeight) {
      nextScrollTop = rowTop + OPTION_ROW_HEIGHT - viewportHeight;
    }

    if (nextScrollTop === optionList.scrollTop) return;
    optionList.scrollTop = nextScrollTop;
    setScrollTop(nextScrollTop);
  }

  function handleOptionFocus(index: number) {
    setActiveIndex(index);
    scrollOptionIntoView(index);
  }

  function resetOptionEntry() {
    const optionList = optionListRef.current;
    if (optionList) optionList.scrollTop = 0;
    setScrollTop(0);
    setActiveIndex(0);
    setPendingFocus(null);
  }

  function focusOption(index: number, control: PendingOptionFocus["control"]) {
    setActiveIndex(index);
    setPendingFocus({ index, control });
  }

  function navigateOption(
    event: ReactKeyboardEvent<HTMLElement>,
    currentIndex: number,
    control: PendingOptionFocus["control"],
  ) {
    if (event.altKey || event.ctrlKey || event.metaKey) return false;
    if (!["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"].includes(event.key)) {
      return false;
    }

    const optionCount = query ? filteredOptions.length : favorites.length + filteredOptions.length;
    if (!Number.isInteger(currentIndex) || optionCount === 0) return false;

    event.preventDefault();
    const pageSize = Math.max(1, Math.floor(viewportHeight / OPTION_ROW_HEIGHT));
    let nextIndex = currentIndex;
    if (event.key === "ArrowDown") nextIndex = Math.min(optionCount - 1, currentIndex + 1);
    if (event.key === "ArrowUp") nextIndex = Math.max(0, currentIndex - 1);
    if (event.key === "PageDown") nextIndex = Math.min(optionCount - 1, currentIndex + pageSize);
    if (event.key === "PageUp") nextIndex = Math.max(0, currentIndex - pageSize);
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = optionCount - 1;

    focusOption(nextIndex, control);
    return true;
  }

  function handleFavoriteKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key === "Tab" && event.shiftKey) {
      const checkbox =
        event.currentTarget.parentElement?.querySelector<HTMLElement>('input[type="checkbox"]');
      if (!checkbox) return;

      event.preventDefault();
      checkbox.focus({ preventScroll: true });
      return;
    }

    const row = event.currentTarget.closest<HTMLElement>("[data-navigation-index]");
    const currentIndex = Number(row?.dataset.navigationIndex);
    navigateOption(event, currentIndex, "favorite");
  }

  function handleOptionKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (target?.closest("button")) return;

    const currentIndex = Number(event.currentTarget.dataset.navigationIndex);
    navigateOption(event, currentIndex, "checkbox");
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

      <p className={styles.optionSummary} id={optionCountId} aria-live="polite" aria-atomic="true">
        {t("schedule.filters.optionCount", { count: filteredOptions.length })}
      </p>
      <p className={styles.visuallyHidden} id={optionInstructionsId}>
        {t("schedule.filters.optionInstructions")}
      </p>

      {filteredOptions.length > 0 ? (
        <CheckboxGroup
          ref={optionListRef}
          className={styles.optionList}
          aria-label={label}
          aria-describedby={`${optionCountId} ${optionInstructionsId}`}
          value={selectedIds.map(String)}
          onChange={(values) => onSelectedChange(values.map(Number))}
          onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              resetOptionEntry();
            }
          }}
        >
          {query ? (
            virtualizedRows(filteredOptions, filteredRange, "filtered", 0, true)
          ) : (
            <>
              {favorites.length > 0 ? (
                <div className={styles.optionGroup} role="group" aria-label={favoriteLabel}>
                  <span className={styles.optionGroupLabel}>{favoriteLabel}</span>
                  {virtualizedRows(favorites, favoriteRange, "favorite", 0, true)}
                </div>
              ) : null}
              <div
                className={styles.optionGroup}
                role="group"
                aria-label={t("schedule.filters.all")}
              >
                <span className={styles.optionGroupLabel}>{t("schedule.filters.all")}</span>
                {virtualizedRows(filteredOptions, allRange, "all", favorites.length, true)}
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
  onFavoriteFiltersChange,
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
    onFavoriteFiltersChange?.({ favoriteInstructorIds, favoriteActivityTypeIds });
  }, [favoriteInstructorIds, favoriteActivityTypeIds, onFavoriteFiltersChange]);

  const visibleActivityTypes = useMemo(() => {
    const selectedLocations = new Set(search.locations);
    const selectedActivityTypes = new Set(search.activityTypes);

    return activityTypes.filter(
      (activityType) =>
        selectedActivityTypes.has(activityType.id) ||
        activityType.businessUnitIds === undefined ||
        activityType.businessUnitIds.some((businessUnitId) =>
          selectedLocations.has(businessUnitId),
        ),
    );
  }, [activityTypes, search.activityTypes, search.locations]);

  const activeFilterCount =
    Number(search.locations.length < LOCATION_IDS.length) +
    Number(search.instructors.length > 0) +
    Number(search.activityTypes.length > 0);

  return (
    <DialogTrigger>
      <Button
        type="button"
        tone="quiet"
        excludeFromTabOrder={false}
        aria-label={t("schedule.filters.openFilters")}
      >
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
              options={visibleActivityTypes}
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
