import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { useState } from "react";
import { todayInStockholm } from "../model/scheduleDate";
import type { ScheduleSearch } from "../model/scheduleSearch";
import { ScheduleFilters } from "./ScheduleFilters";

function InteractiveFilters({ initialSearch }: { initialSearch: ScheduleSearch }) {
  const [search, setSearch] = useState(initialSearch);
  return <ScheduleFilters search={search} onChange={setSearch} />;
}

const meta = {
  title: "Schedule/ScheduleFilters",
  component: ScheduleFilters,
  args: {
    search: { date: todayInStockholm(), location: 1 },
    onChange: () => undefined,
  },
  render: ({ search }) => <InteractiveFilters initialSearch={search} />,
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
