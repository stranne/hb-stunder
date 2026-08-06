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
          "Move through a long result list, leave it, and return to verify that focus has a stable first-item entry point.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const filterButton = canvas.getByRole("button", {
      name: /open schedule filters|öppna schemafilter/i,
    });

    await userEvent.click(filterButton);
    const dialog = within(canvasElement.ownerDocument.body).getByRole("dialog");
    const instructorList = within(dialog).getByRole("group", { name: /instructor|instruktör/i });
    const firstInstructor = within(instructorList).getByRole("checkbox", {
      name: "Instructor 001",
    });
    const secondInstructor = within(instructorList).getByRole("checkbox", {
      name: "Instructor 002",
    });
    firstInstructor.focus({ preventScroll: true });

    await userEvent.keyboard("{ArrowDown}");
    await expect(canvasElement.ownerDocument.activeElement).toBe(secondInstructor);
    await userEvent.keyboard("{End}");
    await expect(canvasElement.ownerDocument.activeElement).toBe(
      within(instructorList).getByRole("checkbox", { name: "Instructor 213" }),
    );

    await userEvent.tab();
    await expect(canvasElement.ownerDocument.activeElement).toBe(
      within(dialog).getByRole("button", { name: /done|klar/i }),
    );
    await userEvent.tab({ shift: true });
    await expect(canvasElement.ownerDocument.activeElement).toBe(firstInstructor);

    await userEvent.click(
      within(dialog).getByRole("button", { name: /manage favorites|hantera favoriter/i }),
    );
    await userEvent.click(firstInstructor);
    await userEvent.click(
      within(dialog).getByRole("button", { name: /done managing|klar med favoriter/i }),
    );
    const favoriteShortcut = within(dialog).getByRole("button", { name: "Instructor 001" });
    await userEvent.click(favoriteShortcut);
    await expect(favoriteShortcut).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(within(dialog).getByRole("tab", { name: /class type|klasstyp/i }));
    await expect(
      within(dialog).getByRole("searchbox", { name: /search class types|sök klasstyper/i }),
    ).toBeTruthy();
    await expect(
      within(dialog).queryByRole("searchbox", { name: /search instructors|sök instruktörer/i }),
    ).toBeNull();
  },
};
export const English: Story = { globals: { locale: "en" } };
export const Mobile: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
};
export const ReducedMotion: Story = { globals: { reducedMotion: "reduce" } };
