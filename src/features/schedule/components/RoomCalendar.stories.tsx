import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { expect, userEvent, within } from "storybook/test";
import { scheduleFixtures } from "../../../mocks/fixtures/schedule";
import { todayInStockholm } from "../model/scheduleDate";
import { RoomCalendar } from "./RoomCalendar";

const meta = {
  title: "Features/Schedule/Components/Room calendar",
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
export const SurfaceDepth: Story = {
  args: {
    activities: [
      scheduleFixtures.available,
      {
        ...scheduleFixtures.withMessages,
        locations: [{ id: 10, name: "Hotyogastudio" }],
      },
      { ...scheduleFixtures.almostFull, locations: [{ id: 12, name: "Ägget" }] },
      { ...scheduleFixtures.full, locations: [{ id: 17, name: "Träningsstudio" }] },
    ],
  },
};
export const KeyboardFocus: Story = {
  play: async ({ canvasElement }) => {
    const activity = await within(canvasElement).findByRole("button", {
      name: /^Öppna detaljer för Yinyoga, 55 min, /,
    });
    await userEvent.tab();
    await expect(activity).toHaveFocus();
  },
};
export const ActivityDetails: Story = {
  args: { customerId: "900001" },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      await within(canvasElement).findByRole("button", {
        name: /^Öppna detaljer för Yinyoga, 55 min, /,
      }),
    );
    await expect(
      within(canvasElement.ownerDocument.body).queryByText(/10 (participated|deltog)/),
    ).not.toBeInTheDocument();
  },
};
export const ActivityDetailsWithClassInformation: Story = {
  args: { activities: [scheduleFixtures.withMessages], customerId: "900001" },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      await within(canvasElement).findByRole("button", {
        name: /^Öppna detaljer för Hot Hathayoga/,
      }),
    );
    await expect(within(canvasElement.ownerDocument.body).getByText("Om klassen")).toBeVisible();
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
    await expect(within(canvasElement).getByText("Alex Example")).toBeVisible();
    await expect(within(canvasElement).getByText("Sam Example")).toBeVisible();
  },
};
export const FavoriteHighlights: Story = {
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
    favoriteActivityTypeIds: [3392],
    favoriteInstructorIds: [202],
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getAllByRole("img", { name: /favorite|favorit/i }),
    ).toHaveLength(2);
  },
};
export const CurrentTime: Story = { args: { date: todayInStockholm() } };
export const GroupedBusinessUnits: Story = {
  args: {
    activities: [
      {
        ...scheduleFixtures.available,
        locations: [
          { id: 10, name: "Hotyogastudio" },
          { id: 12, name: "Ägget" },
          { id: 18, name: "Yogastudio" },
        ],
      },
      {
        ...scheduleFixtures.almostFull,
        businessUnit: { id: 4128, name: "Hagabadet Drottningtorget" },
        locations: [
          { id: 945, name: "Yogasal" },
          { id: 946, name: "Hot Yoga sal" },
        ],
      },
    ],
  },
};
export const HorizontalOverflow: Story = {
  args: {
    activities: Array.from({ length: 8 }, (_, index) => ({
      ...scheduleFixtures.available,
      id: 10_000 + index,
      locations: [{ id: 100 + index, name: `Room ${index + 1}` }],
    })),
  },
};
export const Mobile: Story = { globals: { viewport: { value: "mobile", isRotated: false } } };
export const Empty: Story = { args: { activities: [] } };
