import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { scheduleFixtures } from "../../../mocks/fixtures/schedule";
import { Button } from "../../../ui/button/Button";
import type { ScheduledActivity } from "../model/schedule";
import { GymClassCard, GymClassCardSkeleton } from "./GymClassCard";

function scheduledInYear(activity: ScheduledActivity, year: number): ScheduledActivity {
  const duration = activity.duration;
  if (!duration?.start || !duration.end) return activity;

  return {
    ...activity,
    duration: {
      start: duration.start.replace(/^\d{4}/, String(year)),
      end: duration.end.replace(/^\d{4}/, String(year)),
    },
  };
}

const upcomingAvailable = scheduledInYear(scheduleFixtures.available, 2099);
const upcomingWaitingList = scheduledInYear(scheduleFixtures.waitingList, 2099);

const ordinaryBooking = {
  groupActivity: { id: scheduleFixtures.available.id },
  groupActivityBooking: { id: 700001 },
  type: "groupActivityBooking",
};

function CancellationCompletedDemo() {
  const [booking, setBooking] = useState<typeof ordinaryBooking | undefined>(ordinaryBooking);

  return (
    <GymClassCard
      activity={scheduleFixtures.available}
      booking={booking}
      onBook={async () => undefined}
      onCancel={async () => setBooking(undefined)}
    />
  );
}

function AvailabilityChangeDemo() {
  const [remaining, setRemaining] = useState(8);
  const activity = {
    ...upcomingAvailable,
    slots: { ...upcomingAvailable.slots, leftToBook: remaining },
  };

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <GymClassCard activity={activity} />
      <Button onPress={() => setRemaining((current) => (current === 8 ? 7 : 8))}>
        Simulate availability refresh
      </Button>
    </div>
  );
}

const meta = {
  title: "Features/Schedule/Components/Class card",
  component: GymClassCard,
  args: {
    activity: upcomingAvailable,
    onBook: async (): Promise<void> => undefined,
  },
  decorators: [
    (Story) => (
      <div style={{ containerType: "inline-size", width: "min(48rem, calc(100vw - 2rem))" }}>
        <Story />
      </div>
    ),
  ],
  parameters: { layout: "centered" },
} satisfies Meta<typeof GymClassCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Available: Story = {};
export const ClassListItem: Story = {
  args: { showTime: false, headingLevel: 3 },
};
export const LongClassListItem: Story = {
  args: {
    activity: {
      ...upcomingAvailable,
      name: "Lång workshop",
      duration: { start: "2099-07-28T06:00:00.000Z", end: "2099-07-28T08:30:00.000Z" },
    },
    showTime: false,
    headingLevel: 3,
  },
};
export const MultipleInstructors: Story = {
  args: {
    activity: {
      ...upcomingAvailable,
      instructors: [
        { id: 201, name: "Alex Example" },
        { id: 202, name: "Sam Example" },
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(/Alex Example, Sam Example/)).toBeVisible();
    await expect(within(canvasElement).getByText(/Yogastudio/)).toBeVisible();
  },
};
export const MultipleLocations: Story = {
  args: {
    activity: {
      ...upcomingAvailable,
      locations: [
        { id: 18, name: "Yogastudio" },
        { id: 10, name: "Hotyogastudio" },
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(/Yogastudio, Hotyogastudio/)).toBeVisible();
  },
};
export const Started: Story = {
  args: { activity: scheduledInYear(scheduleFixtures.available, 2000) },
};
export const WithClassInformation: Story = {
  args: { activity: scheduledInYear(scheduleFixtures.withMessages, 2099) },
};
export const AlmostFull: Story = {
  args: { activity: scheduledInYear(scheduleFixtures.almostFull, 2099) },
};
export const FullyBooked: Story = {
  args: { activity: scheduledInYear(scheduleFixtures.full, 2099) },
};
export const WaitingList: Story = { args: { activity: upcomingWaitingList } };
export const EmptyWaitingList: Story = {
  args: {
    activity: {
      ...upcomingWaitingList,
      slots: { ...upcomingWaitingList.slots, inWaitingList: 0 },
    },
    showTime: false,
  },
};
export const ExistingBooking: Story = {
  args: {
    booking: { groupActivity: { id: scheduleFixtures.available.id }, type: "groupActivityBooking" },
  },
};
export const CancellationConfirmation: Story = {
  args: { booking: ordinaryBooking, onCancel: async () => undefined },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Avboka" }));
    await expect(page.getByRole("dialog")).toBeVisible();
  },
};
export const CancellationPending: Story = {
  args: { booking: ordinaryBooking, onCancel: () => new Promise<void>(() => undefined) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Avboka" }));
    await userEvent.click(within(page.getByRole("dialog")).getByRole("button", { name: "Avboka" }));
    await expect(page.getByRole("status")).toHaveTextContent("Avbokningen pågår…");
  },
};
export const CancellationError: Story = {
  args: {
    booking: ordinaryBooking,
    onCancel: async () => {
      throw new Error("Mock cancellation failure");
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Avboka" }));
    await userEvent.click(within(page.getByRole("dialog")).getByRole("button", { name: "Avboka" }));
    await expect(page.getByRole("alert")).toBeVisible();
  },
};
export const CancellationCompleted: Story = { render: () => <CancellationCompletedDemo /> };
export const WaitingListJoined: Story = {
  args: {
    activity: upcomingWaitingList,
    booking: {
      groupActivity: { id: scheduleFixtures.waitingList.id },
      type: "groupActivityWaitingListBooking",
    },
  },
};
export const OrdinaryBookingConfirmation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Boka" }));
    await expect(page.getByRole("dialog")).toBeVisible();
  },
};
export const WaitingListConfirmation: Story = {
  args: { activity: upcomingWaitingList },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Ställ dig i kö" }));
    await expect(page.getByRole("dialog")).toBeVisible();
  },
};
export const WaitingListEnglish: Story = {
  args: { activity: upcomingWaitingList },
  globals: { locale: "en" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Join waiting list" }));
    await expect(page.getByText(/This does not book a spot/)).toBeVisible();
  },
};
export const WaitingListPending: Story = {
  args: {
    activity: upcomingWaitingList,
    onBook: () => new Promise<void>(() => undefined),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Ställ dig i kö" }));
    await userEvent.click(
      within(page.getByRole("dialog")).getByRole("button", { name: "Ställ dig i kö" }),
    );
    await expect(page.getByRole("status")).toHaveTextContent("Ställer dig i kö…");
  },
};
export const WaitingListError: Story = {
  args: {
    activity: upcomingWaitingList,
    onBook: async () => {
      throw new Error("Mock waiting-list failure");
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Ställ dig i kö" }));
    await userEvent.click(
      within(page.getByRole("dialog")).getByRole("button", { name: "Ställ dig i kö" }),
    );
    await expect(page.getByRole("alert")).toBeVisible();
  },
};
export const Cancelled: Story = { args: { activity: scheduleFixtures.cancelled } };
export const English: Story = { globals: { locale: "en" } };
export const Mobile: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
};
export const ReducedMotion: Story = { globals: { reducedMotion: "reduce" } };

export const AvailabilityChanged: Story = {
  render: () => <AvailabilityChangeDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Simulate availability refresh" }));
    await expect(canvasElement.querySelector("[data-availability-value]")).toHaveAttribute(
      "data-updated",
      "true",
    );
  },
};

export const Loading: Story = {
  render: () => <GymClassCardSkeleton />,
};
