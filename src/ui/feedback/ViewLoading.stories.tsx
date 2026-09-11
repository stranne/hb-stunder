import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { expect, within } from "storybook/test";
import { ViewLoading } from "./ViewLoading";

const meta = {
  title: "Design system/Components/View loading",
  component: ViewLoading,
  parameters: { layout: "fullscreen" },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("status")).toHaveTextContent(
      /Loading view|Laddar vyn/,
    );
  },
} satisfies Meta<typeof ViewLoading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const English: Story = { globals: { locale: "en" } };
export const Mobile: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
};
