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
}: {
  search: ScheduleSearch;
  instructors?: ScheduleFilterOption[];
  activityTypes?: ScheduleFilterOption[];
}) {
  const [search, setSearch] = useState(initialSearch);
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        blockSize: "calc(100dvh - 2rem)",
        overflow: "hidden",
      }}
    >
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
          onClose={() => setIsOpen(false)}
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
          "The compact toolbar prioritizes day selection and filters on wide screens, while adding direct date access when space is limited.",
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
export const KeyboardNavigation: Story = {
  args: LongLists.args,
  parameters: {
    docs: {
      description: {
        story:
          "Tab through the day controls to the filter button, then continue through either long option list to verify stable keyboard navigation.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const selectedDay = canvas.getByRole("button", { pressed: true });
    const nextWeek = canvas.getByRole("button", { name: /next week|nästa vecka/i });
    const filterButton = canvas.getByRole("button", {
      name: /open schedule filters|öppna schemafilter/i,
    });

    await expect(
      selectedDay.compareDocumentPosition(nextWeek) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    await expect(
      nextWeek.compareDocumentPosition(filterButton) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    await userEvent.click(filterButton);
    const filterView = within(canvasElement.ownerDocument.body).getByRole("region", {
      name: /filters|filter/i,
    });
    const instructorList = within(filterView).getByRole("group", {
      name: /instructor|instruktör/i,
    });
    const allInstructors = within(instructorList).getByRole("group", { name: /all|alla/i });
    await expect(instructorList.clientHeight).toBeGreaterThan(208);
    await expect(allInstructors.querySelectorAll('input[type="checkbox"]').length).toBeLessThan(20);
    const firstInstructor = within(allInstructors).getByRole("checkbox", {
      name: "Instructor 001",
    });
    firstInstructor.focus({ preventScroll: true });

    const pageSize = Math.max(1, Math.floor(instructorList.clientHeight / 44));
    const pageTarget = `Instructor ${String(pageSize + 1).padStart(3, "0")}`;
    const nextTarget = `Instructor ${String(pageSize + 2).padStart(3, "0")}`;
    await userEvent.keyboard("{PageDown}");
    await expect(canvasElement.ownerDocument.activeElement).toBe(
      within(allInstructors).getByRole("checkbox", { name: pageTarget }),
    );
    await userEvent.tab();
    await userEvent.keyboard("{ArrowDown}");
    await expect(canvasElement.ownerDocument.activeElement).toBe(
      within(allInstructors).getByRole("button", {
        name: new RegExp(`add ${nextTarget} to favorites|lägg till ${nextTarget} som favorit`, "i"),
      }),
    );
    await userEvent.tab({ shift: true });
    await expect(allInstructors.querySelectorAll('input[type="checkbox"]').length).toBeLessThan(20);

    await userEvent.tab();
    await userEvent.tab();
    await expect(canvasElement.ownerDocument.activeElement).toBe(
      within(filterView).getByRole("searchbox", { name: /search class types|sök klasstyper/i }),
    );
    await expect(instructorList.scrollTop).toBe(0);
    await userEvent.tab({ shift: true });
    await expect(canvasElement.ownerDocument.activeElement).toBe(
      within(allInstructors).getByRole("button", {
        name: /add Instructor 001 to favorites|lägg till Instructor 001 som favorit/i,
      }),
    );
    await userEvent.tab({ shift: true });
    await expect(canvasElement.ownerDocument.activeElement).toBe(firstInstructor);

    await userEvent.keyboard("{End}");
    await expect(canvasElement.ownerDocument.activeElement).toBe(
      within(allInstructors).getByRole("checkbox", { name: "Instructor 213" }),
    );
    await expect(allInstructors.querySelectorAll('input[type="checkbox"]').length).toBeLessThan(15);
    await expect(instructorList.scrollTop).toBeGreaterThan(0);

    await userEvent.keyboard("{Home}");
    const activeCheckbox = within(allInstructors).getByRole("checkbox", {
      name: "Instructor 001",
    });
    await expect(canvasElement.ownerDocument.activeElement).toBe(activeCheckbox);
    await userEvent.keyboard(" ");
    await expect(activeCheckbox).toBeChecked();

    await userEvent.tab();
    await expect(canvasElement.ownerDocument.activeElement).toBe(
      within(allInstructors).getByRole("button", {
        name: /add Instructor 001 to favorites|lägg till Instructor 001 som favorit/i,
      }),
    );
    await userEvent.keyboard(" ");
    await expect(canvasElement.ownerDocument.activeElement).toBe(
      within(allInstructors).getByRole("button", {
        name: /remove Instructor 001 from favorites|ta bort Instructor 001 från favoriter/i,
      }),
    );

    await userEvent.tab();
    await expect(canvasElement.ownerDocument.activeElement).toBe(
      within(filterView).getByRole("searchbox", { name: /search class types|sök klasstyper/i }),
    );
    await userEvent.tab({ shift: true });
    const favoriteInstructors = within(filterView).getByRole("group", {
      name: /favorites|favoriter/i,
    });
    await expect(canvasElement.ownerDocument.activeElement).toBe(
      within(favoriteInstructors).getByRole("button", {
        name: /remove Instructor 001 from favorites|ta bort Instructor 001 från favoriter/i,
      }),
    );
    await userEvent.tab({ shift: true });
    await expect(canvasElement.ownerDocument.activeElement).toBe(
      within(favoriteInstructors).getByRole("checkbox", { name: "Instructor 001" }),
    );
  },
};
export const English: Story = { globals: { locale: "en" } };
export const Mobile: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
};
export const ReducedMotion: Story = { globals: { reducedMotion: "reduce" } };
