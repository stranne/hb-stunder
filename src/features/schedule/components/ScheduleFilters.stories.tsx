import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { useState } from "react";
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
export const English: Story = { globals: { locale: "en" } };
export const Mobile: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
};
export const ReducedMotion: Story = { globals: { reducedMotion: "reduce" } };
