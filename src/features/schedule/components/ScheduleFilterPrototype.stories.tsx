import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { expect, userEvent, within } from "storybook/test";
import { Check, MapPin, Star, User, Xmark } from "iconoir-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button as AriaButton,
  Checkbox,
  CheckboxGroup,
  Input,
  SearchField,
} from "react-aria-components";
import type { ScheduleFilterOption } from "../api/scheduleFilterQueries";
import { SCHEDULE_LOCATIONS } from "../model/scheduleSearch";
import styles from "./ScheduleFilterPrototype.module.css";

const BROWSE_CHUNK_SIZE = 8;

const instructors = [
  "Anna Andersson",
  "Beatrice Berg",
  "Erik Ek",
  "Fatima Farah",
  "Gabriella Gustafsson",
  "Hanna Holm",
  "Isak Isaksson",
  "Jenny Johansson",
  "Karin Karlsson",
  "Louise Lind",
  "Maya Mohammed",
  "Nils Nilsson",
  "Oskar Olsson",
  "Petra Persson",
  "Rasmus Ring",
  "Sara Svensson",
  "Therese Thulin",
  "Ulrika Ullman",
].map((name, index) => ({ id: index + 1, name }));

const activityTypes = [
  "Aqua",
  "Barre",
  "Body pump, 60 min",
  "BoxFight Small Group, 55 min",
  "Core",
  "Dans",
  "HIIT",
  "Hot yoga",
  "Meditation",
  "Pilates, 55 min",
  "Spinning",
  "Styrka",
  "Vinyasa yoga",
  "Yinyoga, 55 min",
].map((name, index) => ({ id: index + 101, name }));

interface PrototypeProps {
  initialInstructorIds?: number[];
  initialActivityTypeIds?: number[];
  favoriteInstructorIds?: number[];
  favoriteActivityTypeIds?: number[];
  initialQuery?: string;
  initiallyBrowseInstructors?: boolean;
}

function normalized(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase();
}

function toggleId(ids: number[], id: number) {
  return ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
}

interface PrototypeOptionsProps {
  label: string;
  searchLabel: string;
  options: ScheduleFilterOption[];
  selectedIds: number[];
  favoriteIds: number[];
  initialQuery?: string;
  initiallyBrowsing?: boolean;
  icon?: React.ReactNode;
  onSelectedChange: (ids: number[]) => void;
}

function PrototypeOptions({
  label,
  searchLabel,
  options,
  selectedIds,
  favoriteIds,
  initialQuery = "",
  initiallyBrowsing = false,
  icon,
  onSelectedChange,
}: PrototypeOptionsProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState(initialQuery);
  const [isBrowsing, setIsBrowsing] = useState(initiallyBrowsing);
  const [visibleCount, setVisibleCount] = useState(BROWSE_CHUNK_SIZE);
  const selected = new Set(selectedIds);
  const favorites = options.filter(
    (option) => favoriteIds.includes(option.id) && !selected.has(option.id),
  );
  const matches = options.filter((option) => normalized(option.name).includes(normalized(query)));
  const displayed = query ? matches : isBrowsing ? options.slice(0, visibleCount) : favorites;
  const grouped = displayed.reduce<Map<string, ScheduleFilterOption[]>>((groups, option) => {
    const letter = option.name[0]?.toLocaleUpperCase() ?? "#";
    groups.set(letter, [...(groups.get(letter) ?? []), option]);
    return groups;
  }, new Map());

  return (
    <section className={styles.selector} aria-labelledby={`${label}-prototype-heading`}>
      <div className={styles.sectionHeading}>
        {icon}
        <h3 id={`${label}-prototype-heading`}>{label}</h3>
      </div>
      <SearchField value={query} onChange={setQuery} aria-label={searchLabel}>
        <Input className={styles.searchInput} placeholder={searchLabel} />
      </SearchField>

      {!query && favorites.length === 0 && !isBrowsing ? (
        <p className={styles.emptyNote}>{t("schedule.filters.noFavorites")}</p>
      ) : null}

      {displayed.length > 0 ? (
        <CheckboxGroup
          className={styles.optionGroups}
          aria-label={query ? t("schedule.filters.searchResults") : label}
          value={selectedIds.map(String)}
          onChange={(values) => onSelectedChange(values.map(Number))}
        >
          {!query && !isBrowsing ? (
            <h4 className={styles.groupTitle}>{t("schedule.filters.favorites")}</h4>
          ) : null}
          {[...grouped.entries()].map(([letter, group]) => (
            <div className={styles.optionGroup} key={letter}>
              {(query || isBrowsing) && <h4 className={styles.groupTitle}>{letter}</h4>}
              {group.map((option) => (
                <div className={styles.optionRow} key={option.id}>
                  <Checkbox className={styles.optionCheckbox} value={String(option.id)}>
                    {({ isSelected }) => (
                      <>
                        <span className={styles.checkboxBox} aria-hidden="true">
                          {isSelected ? <Check /> : null}
                        </span>
                        <span>{option.name}</span>
                      </>
                    )}
                  </Checkbox>
                  {favoriteIds.includes(option.id) ? (
                    <Star
                      className={styles.favoriteIcon}
                      aria-label={t("schedule.filters.favorite")}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          ))}
        </CheckboxGroup>
      ) : query ? (
        <p className={styles.emptyNote}>{t("schedule.filters.noSearchResults")}</p>
      ) : null}

      {!query && !isBrowsing ? (
        <AriaButton className={styles.disclosureButton} onPress={() => setIsBrowsing(true)}>
          {t("schedule.filters.browseOptions")}
        </AriaButton>
      ) : null}
      {!query && isBrowsing && visibleCount < options.length ? (
        <AriaButton
          className={styles.disclosureButton}
          onPress={() => setVisibleCount((count) => count + BROWSE_CHUNK_SIZE)}
        >
          {t("schedule.filters.showMore", {
            count: Math.min(BROWSE_CHUNK_SIZE, options.length - visibleCount),
          })}
        </AriaButton>
      ) : null}
    </section>
  );
}

function ScheduleFilterPrototype({
  initialInstructorIds = [11],
  initialActivityTypeIds = [108, 114],
  favoriteInstructorIds = [1, 4, 11],
  favoriteActivityTypeIds = [103, 108, 111, 114],
  initialQuery,
  initiallyBrowseInstructors,
}: PrototypeProps) {
  const { t } = useTranslation();
  const [locations, setLocations] = useState([1, 4128, 3509]);
  const [selectedInstructorIds, setSelectedInstructorIds] = useState(initialInstructorIds);
  const [selectedActivityTypeIds, setSelectedActivityTypeIds] = useState(initialActivityTypeIds);
  const selectedOptions = useMemo(
    () => [
      ...instructors
        .filter((option) => selectedInstructorIds.includes(option.id))
        .map((option) => ({ ...option, category: "instructor" as const })),
      ...activityTypes
        .filter((option) => selectedActivityTypeIds.includes(option.id))
        .map((option) => ({ ...option, category: "activityType" as const })),
    ],
    [selectedActivityTypeIds, selectedInstructorIds],
  );

  function clearFilters() {
    setLocations(SCHEDULE_LOCATIONS.map((location) => location.id));
    setSelectedInstructorIds([]);
    setSelectedActivityTypeIds([]);
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{t("schedule.filters.label")}</p>
          <h2>{t("schedule.filters.filters")}</h2>
        </div>
        <AriaButton className={styles.clearButton} onPress={clearFilters}>
          {t("schedule.filters.clearFilters")}
        </AriaButton>
      </header>

      <section className={styles.summary} aria-labelledby="prototype-selection-heading">
        <h3 id="prototype-selection-heading">{t("schedule.filters.selectedFilters")}</h3>
        {selectedOptions.length > 0 ? (
          <div className={styles.chips}>
            {selectedOptions.map((option) => (
              <AriaButton
                className={styles.chip}
                key={`${option.category}-${option.id}`}
                aria-label={t("schedule.filters.removeSelection", { name: option.name })}
                onPress={() =>
                  option.category === "instructor"
                    ? setSelectedInstructorIds(toggleId(selectedInstructorIds, option.id))
                    : setSelectedActivityTypeIds(toggleId(selectedActivityTypeIds, option.id))
                }
              >
                {option.name}
                <Xmark aria-hidden="true" />
              </AriaButton>
            ))}
          </div>
        ) : (
          <p>{t("schedule.filters.noSelectedFilters")}</p>
        )}
      </section>

      <section className={styles.locationSection} aria-labelledby="prototype-location-heading">
        <div className={styles.sectionHeading}>
          <MapPin aria-hidden="true" />
          <h3 id="prototype-location-heading">{t("schedule.filters.location")}</h3>
        </div>
        <CheckboxGroup
          className={styles.locations}
          aria-label={t("schedule.filters.location")}
          value={locations.map(String)}
          onChange={(values) =>
            setLocations(values.length > 0 ? values.map(Number) : [1, 4128, 3509])
          }
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
        <PrototypeOptions
          label={t("schedule.filters.instructor")}
          searchLabel={t("schedule.filters.searchInstructors")}
          options={instructors}
          selectedIds={selectedInstructorIds}
          favoriteIds={favoriteInstructorIds}
          initialQuery={initialQuery}
          initiallyBrowsing={initiallyBrowseInstructors}
          icon={<User aria-hidden="true" />}
          onSelectedChange={setSelectedInstructorIds}
        />
        <PrototypeOptions
          label={t("schedule.filters.activityType")}
          searchLabel={t("schedule.filters.searchActivityTypes")}
          options={activityTypes}
          selectedIds={selectedActivityTypeIds}
          favoriteIds={favoriteActivityTypeIds}
          onSelectedChange={setSelectedActivityTypeIds}
        />
      </div>
    </main>
  );
}

const meta = {
  title: "Features/Schedule/Prototypes/Search-first filters",
  component: ScheduleFilterPrototype,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Information-architecture prototype for normal page scrolling: selected filters are removable at the top, empty searches prioritize favorites, and Browse all reveals alphabetically grouped options in bounded chunks.",
      },
    },
  },
} satisfies Meta<typeof ScheduleFilterPrototype>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const instructorHeading = canvas.getByRole("heading", {
      name: /instructor|instruktör/i,
    });
    const instructorSelector = within(instructorHeading.closest("section")!);

    await expect(instructorSelector.getAllByRole("checkbox")).toHaveLength(2);
    await userEvent.click(
      instructorSelector.getByRole("button", {
        name: /browse options|bläddra bland alternativ/i,
      }),
    );
    await expect(instructorSelector.getAllByRole("checkbox")).toHaveLength(BROWSE_CHUNK_SIZE);
    await userEvent.click(
      instructorSelector.getByRole("button", { name: /show 8 more|visa 8 till/i }),
    );
    await expect(instructorSelector.getAllByRole("checkbox")).toHaveLength(16);
    await expect(instructorSelector.getByRole("checkbox", { name: "Maya Mohammed" })).toBeChecked();
  },
};
export const SearchResults: Story = { args: { initialQuery: "an" } };
export const SelectedSearchResult: Story = {
  args: { initialQuery: "maya" },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("checkbox", { name: "Maya Mohammed" }),
    ).toBeChecked();
  },
};
export const BrowseAll: Story = { args: { initiallyBrowseInstructors: true } };
export const NoSelectionsOrFavorites: Story = {
  args: {
    initialInstructorIds: [],
    initialActivityTypeIds: [],
    favoriteInstructorIds: [],
    favoriteActivityTypeIds: [],
  },
};
export const Mobile: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
};
export const English: Story = { globals: { locale: "en" } };
