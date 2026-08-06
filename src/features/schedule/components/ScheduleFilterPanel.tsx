import {
  useEffect,
  useId,
  useMemo,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Check, FilterList, MapPin, Star, User } from "iconoir-react";
import { useTranslation } from "react-i18next";
import {
  Button as AriaButton,
  Checkbox,
  CheckboxGroup,
  Dialog,
  DialogTrigger,
  Heading,
  Input,
  Modal,
  SearchField,
  Tab,
  TabList,
  TabPanel,
  Tabs,
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

interface SearchableOptionsProps {
  label: string;
  searchLabel: string;
  emptyLabel: string;
  options: ScheduleFilterOption[];
  selectedIds: number[];
  favoriteIds: number[];
  onSelectedChange: (ids: number[]) => void;
  onFavoriteChange: (ids: number[]) => void;
}

type OptionCategory = "instructors" | "activityTypes";

function normalized(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase();
}

function SearchableOptions({
  label,
  searchLabel,
  emptyLabel,
  options,
  selectedIds,
  favoriteIds,
  onSelectedChange,
  onFavoriteChange,
}: SearchableOptionsProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isManagingFavorites, setIsManagingFavorites] = useState(false);
  const optionCountId = useId();
  const optionInstructionsId = useId();
  const preparedOptions = useMemo(
    () =>
      options
        .map((option) => ({ option, searchName: normalized(option.name) }))
        .sort((a, b) => a.option.name.localeCompare(b.option.name)),
    [options],
  );
  const optionById = useMemo(
    () => new Map(preparedOptions.map(({ option }) => [option.id, option])),
    [preparedOptions],
  );
  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalized(query);
    return preparedOptions
      .filter(({ searchName }) => searchName.includes(normalizedQuery))
      .map(({ option }) => option);
  }, [preparedOptions, query]);
  const selectedOptions = selectedIds
    .map((id) => optionById.get(id))
    .filter((option): option is ScheduleFilterOption => option !== undefined);
  const favoriteOptions = favoriteIds
    .map((id) => optionById.get(id))
    .filter((option): option is ScheduleFilterOption => option !== undefined)
    .sort((a, b) => a.name.localeCompare(b.name));
  const activeValues = isManagingFavorites ? favoriteIds : selectedIds;

  useEffect(() => {
    setActiveIndex(0);
  }, [isManagingFavorites, options]);

  function handleOptionKeyDown(event: ReactKeyboardEvent<HTMLElement>, index: number) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;

    event.preventDefault();
    let nextIndex = index;
    if (event.key === "ArrowDown") nextIndex = Math.min(filteredOptions.length - 1, index + 1);
    if (event.key === "ArrowUp") nextIndex = Math.max(0, index - 1);
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = filteredOptions.length - 1;

    setActiveIndex(nextIndex);
    const nextControl = event.currentTarget
      .closest('[role="group"]')
      ?.querySelector<HTMLElement>(`[data-option-index="${nextIndex}"] input`);
    nextControl?.focus({ preventScroll: true });
    nextControl?.scrollIntoView?.({ block: "nearest" });
  }

  return (
    <section className={styles.optionSection}>
      {selectedOptions.length > 0 ? (
        <div className={styles.choiceGroup}>
          <h4>{t("schedule.filters.selected")}</h4>
          <div className={styles.chips}>
            {selectedOptions.map((option) => (
              <AriaButton
                className={styles.chip}
                key={option.id}
                aria-label={t("schedule.filters.removeSelection", { name: option.name })}
                onPress={() => onSelectedChange(selectedIds.filter((id) => id !== option.id))}
              >
                <span>{option.name}</span>
                <span aria-hidden="true">×</span>
              </AriaButton>
            ))}
          </div>
        </div>
      ) : null}

      {favoriteOptions.length > 0 && !isManagingFavorites ? (
        <div className={styles.choiceGroup}>
          <h4>{t("schedule.filters.favorites")}</h4>
          <div className={styles.chips}>
            {favoriteOptions.map((option) => {
              const isSelected = selectedIds.includes(option.id);
              return (
                <AriaButton
                  className={styles.favoriteChip}
                  key={option.id}
                  aria-pressed={isSelected}
                  onPress={() =>
                    onSelectedChange(
                      isSelected
                        ? selectedIds.filter((id) => id !== option.id)
                        : [...selectedIds, option.id],
                    )
                  }
                >
                  <Star aria-hidden="true" fill="currentColor" />
                  {option.name}
                </AriaButton>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className={styles.searchToolbar}>
        <SearchField
          className={styles.searchField}
          aria-label={searchLabel}
          value={query}
          onChange={(value) => {
            setQuery(value);
            setActiveIndex(0);
          }}
        >
          <Input aria-label={searchLabel} placeholder={searchLabel} />
        </SearchField>
        <AriaButton
          className={styles.manageFavoritesButton}
          aria-pressed={isManagingFavorites}
          onPress={() => setIsManagingFavorites((current) => !current)}
        >
          <Star aria-hidden="true" />
          {t(
            isManagingFavorites
              ? "schedule.filters.doneManagingFavorites"
              : "schedule.filters.manageFavorites",
          )}
        </AriaButton>
      </div>

      {isManagingFavorites ? (
        <p className={styles.modeDescription}>{t("schedule.filters.favoriteModeDescription")}</p>
      ) : null}
      <p className={styles.optionSummary} id={optionCountId} aria-live="polite" aria-atomic="true">
        {t("schedule.filters.optionCount", { count: filteredOptions.length })}
      </p>
      <p className={styles.visuallyHidden} id={optionInstructionsId}>
        {t("schedule.filters.optionInstructions")}
      </p>

      {filteredOptions.length > 0 ? (
        <CheckboxGroup
          className={styles.optionList}
          aria-label={label}
          aria-describedby={`${optionCountId} ${optionInstructionsId}`}
          value={activeValues.map(String)}
          onChange={(values) => {
            const ids = values.map(Number);
            if (isManagingFavorites) onFavoriteChange(ids);
            else onSelectedChange(ids);
          }}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null))
              setActiveIndex(0);
          }}
        >
          {filteredOptions.map((option, index) => (
            <div className={styles.optionRow} data-option-index={index} key={option.id}>
              <Checkbox
                className={styles.checkbox}
                value={String(option.id)}
                excludeFromTabOrder={index !== activeIndex}
                aria-keyshortcuts="ArrowUp ArrowDown Home End"
                onFocus={() => setActiveIndex(index)}
                onKeyDown={(event) => handleOptionKeyDown(event, index)}
              >
                {({ isSelected }) => (
                  <>
                    <span className={styles.checkboxBox} aria-hidden="true">
                      {isSelected ? (
                        isManagingFavorites ? (
                          <Star fill="currentColor" />
                        ) : (
                          <Check />
                        )
                      ) : null}
                    </span>
                    <span className={styles.optionName}>{option.name}</span>
                  </>
                )}
              </Checkbox>
            </div>
          ))}
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
  const [activeCategory, setActiveCategory] = useState<OptionCategory>("instructors");
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
      <Modal className={styles.modal} isDismissable>
        <Dialog className={styles.dialog}>
          <header className={styles.header}>
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
          </header>

          <div className={styles.dialogBody}>
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

            <section className={styles.locationSection}>
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

            <Tabs
              className={styles.peopleAndClasses}
              selectedKey={activeCategory}
              onSelectionChange={(key) => setActiveCategory(key as OptionCategory)}
            >
              <TabList
                className={styles.categoryTabs}
                aria-label={t("schedule.filters.filterCategory")}
              >
                <Tab className={styles.categoryTab} id="instructors">
                  <User aria-hidden="true" />
                  {t("schedule.filters.instructor")}
                  {search.instructors.length > 0 ? <span>{search.instructors.length}</span> : null}
                </Tab>
                <Tab className={styles.categoryTab} id="activityTypes">
                  <FilterList aria-hidden="true" />
                  {t("schedule.filters.activityType")}
                  {search.activityTypes.length > 0 ? (
                    <span>{search.activityTypes.length}</span>
                  ) : null}
                </Tab>
              </TabList>

              <TabPanel className={styles.categoryPanel} id={activeCategory}>
                {activeCategory === "instructors" ? (
                  <SearchableOptions
                    key="instructors"
                    label={t("schedule.filters.instructor")}
                    searchLabel={t("schedule.filters.searchInstructors")}
                    emptyLabel={t("schedule.filters.noInstructors")}
                    options={instructors}
                    selectedIds={search.instructors}
                    favoriteIds={favoriteInstructorIds}
                    onSelectedChange={(ids) => onChange({ ...search, instructors: ids })}
                    onFavoriteChange={setFavoriteInstructorIds}
                  />
                ) : (
                  <SearchableOptions
                    key="activityTypes"
                    label={t("schedule.filters.activityType")}
                    searchLabel={t("schedule.filters.searchActivityTypes")}
                    emptyLabel={t("schedule.filters.noActivityTypes")}
                    options={activityTypes}
                    selectedIds={search.activityTypes}
                    favoriteIds={favoriteActivityTypeIds}
                    onSelectedChange={(ids) => onChange({ ...search, activityTypes: ids })}
                    onFavoriteChange={setFavoriteActivityTypeIds}
                  />
                )}
              </TabPanel>
            </Tabs>
          </div>

          <footer className={styles.footer}>
            <Button slot="close">{t("schedule.filters.done")}</Button>
          </footer>
        </Dialog>
      </Modal>
    </DialogTrigger>
  );
}
