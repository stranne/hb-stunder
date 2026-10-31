import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { EmptyState } from "./EmptyState";

const meta = {
  title: "Design system/Components/Empty state",
  component: EmptyState,
  args: { children: "Inga klasser hittades för den här dagen." },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Dark: Story = { globals: { colorMode: "dark" } };
export const Loading: Story = {
  args: { role: "status", children: "Laddar dina bokningar…" },
};
export const LongMessage: Story = {
  args: {
    children:
      "Inga rum har aktiviteter som matchar de valda filtren. Prova en annan dag eller ta bort ett filter.",
  },
};
