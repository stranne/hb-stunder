import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { expect, userEvent, within } from "storybook/test";
import { scheduleFixtures } from "../../../mocks/fixtures/schedule";
import { todayInStockholm } from "../model/scheduleDate";
import { RoomCalendar } from "./RoomCalendar";

const meta = {
  title: "Schedule/RoomCalendar",
  component: RoomCalendar,
  args: {
    date: "2026-07-28",
    activities: [
      scheduleFixtures.available,
      { ...scheduleFixtures.almostFull, locations: [{ id: 12, name: "Ägget" }] },
    ],
    bookingsByActivity: new Map(),
    onBook: async () => undefined,
    onCancel: async () => undefined,
  },
} satisfies Meta<typeof RoomCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const ActivityDetails: Story = {
  args: { customerId: "900001" },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Open details for Yinyoga, 55 min" }),
    );
  },
};
export const MultipleInstructors: Story = {
  args: {
    activities: [
      {
        ...scheduleFixtures.available,
        instructors: [
          { id: 201, name: "Alex Example" },
          { id: 202, name: "Sam Example" },
        ],
      },
    ],
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("Alex Example, Sam Example")).toBeVisible();
  },
};
export const CurrentTime: Story = { args: { date: todayInStockholm() } };
export const Mobile: Story = { globals: { viewport: { value: "mobile", isRotated: false } } };
export const Empty: Story = { args: { activities: [] } };
