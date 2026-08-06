import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { ActivitySpotAvailability } from "./ActivitySpotAvailability";

const meta = {
  title: "Features/Schedule/Components/Activity spot availability",
  component: ActivitySpotAvailability,
  args: { available: 8, total: 18 },
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: "18rem" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ActivitySpotAvailability>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Details: Story = {};
export const LowAvailability: Story = { args: { available: 2 } };
export const Edge: Story = {
  args: { presentation: "edge" },
  decorators: [
    (Story) => (
      <div
        style={{
          position: "relative",
          display: "grid",
          alignContent: "end",
          blockSize: "5rem",
          overflow: "hidden",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-sm)",
          background: "var(--color-surface)",
        }}
      >
        <Story />
      </div>
    ),
  ],
};
export const Full: Story = { args: { available: 0 } };
