import type { Meta, StoryObj } from "@storybook/react-vite";
import { http, HttpResponse } from "msw";
import { API_BASE_URL } from "../../../api/client";
import { SchedulePage } from "./SchedulePage";

const endpoint = `${API_BASE_URL}/businessunits/:businessUnit/groupactivities`;

const meta = {
  title: "Schedule/SchedulePage",
  component: SchedulePage,
  args: {
    search: { date: "2026-07-28", location: 1 },
    onSearchChange: () => undefined,
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SchedulePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { search: { date: "2026-07-29", location: 1 } },
  parameters: { msw: [http.get(endpoint, () => HttpResponse.json([]))] },
};

export const ApiError: Story = {
  args: { search: { date: "2026-07-30", location: 1 } },
  parameters: {
    msw: [http.get(endpoint, () => HttpResponse.json({ message: "Unavailable" }, { status: 503 }))],
  },
};
