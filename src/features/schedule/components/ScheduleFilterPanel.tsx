import { useEffect, useState } from "react";
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
import type { ScheduleFilterOption } from "../api/scheduleFilterQueries";
import { readSchedulePreferences, writeFavoriteFilters } from "../model/schedulePreferences";
import { LOCATION_IDS, type ScheduleSearch } from "../model/scheduleSearch";
import styles from "./ScheduleFilterPanel.module.css";

const locations: ScheduleFilterOption[] = [
  { id: 1, name: "Haga" },
  { id: 4128, name: "Drottningtorget" },
  { id: 3509, name: "Älvstranden" },
];

interface ScheduleFilterPanelProps {
  search: ScheduleSearch;
  onChange: (search: ScheduleSearch) => void;
  instructors: ScheduleFilterOption[];
  activityTypes: ScheduleFilterOption[];
  isLoadingOptions?: boolean;
}

function toggleId(ids: number[], id: number) {
  return ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
}

function normalized(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase();
}

interface SearchableOptionsProps {
  label: string;
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
  const sortedOptions = [...options].sort((a, b) => a.name.localeCompare(b.name));
  const filteredOptions = sortedOptions.filter((option) =>
    normalized(option.name).includes(normalized(query)),
  );
  const favorites = sortedOptions.filter((option) => favoriteIds.includes(option.id));

  function optionRow(option: ScheduleFilterOption) {
    const isFavorite = favoriteIds.includes(option.id);
    return (
      <div className={styles.optionRow} key={option.id}>
        <Checkbox className={styles.checkbox} value={String(option.id)}>
          {({ isSelected }) => (
            <>
              <span className={styles.checkboxBox} aria-hidden="true">
                {isSelected ? "✓" : ""}
              </span>
              <span>{option.name}</span>
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
          <span aria-hidden="true">{isFavorite ? "★" : "☆"}</span>
        </ToggleButton>
      </div>
    );
  }

  return (
    <section className={styles.section}>
      <h3>{label}</h3>
      <SearchField
        className={styles.searchField}
        aria-label={searchLabel}
        value={query}
        onChange={setQuery}
      >
        <Input aria-label={searchLabel} placeholder={searchLabel} />
        {query ? <AriaButton aria-label={t("schedule.filters.clearSearch")}>×</AriaButton> : null}
      </SearchField>

      {filteredOptions.length > 0 ? (
        <CheckboxGroup
          className={styles.optionList}
          aria-label={label}
          value={selectedIds.map(String)}
          onChange={(values) => onSelectedChange(values.map(Number))}
        >
          {query ? (
            filteredOptions.map(optionRow)
          ) : (
            <>
              {favorites.length > 0 ? (
                <div className={styles.optionGroup} role="group" aria-label={favoriteLabel}>
                  <span className={styles.optionGroupLabel}>{favoriteLabel}</span>
                  {favorites.map(optionRow)}
                </div>
              ) : null}
              <div
                className={styles.optionGroup}
                role="group"
                aria-label={t("schedule.filters.all")}
              >
                <span className={styles.optionGroupLabel}>{t("schedule.filters.all")}</span>
                {sortedOptions.map(optionRow)}
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
        {t("schedule.filters.filters")}
        {activeFilterCount > 0 ? <span className={styles.count}>{activeFilterCount}</span> : null}
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
            <p className={styles.loading}>{t("schedule.filters.loadingOptions")}</p>
          ) : null}

          <section className={`${styles.section} ${styles.locationSection}`}>
            <h3>{t("schedule.filters.location")}</h3>
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
              {locations.map((location) => (
                <Checkbox
                  className={styles.locationCheckbox}
                  key={location.id}
                  value={String(location.id)}
                >
                  {({ isSelected }) => (
                    <>
                      <span className={styles.checkboxBox} aria-hidden="true">
                        {isSelected ? "✓" : ""}
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
