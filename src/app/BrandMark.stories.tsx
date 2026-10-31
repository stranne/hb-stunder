import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { BrandMark } from "./BrandMark";

const meta = {
  title: "Application/Shell/Brand mark",
  component: BrandMark,
  decorators: [
    (Story) => (
      <div
        style={{
          display: "inline-flex",
          padding: "1.5rem 2rem",
          borderRadius: "var(--radius-md)",
          background: "var(--color-chrome)",
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BrandMark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OnChrome: Story = {};
export const Dark: Story = { globals: { colorMode: "dark" } };
