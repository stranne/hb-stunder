import { useQueryClient } from "@tanstack/react-query";
import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { delay, http, HttpResponse, type RequestHandler } from "msw";
import { useEffect, type ComponentProps } from "react";
import { expect, waitFor, within } from "storybook/test";
import { API_BASE_URL } from "../../../api/client";
import { scheduleForDate } from "../../../mocks/fixtures/schedule";
import { handlers } from "../../../mocks/handlers";
import { scheduleKeys } from "../api/scheduleQueries";
import { addDays, todayInStockholm } from "../model/scheduleDate";
import { SchedulePage } from "./SchedulePage";
import roomStyles from "./RoomCalendar.module.css";
import pageStyles from "./SchedulePage.module.css";

const endpoint = `${API_BASE_URL}/businessunits/:businessUnit/groupactivities`;
const instructorEndpoint = `${API_BASE_URL}/services/groupactivityinstructors`;
const bookingsEndpoint = `${API_BASE_URL}/customers/:customerId/bookings/groupactivities`;
const upcomingSearch = {
  date: addDays(todayInStockholm(), 1),
  locations: [1],
  instructors: [],
  activityTypes: [],
};

function mockSchedule(businessUnit: number) {
  return scheduleForDate("2026-07-28", businessUnit);
}

function withDefaultHandlers(...storyHandlers: RequestHandler[]) {
  return { handlers: [...storyHandlers, ...handlers] };
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

export const BookingsLoading: Story = {
  args: { customerId: "900001", search: upcomingSearch },
  parameters: {
    msw: withDefaultHandlers(
      http.get(bookingsEndpoint, async () => {
        await delay("infinite");
        return HttpResponse.json([]);
      }),
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.findByText(/Loading your bookings|Laddar dina bokningar/),
    ).resolves.toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: /^(Book|Boka)$/ })).not.toBeInTheDocument();
  },
};

export const BookingsError: Story = {
  args: { customerId: "900001", search: upcomingSearch },
  parameters: {
    msw: withDefaultHandlers(
      http.get(bookingsEndpoint, () => new HttpResponse(null, { status: 503 })),
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.findByRole("alert")).resolves.toHaveTextContent(
      /booking status|bokningsstatus/,
    );
    await expect(canvas.queryByRole("button", { name: /^(Book|Boka)$/ })).not.toBeInTheDocument();
  },
};

export const RoomsBookingsError: Story = {
  ...BookingsError,
  args: { customerId: "900001", search: { ...upcomingSearch, view: "rooms" } },
};

export const SharedClassLoadError: Story = {
  args: {
    search: {
      date: "2026-07-28",
      locations: [1],
      instructors: [],
      activityTypes: [],
      activity: 101,
    },
  },
  parameters: {
    msw: withDefaultHandlers(http.get(endpoint, () => new HttpResponse(null, { status: 503 }))),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("alert");
    await expect(
      canvas.queryByText(/This class could not be found|Klassen kunde inte hittas/),
    ).not.toBeInTheDocument();
  },
};

export const FiltersOpen: Story = {
  args: {
    search: {
      date: "2026-07-28",
      locations: [1, 4128, 3509],
      instructors: [],
      activityTypes: [],
      view: "filters",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "The filter editor replaces both the schedule and its date selector; the application shell provides the persistent return action.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("region", { name: /^filters?$|^filter$/i })).toBeInTheDocument();
    await expect(
      canvas.queryByRole("group", { name: /upcoming days|kommande dagar/i }),
    ).not.toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: /done|klar/i })).not.toBeInTheDocument();
  },
};

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
  args: { search: { ...upcomingSearch, view: "rooms" } },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByLabelText("Rumskalender", { selector: "div" });
    const storyWindow = canvasElement.ownerDocument.defaultView;
    storyWindow?.scrollTo(0, 360);
    await waitFor(async () => {
      await expect(storyWindow?.scrollY).toBeGreaterThan(0);
      const controls = canvasElement.querySelector(`.${pageStyles.stickyControls}`)!;
      const header = canvasElement.querySelector(`.${roomStyles.stickyHeader}`)!;
      await expect(header.getBoundingClientRect().top).toBeCloseTo(
        controls.getBoundingClientRect().bottom,
        0,
      );
    });
  },
};

export const RoomsWithSelectedFilters: Story = {
  args: { search: { ...upcomingSearch, view: "rooms" } },
  globals: { colorMode: "dark" },
  parameters: {
    docs: {
      description: {
        story:
          "The complete filter chips and Clear filters control remain visible above the calendar header. Check their lower edges as well as the sticky header after scrolling.",
      },
    },
  },
};

export const RoomsWithWrappedFilters: Story = {
  ...RoomsWithSelectedFilters,
  args: { search: { ...upcomingSearch, locations: [1, 4128], view: "rooms" } },
  globals: { colorMode: "dark", viewport: { value: "mobile", isRotated: false } },
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
  parameters: { msw: withDefaultHandlers(http.get(endpoint, () => HttpResponse.json([]))) },
};

export const PartialLocationError: Story = {
  parameters: {
    msw: withDefaultHandlers(
      http.get(endpoint, ({ params }) => {
        const businessUnit = Number(params.businessUnit);
        return businessUnit === 4128
          ? HttpResponse.json({ message: "Unavailable" }, { status: 503 })
          : HttpResponse.json(mockSchedule(businessUnit));
      }),
    ),
  },
};

export const ApiError: Story = {
  args: {
    search: { date: "2026-07-30", locations: [1], instructors: [], activityTypes: [] },
  },
  parameters: {
    msw: withDefaultHandlers(
      http.get(endpoint, () => HttpResponse.json({ message: "Unavailable" }, { status: 503 })),
    ),
  },
};

export const FilterOptionsError: Story = {
  parameters: {
    msw: withDefaultHandlers(
      http.get(instructorEndpoint, () =>
        HttpResponse.json({ message: "Unavailable" }, { status: 503 }),
      ),
    ),
  },
};

export const SlowResponse: Story = {
  parameters: {
    msw: withDefaultHandlers(
      http.get(endpoint, async ({ params }) => {
        await delay(2_000);
        return HttpResponse.json(mockSchedule(Number(params.businessUnit)));
      }),
    ),
  },
};

export const BackgroundRefresh: Story = {
  render: (args) => <BackgroundRefreshDemo {...args} />,
  parameters: {
    msw: withDefaultHandlers(
      http.get(endpoint, async ({ params }) => {
        await delay(700);
        return HttpResponse.json(mockSchedule(Number(params.businessUnit)));
      }),
    ),
  },
};

export const ReducedMotion: Story = { globals: { reducedMotion: "reduce" } };
