import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import type { ScheduleFilterOption } from "../api/scheduleFilterQueries";
import { addDays, todayInStockholm } from "../model/scheduleDate";
import type { ScheduleSearch } from "../model/scheduleSearch";
import { ScheduleFilterPanel } from "./ScheduleFilterPanel";
import { ScheduleFilters } from "./ScheduleFilters";
const instructors = [
  { id: 21, name: "Anna Andersson" },
  { id: 22, name: "Beatrice Berg" },
  { id: 23, name: "Erik Ek" },
  { id: 24, name: "Fatima Farah" },
];
const activityTypes = [
  { id: 3392, name: "Yinyoga, 55 min" },
  { id: 743, name: "Body pump, 60 min" },
  { id: 4128, name: "Pilates, 55 min" },
  { id: 12449, name: "BoxFight Small Group, 55 min" },
];
function InteractiveFilters({
  search: initialSearch,
  instructors = [],
  activityTypes = [],
  isLoadingOptions = false,
  hasOptionsError = false,
}: {
  search: ScheduleSearch;
  instructors?: ScheduleFilterOption[];
  activityTypes?: ScheduleFilterOption[];
  isLoadingOptions?: boolean;
  hasOptionsError?: boolean;
}) {
  const [search, setSearch] = useState(initialSearch);
  const [isOpen, setIsOpen] = useState(false);
  const [activeSavedSearchId, setActiveSavedSearchId] = useState<string>();
  return (
    <div>
      <ScheduleFilters
        search={search}
        onChange={setSearch}
        isFiltersOpen={isOpen}
        onFiltersOpenChange={setIsOpen}
      />
      {isOpen ? (
        <ScheduleFilterPanel
          search={search}
          onChange={setSearch}
          instructors={instructors}
          activityTypes={activityTypes}
          isLoadingOptions={isLoadingOptions}
          hasOptionsError={hasOptionsError}
          onRetryOptions={() => undefined}
          activeSavedSearchId={activeSavedSearchId}
          onActiveSavedSearchChange={setActiveSavedSearchId}
        />
      ) : null}
    </div>
  );
}
const meta = {
  title: "Features/Schedule/Components/Filters",
  component: InteractiveFilters,
  args: {
    search: {
      date: todayInStockholm(),
      locations: [1, 4128, 3509],
      instructors: [],
      activityTypes: [],
    },
    instructors,
    activityTypes,
  },
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "The compact toolbar opens a normally scrolling, search-first filter editor with removable selections and progressively disclosed option lists.",
      },
    },
  },
} satisfies Meta<typeof InteractiveFilters>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const ActiveFilter: Story = {
  args: {
    search: {
      date: todayInStockholm(),
      locations: [1, 4128, 3509],
      instructors: [21],
      activityTypes: [],
    },
  },
};
export const DateOutsideSelector: Story = {
  args: {
    search: {
      date: addDays(todayInStockholm(), 400),
      locations: [1, 4128, 3509],
      instructors: [],
      activityTypes: [],
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "A manually entered URL date outside the upcoming-day selector remains visible below it, including the year when it is not the current year.",
      },
    },
  },
};
export const LocationSpecificClassTypes: Story = {
  args: {
    search: {
      date: todayInStockholm(),
      locations: [1],
      instructors: [],
      activityTypes: [],
    },
    activityTypes: [
      { id: 3392, name: "Available at Haga", businessUnitIds: [1] },
      { id: 743, name: "Available at multiple locations", businessUnitIds: [1, 4128] },
      { id: 4128, name: "Available elsewhere", businessUnitIds: [4128] },
      { id: 12449, name: "Unknown location metadata" },
    ],
  },
};
export const LongLists: Story = {
  args: {
    instructors: Array.from({ length: 213 }, (_, index) => ({
      id: index + 1,
      name: `Instructor ${String(index + 1).padStart(3, "0")}`,
    })),
    activityTypes: Array.from({ length: 635 }, (_, index) => ({
      id: index + 1_000,
      name: `Class type ${String(index + 1).padStart(3, "0")}`,
    })),
  },
};
export const LoadingOptions: Story = {
  args: { isLoadingOptions: true },
};
export const PartialError: Story = {
  args: { hasOptionsError: true },
};
export const Favorites: Story = {
  loaders: [
    () => {
      window.localStorage.setItem(
        "hb-stunder.schedule-preferences",
        JSON.stringify({
          version: 1,
          favoriteInstructorIds: [21, 24],
          favoriteActivityTypeIds: [743, 4128],
        }),
      );
    },
  ],
};
export const NoFavorites: Story = {
  loaders: [() => window.localStorage.clear()],
};
export const SavedSearchManagement: Story = {
  loaders: [
    () => {
      window.localStorage.setItem(
        "hb-stunder.schedule-preferences",
        JSON.stringify({
          version: 2,
          favoriteInstructorIds: [],
          favoriteActivityTypeIds: [],
          savedSearches: [
            {
              version: 1,
              id: "weekday-yoga",
              name: "Weekday yoga",
              criteria: {
                businessUnitIds: [1, 4128],
                instructorIds: [21, 24],
                activityTypeIds: [3392],
              },
            },
            {
              version: 1,
              id: "unavailable-class",
              name: "Old favorite class",
              criteria: {
                businessUnitIds: [1],
                instructorIds: [99999],
                activityTypeIds: [88888],
              },
            },
          ],
        }),
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: /open schedule filters|öppna schemafilter/i }),
    );
    await expect(canvas.getByText("Weekday yoga")).toBeInTheDocument();
  },
};
export const NoSearchResults: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: /open schedule filters|öppna schemafilter/i }),
    );
    await userEvent.type(
      canvas.getByRole("searchbox", { name: /search instructors|sök instruktörer/i }),
      "No matching instructor",
    );
    await expect(
      canvas.getByText(/no matching options found|inga matchande alternativ hittades/i),
    ).toBeInTheDocument();
  },
};
export const KeyboardNavigation: Story = {
  args: LongLists.args,
  parameters: {
    docs: {
      description: {
        story:
          "The option lists use normal document order and native controls, including after progressively revealing a long list.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const filterButton = canvas.getByRole("button", {
      name: /open schedule filters|öppna schemafilter/i,
    });
    await userEvent.click(filterButton);
    const filterView = canvas.getByRole("region", { name: /^filters?$|^filter$/i });
    const instructorSelector = within(filterView).getByRole("region", {
      name: /instructor|instruktör/i,
    });
    await userEvent.click(
      within(instructorSelector).getByRole("button", {
        name: /browse options|bläddra bland alternativ/i,
      }),
    );
    const firstInstructor = within(instructorSelector).getByRole("checkbox", {
      name: "Instructor 001",
    });
    firstInstructor.focus();
    await userEvent.keyboard(" ");
    await expect(firstInstructor).toBeChecked();
    await userEvent.tab();
    await expect(canvasElement.ownerDocument.activeElement).toBe(
      within(instructorSelector).getByRole("button", {
        name: /add Instructor 001 to favorites|lägg till Instructor 001 som favorit/i,
      }),
    );
    await userEvent.keyboard(" ");
    await userEvent.tab();
    await expect(canvasElement.ownerDocument.activeElement).toBe(
      within(instructorSelector).getByRole("checkbox", { name: "Instructor 002" }),
    );
  },
};
export const English: Story = { globals: { locale: "en" } };
export const Mobile: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
};
export const ReducedMotion: Story = { globals: { reducedMotion: "reduce" } };
