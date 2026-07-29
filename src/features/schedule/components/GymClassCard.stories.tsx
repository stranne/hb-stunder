import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { scheduleFixtures } from "../../../mocks/fixtures/schedule";
import { Button } from "../../../ui/button/Button";
import { GymClassCard, GymClassCardSkeleton } from "./GymClassCard";

function AvailabilityChangeDemo() {
  const [remaining, setRemaining] = useState(8);
  const activity = {
    ...scheduleFixtures.available,
    slots: { ...scheduleFixtures.available.slots, leftToBook: remaining },
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
  title: "Schedule/GymClassCard",
  component: GymClassCard,
  args: { activity: scheduleFixtures.available },
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
export const AlmostFull: Story = { args: { activity: scheduleFixtures.almostFull } };
export const FullyBooked: Story = { args: { activity: scheduleFixtures.full } };
export const WaitingList: Story = { args: { activity: scheduleFixtures.waitingList } };
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
