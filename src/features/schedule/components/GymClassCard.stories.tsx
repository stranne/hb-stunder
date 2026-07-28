import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { scheduleFixtures } from "../../../mocks/fixtures/schedule";
import { GymClassCard, GymClassCardSkeleton } from "./GymClassCard";

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
export const Mobile: Story = { parameters: { viewport: { defaultViewport: "mobile" } } };
export const ReducedMotion: Story = { globals: { reducedMotion: "reduce" } };

export const Loading: Story = {
  render: () => <GymClassCardSkeleton />,
};
