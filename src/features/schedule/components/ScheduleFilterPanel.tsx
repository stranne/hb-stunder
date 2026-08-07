import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, Gym, MapPin, Star, User, Xmark } from "iconoir-react";
import { useTranslation } from "react-i18next";
import {
  Button as AriaButton,
  Checkbox,
  CheckboxGroup,
  Input,
  SearchField,
  ToggleButton,
} from "react-aria-components";
import { Button } from "../../../ui/button/Button";
import { ErrorMessage } from "../../../ui/feedback/ErrorMessage";
import type { ScheduleFilterOption } from "../api/scheduleFilterQueries";
import { SavedSearches } from "./SavedSearches";
import {
  readSchedulePreferences,
  writeFavoriteFilters,
  type FavoriteFilterSelection,
} from "../model/schedulePreferences";
import { SCHEDULE_LOCATIONS, type ScheduleSearch } from "../model/scheduleSearch";
import styles from "./ScheduleFilterPanel.module.css";

export interface ScheduleFilterPanelProps {
  search: ScheduleSearch;
  onChange: (search: ScheduleSearch) => void;
  instructors?: ScheduleFilterOption[];
  activityTypes?: ScheduleFilterOption[];
  isLoadingOptions?: boolean;
  hasOptionsError?: boolean;
  onRetryOptions?: () => void;
  onFavoriteFiltersChange?: (favorites: FavoriteFilterSelection) => void;
  activeSavedSearchId?: string;
  onActiveSavedSearchChange?: (id: string | undefined) => void;
}

const LOCATION_IDS = SCHEDULE_LOCATIONS.map((location) => location.id);
const BROWSE_CHUNK_SIZE = 20;

function normalized(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase();
}

function toggleId(ids: number[], id: number) {
  return ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
}

interface SearchableOptionsProps {
  label: string;
  icon: ReactNode;
  searchLabel: string;
  emptyLabel: string;
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
  options,
  selectedIds,
  favoriteIds,
  onSelectedChange,
  onFavoriteChange,
}: SearchableOptionsProps) {
  const { t, i18n } = useTranslation();
  const headingId = useId();
  const [query, setQuery] = useState("");
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(BROWSE_CHUNK_SIZE);
  const favoriteButtonRefs = useRef(new Map<number, HTMLButtonElement>());
  const browseButtonRef = useRef<HTMLButtonElement>(null);
  const pendingFavoriteFocus = useRef<number | "browse" | undefined>(undefined);

  const sortedOptions = useMemo(
    () => [...options].sort((a, b) => a.name.localeCompare(b.name, i18n.language)),
    [i18n.language, options],
  );
  const favorites = sortedOptions.filter((option) => favoriteIds.includes(option.id));
  const matches = sortedOptions.filter((option) =>
    normalized(option.name).includes(normalized(query)),
  );
  const displayedOptions = query
    ? matches
    : isBrowsing
      ? sortedOptions.slice(0, visibleCount)
      : favorites;
  const groupedOptions = displayedOptions.reduce<Map<string, ScheduleFilterOption[]>>(
    (groups, option) => {
      const letter = option.name[0]?.toLocaleUpperCase(i18n.language) ?? "#";
      groups.set(letter, [...(groups.get(letter) ?? []), option]);
      return groups;
    },
    new Map(),
  );

  useEffect(() => {
    const focusTarget = pendingFavoriteFocus.current;
    if (focusTarget === undefined) return;

    pendingFavoriteFocus.current = undefined;
    if (focusTarget === "browse") browseButtonRef.current?.focus();
    else favoriteButtonRefs.current.get(focusTarget)?.focus();
  }, [favoriteIds]);

  function changeQuery(value: string) {
    setQuery(value);
    if (!value) setVisibleCount(BROWSE_CHUNK_SIZE);
  }

  function changeFavorite(optionId: number) {
    if (!query && !isBrowsing && favoriteIds.includes(optionId)) {
      const removedIndex = favorites.findIndex((option) => option.id === optionId);
      pendingFavoriteFocus.current =
        favorites[removedIndex + 1]?.id ?? favorites[removedIndex - 1]?.id ?? "browse";
    }

    onFavoriteChange(toggleId(favoriteIds, optionId));
  }

  return (
    <section className={styles.selector} aria-labelledby={headingId}>
      <div className={styles.sectionHeading}>
        {icon}
        <h3 id={headingId}>{label}</h3>
      </div>
      <SearchField value={query} onChange={changeQuery} aria-label={searchLabel}>
        <Input className={styles.searchInput} placeholder={searchLabel} />
      </SearchField>

      {!query && favorites.length === 0 && !isBrowsing ? (
        <p className={styles.empty}>{t("schedule.filters.noFavorites")}</p>
      ) : null}

      {displayedOptions.length > 0 ? (
        <CheckboxGroup
          className={styles.optionGroups}
          aria-label={query ? t("schedule.filters.searchResults") : label}
          value={selectedIds.map(String)}
          onChange={(values) => onSelectedChange(values.map(Number))}
        >
          {!query && !isBrowsing ? (
            <h4 className={styles.groupTitle}>{t("schedule.filters.favorites")}</h4>
          ) : null}
          {[...groupedOptions.entries()].map(([letter, group]) => (
            <div className={styles.optionGroup} role="group" aria-label={letter} key={letter}>
              {(query || isBrowsing) && <h4 className={styles.groupTitle}>{letter}</h4>}
              {group.map((option) => (
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
                    ref={(button) => {
                      if (button) favoriteButtonRefs.current.set(option.id, button);
                      else favoriteButtonRefs.current.delete(option.id);
                    }}
                    className={styles.starButton}
                    isSelected={favoriteIds.includes(option.id)}
                    onChange={() => changeFavorite(option.id)}
                    aria-label={t(
                      favoriteIds.includes(option.id)
                        ? "schedule.filters.removeFavorite"
                        : "schedule.filters.addFavorite",
                      { name: option.name },
                    )}
                  >
                    <Star aria-hidden="true" />
                  </ToggleButton>
                </div>
              ))}
            </div>
          ))}
        </CheckboxGroup>
      ) : query || isBrowsing ? (
        <p className={styles.empty}>{query ? t("schedule.filters.noSearchResults") : emptyLabel}</p>
      ) : null}

      {!query && !isBrowsing ? (
        <AriaButton
          ref={browseButtonRef}
          className={styles.disclosureButton}
          onPress={() => setIsBrowsing(true)}
        >
          {t("schedule.filters.browseOptions")}
        </AriaButton>
      ) : null}
      {!query && isBrowsing && visibleCount < sortedOptions.length ? (
        <AriaButton
          className={styles.disclosureButton}
          onPress={() => setVisibleCount((count) => count + BROWSE_CHUNK_SIZE)}
        >
          {t("schedule.filters.showMore", {
            count: Math.min(BROWSE_CHUNK_SIZE, sortedOptions.length - visibleCount),
          })}
        </AriaButton>
      ) : null}
    </section>
  );
}

export function ScheduleFilterPanel({
  search,
  onChange,
  instructors = [],
  activityTypes = [],
  isLoadingOptions = false,
  hasOptionsError = false,
  onRetryOptions,
  onFavoriteFiltersChange,
  activeSavedSearchId,
  onActiveSavedSearchChange,
}: ScheduleFilterPanelProps) {
  const { t } = useTranslation();
  const headingId = useId();
  const selectionHeadingId = useId();
  const locationHeadingId = useId();
  const preferences = readSchedulePreferences();
  const [favoriteInstructorIds, setFavoriteInstructorIds] = useState(
    preferences.favoriteInstructorIds,
  );
  const [favoriteActivityTypeIds, setFavoriteActivityTypeIds] = useState(
    preferences.favoriteActivityTypeIds,
  );
  const didInitializeFavorites = useRef(false);

  useEffect(() => {
    if (!didInitializeFavorites.current) {
      didInitializeFavorites.current = true;
      onFavoriteFiltersChange?.({ favoriteInstructorIds, favoriteActivityTypeIds });
      return;
    }
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

  const selectedLocations =
    search.locations.length < SCHEDULE_LOCATIONS.length
      ? SCHEDULE_LOCATIONS.filter((location) => search.locations.includes(location.id))
      : [];
  const selectedOptions = [
    ...instructors
      .filter((option) => search.instructors.includes(option.id))
      .map((option) => ({ ...option, category: "instructor" as const })),
    ...activityTypes
      .filter((option) => search.activityTypes.includes(option.id))
      .map((option) => ({ ...option, category: "activityType" as const })),
  ];
  const hasSelectedFilters = selectedLocations.length > 0 || selectedOptions.length > 0;

  function clearFilters() {
    onChange({
      ...search,
      locations: [...LOCATION_IDS],
      instructors: [],
      activityTypes: [],
    });
  }

  function removeLocation(locationId: number) {
    const remainingLocations = search.locations.filter((id) => id !== locationId);
    onChange({
      ...search,
      locations: remainingLocations.length > 0 ? remainingLocations : [...LOCATION_IDS],
    });
  }

  return (
    <section id="schedule-filter-panel" className={styles.panel} aria-labelledby={headingId}>
      <div className={styles.dialog}>
        <header className={styles.header}>
          <h2 id={headingId}>{t("schedule.filters.filters")}</h2>
        </header>

        <section className={styles.summary} aria-labelledby={selectionHeadingId}>
          <div className={styles.summaryHeading}>
            <h3 id={selectionHeadingId}>{t("schedule.filters.selectedFilters")}</h3>
            <AriaButton className={styles.clearButton} onPress={clearFilters}>
              {t("schedule.filters.clearFilters")}
            </AriaButton>
          </div>
          {hasSelectedFilters ? (
            <div className={styles.chips}>
              {selectedLocations.map((location) => (
                <AriaButton
                  className={styles.chip}
                  key={`location-${location.id}`}
                  aria-label={t("schedule.filters.removeSelection", { name: location.name })}
                  onPress={() => removeLocation(location.id)}
                >
                  <MapPin aria-hidden="true" />
                  {location.name}
                  <Xmark aria-hidden="true" />
                </AriaButton>
              ))}
              {selectedOptions.map((option) => (
                <AriaButton
                  className={styles.chip}
                  key={`${option.category}-${option.id}`}
                  aria-label={t("schedule.filters.removeSelection", { name: option.name })}
                  onPress={() =>
                    option.category === "instructor"
                      ? onChange({
                          ...search,
                          instructors: toggleId(search.instructors, option.id),
                        })
                      : onChange({
                          ...search,
                          activityTypes: toggleId(search.activityTypes, option.id),
                        })
                  }
                >
                  {option.category === "instructor" ? (
                    <User aria-hidden="true" />
                  ) : (
                    <Gym aria-hidden="true" />
                  )}
                  {option.name}
                  <Xmark aria-hidden="true" />
                </AriaButton>
              ))}
            </div>
          ) : (
            <p>{t("schedule.filters.noSelectedFilters")}</p>
          )}
        </section>

        <SavedSearches
          search={search}
          onChange={onChange}
          instructors={instructors}
          activityTypes={activityTypes}
          canValidateReferences={!isLoadingOptions && !hasOptionsError}
          activeId={activeSavedSearchId}
          onActiveChange={onActiveSavedSearchChange}
        />

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

        <section className={styles.locationSection} aria-labelledby={locationHeadingId}>
          <div className={styles.sectionHeading}>
            <MapPin aria-hidden="true" />
            <h3 id={locationHeadingId}>{t("schedule.filters.location")}</h3>
          </div>
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

        <div className={styles.selectors}>
          <SearchableOptions
            label={t("schedule.filters.instructor")}
            icon={<User aria-hidden="true" />}
            searchLabel={t("schedule.filters.searchInstructors")}
            emptyLabel={t("schedule.filters.noInstructors")}
            options={instructors}
            selectedIds={search.instructors}
            favoriteIds={favoriteInstructorIds}
            onSelectedChange={(ids) => onChange({ ...search, instructors: ids })}
            onFavoriteChange={setFavoriteInstructorIds}
          />
          <SearchableOptions
            label={t("schedule.filters.activityType")}
            icon={<Gym aria-hidden="true" />}
            searchLabel={t("schedule.filters.searchActivityTypes")}
            emptyLabel={t("schedule.filters.noActivityTypes")}
            options={visibleActivityTypes}
            selectedIds={search.activityTypes}
            favoriteIds={favoriteActivityTypeIds}
            onSelectedChange={(ids) => onChange({ ...search, activityTypes: ids })}
            onFavoriteChange={setFavoriteActivityTypeIds}
          />
        </div>
      </div>
    </section>
  );
}
