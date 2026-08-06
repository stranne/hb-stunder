import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { todayInStockholm } from "../model/scheduleDate";
import type { ScheduleSearch } from "../model/scheduleSearch";
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
  initialSearch,
  instructors = [],
  activityTypes = [],
}: {
  initialSearch: ScheduleSearch;
  instructors?: Array<{ id: number; name: string }>;
  activityTypes?: Array<{ id: number; name: string }>;
}) {
  const [search, setSearch] = useState(initialSearch);
  return (
    <ScheduleFilters
      search={search}
      onChange={setSearch}
      instructors={instructors}
      activityTypes={activityTypes}
    />
  );
}

const meta = {
  title: "Features/Schedule/Components/Filters",
  component: ScheduleFilters,
  args: {
    search: {
      date: todayInStockholm(),
      locations: [1, 4128, 3509],
      instructors: [],
      activityTypes: [],
    },
    onChange: () => undefined,
    instructors,
    activityTypes,
  },
  render: ({ search, instructors, activityTypes }) => (
    <InteractiveFilters
      initialSearch={search}
      instructors={instructors}
      activityTypes={activityTypes}
    />
  ),
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "The compact toolbar prioritizes day selection and filters on wide screens, while adding direct date access when space is limited.",
      },
    },
  },
} satisfies Meta<typeof ScheduleFilters>;

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
    const dialog = within(canvasElement.ownerDocument.body).getByRole("dialog");
    const popover = dialog.parentElement!;
    const instructorList = within(dialog).getByRole("group", { name: /instructor|instruktör/i });
    const allInstructors = within(instructorList).getByRole("group", { name: /all|alla/i });
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
        name: new RegExp(
          `add ${nextTarget} to favorites|lägg till ${nextTarget} som favorit`,
          "i",
        ),
      }),
    );
    await userEvent.tab({ shift: true });
    await expect(allInstructors.querySelectorAll('input[type="checkbox"]').length).toBeLessThan(20);
    await expect(popover.scrollTop).toBe(0);

    await userEvent.keyboard("{End}");
    await expect(canvasElement.ownerDocument.activeElement).toBe(
      within(allInstructors).getByRole("checkbox", { name: "Instructor 213" }),
    );
    await expect(allInstructors.querySelectorAll('input[type="checkbox"]').length).toBeLessThan(15);
    await expect(instructorList.scrollTop).toBeGreaterThan(0);
    await expect(popover.scrollTop).toBe(0);

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
      within(dialog).getByRole("searchbox", { name: /search class types|sök klasstyper/i }),
    );
    await userEvent.tab({ shift: true });
    await expect(canvasElement.ownerDocument.activeElement).toBe(
      within(allInstructors).getByRole("button", {
        name: /remove Instructor 001 from favorites|ta bort Instructor 001 från favoriter/i,
      }),
    );
    await userEvent.tab({ shift: true });
    await expect(canvasElement.ownerDocument.activeElement).toBe(
      within(allInstructors).getByRole("checkbox", { name: "Instructor 001" }),
    );
    await expect(popover.scrollTop).toBe(0);
  },
};
export const English: Story = { globals: { locale: "en" } };
export const Mobile: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
};
export const ReducedMotion: Story = { globals: { reducedMotion: "reduce" } };
