import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { useState, type ComponentProps } from "react";
import { expect, userEvent, within } from "storybook/test";
import { LOCATION_IDS } from "../model/scheduleSearch";
import { ScheduleFilterSummary } from "./ScheduleFilterSummary";

function InteractiveSummary(props: ComponentProps<typeof ScheduleFilterSummary>) {
  const [search, setSearch] = useState(props.search);
  return <ScheduleFilterSummary {...props} search={search} onChange={setSearch} />;
}

const meta = {
  title: "Features/Schedule/Components/Filter summary",
  component: ScheduleFilterSummary,
  render: (args) => <InteractiveSummary {...args} />,
  args: {
    search: { date: "2026-09-06", locations: [1], instructors: [21], activityTypes: [3392] },
    instructors: [{ id: 21, name: "Alex Example" }],
    activityTypes: [{ id: 3392, name: "Yinyoga" }],
    onChange: () => undefined,
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ScheduleFilterSummary>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Selected: Story = {};
export const AllLocations: Story = {
  args: {
    search: {
      date: "2026-09-06",
      locations: [...LOCATION_IDS],
      instructors: [],
      activityTypes: [],
    },
  },
};
export const MissingNames: Story = { args: { instructors: [], activityTypes: [] } };
export const MobileLongNames: Story = {
  args: { instructors: [{ id: 21, name: "Alexandra Example med ett långt instruktörsnamn" }] },
  globals: { viewport: { value: "mobile", isRotated: false } },
};
export const RemoveAndClear: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const removeInstructor = canvas.getByRole("button", {
      name: /^(Remove|Ta bort) Alex Example$/,
    });
    removeInstructor.focus();
    await userEvent.keyboard("{Enter}");
    await expect(removeInstructor).not.toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /^(Remove|Ta bort) Yinyoga$/ })).toHaveFocus();
    await userEvent.click(canvas.getByRole("button", { name: /Clear filters|Rensa filter/ }));
    await expect(canvas.getByText(/All locations|Alla platser/)).toBeVisible();
    await expect(canvas.queryByRole("button")).not.toBeInTheDocument();
    await expect(canvas.getByRole("group")).toHaveFocus();
  },
};
export const RemoveLastLocation: Story = {
  args: { search: { date: "2026-09-06", locations: [1], instructors: [], activityTypes: [] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Hagabadet i Haga/ }));
    await expect(canvas.getByText(/All locations|Alla platser/)).toBeVisible();
    await expect(canvas.getByRole("group")).toHaveFocus();
  },
};
