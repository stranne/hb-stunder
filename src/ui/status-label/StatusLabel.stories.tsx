import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { StatusLabel } from "./StatusLabel";

const meta = {
  title: "Design system/Components/Status label",
  component: StatusLabel,
  args: {
    children: "8 spots available",
    dynamic: true,
    tone: "positive",
  },
  parameters: { layout: "centered" },
} satisfies Meta<typeof StatusLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Positive: Story = {};
export const Warning: Story = {
  args: { children: "2 spots left", dynamic: true, tone: "warning" },
};
export const Neutral: Story = {
  args: { children: "10 participated", dynamic: false, tone: "neutral" },
};

export const StatusLanguage: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "1rem" }}>
      <StatusLabel tone="positive" dynamic>
        8 spots available
      </StatusLabel>
      <StatusLabel tone="warning" dynamic>
        2 spots left
      </StatusLabel>
      <StatusLabel>10 participated</StatusLabel>
    </div>
  ),
};
