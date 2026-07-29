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
  { id: 201, name: "Yoga" },
  { id: 202, name: "Strength" },
  { id: 203, name: "Pilates" },
  { id: 204, name: "Boxing" },
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
  title: "Schedule/ScheduleFilters",
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
  parameters: { layout: "padded" },
} satisfies Meta<typeof ScheduleFilters>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const English: Story = { globals: { locale: "en" } };
export const Mobile: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
};
export const ReducedMotion: Story = { globals: { reducedMotion: "reduce" } };
