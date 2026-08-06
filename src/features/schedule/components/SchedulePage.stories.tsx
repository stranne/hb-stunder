import { useQueryClient } from "@tanstack/react-query";
import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { delay, http, HttpResponse } from "msw";
import { useEffect, type ComponentProps } from "react";
import { expect, within } from "storybook/test";
import { API_BASE_URL } from "../../../api/client";
import { scheduleForDate } from "../../../mocks/fixtures/schedule";
import { scheduleKeys } from "../api/scheduleQueries";
import { SchedulePage } from "./SchedulePage";

const endpoint = `${API_BASE_URL}/businessunits/:businessUnit/groupactivities`;
const instructorEndpoint = `${API_BASE_URL}/services/groupactivityinstructors`;

function mockSchedule(businessUnit: number) {
  return scheduleForDate("2026-07-28", businessUnit);
}

function BackgroundRefreshDemo(props: ComponentProps<typeof SchedulePage>) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
    }, 1_000);

    return () => window.clearTimeout(timeout);
  }, [queryClient]);

  return <SchedulePage {...props} />;
}

const meta = {
  title: "Application/Pages/Schedule/States",
  component: SchedulePage,
  args: {
    search: {
      date: "2026-07-28",
      locations: [1, 4128, 3509],
      instructors: [],
      activityTypes: [],
    },
    onSearchChange: () => undefined,
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Sticky controls keep an opaque full-width backdrop while content scrolls beneath them. Class lists gain a lower shadow after scrolling; room calendars place that shadow below their sticky room headers instead.",
      },
    },
  },
} satisfies Meta<typeof SchedulePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
};

export const Rooms: Story = {
  args: {
    search: {
      date: "2026-07-28",
      locations: [1, 4128, 3509],
      instructors: [],
      activityTypes: [],
      view: "rooms",
    },
  },
};

export const RoomsScrolled: Story = {
  ...Rooms,
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByLabelText("Rumskalender", { selector: "div" });
    const storyWindow = canvasElement.ownerDocument.defaultView;
    storyWindow?.scrollTo(0, 360);
    await expect(storyWindow?.scrollY).toBeGreaterThan(0);
  },
};

export const RoomsMobile: Story = {
  args: {
    search: {
      date: "2026-07-28",
      locations: [1, 4128, 3509],
      instructors: [],
      activityTypes: [],
      view: "rooms",
    },
  },
  globals: { viewport: { value: "mobile", isRotated: false } },
};

export const Empty: Story = {
  args: {
    search: { date: "2026-07-29", locations: [1], instructors: [], activityTypes: [] },
  },
  parameters: { msw: [http.get(endpoint, () => HttpResponse.json([]))] },
};

export const PartialLocationError: Story = {
  parameters: {
    msw: [
      http.get(endpoint, ({ params }) => {
        const businessUnit = Number(params.businessUnit);
        return businessUnit === 4128
          ? HttpResponse.json({ message: "Unavailable" }, { status: 503 })
          : HttpResponse.json(mockSchedule(businessUnit));
      }),
    ],
  },
};

export const ApiError: Story = {
  args: {
    search: { date: "2026-07-30", locations: [1], instructors: [], activityTypes: [] },
  },
  parameters: {
    msw: [http.get(endpoint, () => HttpResponse.json({ message: "Unavailable" }, { status: 503 }))],
  },
};

export const FilterOptionsError: Story = {
  parameters: {
    msw: [
      http.get(instructorEndpoint, () =>
        HttpResponse.json({ message: "Unavailable" }, { status: 503 }),
      ),
    ],
  },
};

export const SlowResponse: Story = {
  parameters: {
    msw: [
      http.get(endpoint, async ({ params }) => {
        await delay(2_000);
        return HttpResponse.json(mockSchedule(Number(params.businessUnit)));
      }),
    ],
  },
};

export const BackgroundRefresh: Story = {
  render: (args) => <BackgroundRefreshDemo {...args} />,
  parameters: {
    msw: [
      http.get(endpoint, async ({ params }) => {
        await delay(700);
        return HttpResponse.json(mockSchedule(Number(params.businessUnit)));
      }),
    ],
  },
};

export const ReducedMotion: Story = { globals: { reducedMotion: "reduce" } };
