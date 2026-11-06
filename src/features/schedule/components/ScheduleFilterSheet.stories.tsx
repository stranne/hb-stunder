import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { todayInStockholm } from "../model/scheduleDate";
import type { ScheduleSearch } from "../model/scheduleSearch";
import { ScheduleFilterPanel } from "./ScheduleFilterPanel";
import { ScheduleFilterSheet, type ScheduleFilterSheetProps } from "./ScheduleFilterSheet";

const instructors = [
  { id: 21, name: "Anna Andersson" },
  { id: 22, name: "Beatrice Berg" },
  { id: 23, name: "Erik Ek" },
];
const activityTypes = [
  { id: 3392, name: "Yinyoga, 55 min" },
  { id: 743, name: "Body pump, 60 min" },
  { id: 4128, name: "Pilates, 55 min" },
];

function SheetWithPanel(props: Omit<ScheduleFilterSheetProps, "children">) {
  const [search, setSearch] = useState<ScheduleSearch>({
    date: todayInStockholm(),
    locations: [1, 4128],
    instructors: [21],
    activityTypes: [],
  });

  return (
    <ScheduleFilterSheet {...props}>
      <ScheduleFilterPanel
        search={search}
        onChange={setSearch}
        instructors={instructors}
        activityTypes={activityTypes}
      />
    </ScheduleFilterSheet>
  );
}

const meta = {
  title: "Features/Schedule/Components/Filter sheet",
  component: ScheduleFilterSheet,
  render: (args) => <SheetWithPanel {...args} />,
  args: { isOpen: true, onOpenChange: fn(), resultCount: 4, children: null },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Filters open over the schedule instead of replacing it: a side panel on wide screens, where the list stays visible, and an arched bottom sheet on phones. The footer reports how many classes match on the selected day.",
      },
    },
  },
} satisfies Meta<typeof ScheduleFilterSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SidePanel: Story = {
  play: async ({ args, canvasElement }) => {
    const sheet = within(
      await within(canvasElement.ownerDocument.body).findByRole("dialog", { name: "Filter" }),
    );
    await userEvent.click(sheet.getByRole("button", { name: "Visa 4 klasser" }));
    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
  },
};

export const BottomSheet: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
};

export const OneResult: Story = { args: { resultCount: 1 } };

export const NoResults: Story = { args: { resultCount: 0 } };

export const CountUnavailable: Story = {
  args: { resultCount: undefined },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement.ownerDocument.body).findByRole("button", {
        name: "Visa schemat",
      }),
    ).toBeVisible();
  },
};

export const CloseButton: Story = {
  play: async ({ args, canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await page.findByRole("button", { name: "Stäng filter" }));
    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
  },
};

export const Dark: Story = {
  globals: { colorMode: "dark", viewport: { value: "mobile", isRotated: false } },
};
