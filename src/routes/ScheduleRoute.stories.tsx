import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { expect, userEvent, within } from "storybook/test";
import { addDays, todayInStockholm } from "../features/schedule/model/scheduleDate";
import { indexRoute } from "../app/router";

const meta = {
  title: "Application/Pages/Schedule/In application",
  parameters: {
    layout: "fullscreen",
    tanstack: {
      router: {
        route: indexRoute,
        query: {
          date: "2026-07-28",
          locations: [1, 4128, 3509],
          instructors: [],
          activityTypes: [],
        },
      },
    },
  },
} satisfies Meta<typeof indexRoute>;

export default meta;
type Story = StoryObj<typeof meta>;

const expectScheduleNavigation = async (canvasElement: HTMLElement, view: "Lista" | "Rum") => {
  const canvas = within(canvasElement);
  const navigation = within(canvas.getByRole("navigation"));
  await expect(navigation.getAllByRole("link").map((link) => link.textContent)).toEqual([
    "Schema",
    expect.stringContaining("Mina bokningar"),
  ]);
  await expect(navigation.getByRole("link", { name: "Schema" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(canvas.getByRole("radio", { name: view })).toBeChecked();
  await expect(canvas.getByRole("button", { name: /^Filter/ })).toBeInTheDocument();
};

export const Classes: Story = {
  play: async ({ canvasElement }) => expectScheduleNavigation(canvasElement, "Lista"),
};

export const ActiveFilters: Story = {
  parameters: {
    tanstack: {
      router: {
        route: indexRoute,
        query: {
          date: "2026-07-28",
          locations: [1],
          instructors: [21],
          activityTypes: [],
        },
      },
    },
  },
};

export const Rooms: Story = {
  parameters: {
    tanstack: {
      router: {
        route: indexRoute,
        query: {
          date: "2026-07-28",
          locations: [1, 4128, 3509],
          instructors: [],
          activityTypes: [],
          view: "rooms",
        },
      },
    },
  },
  play: async ({ canvasElement }) => expectScheduleNavigation(canvasElement, "Rum"),
};

export const Filters: Story = {
  parameters: {
    tanstack: {
      router: {
        route: indexRoute,
        query: {
          date: "2026-07-28",
          locations: [1, 4128, 3509],
          instructors: [],
          activityTypes: [],
          filters: true,
        },
      },
    },
    docs: {
      description: {
        story:
          "Filters open over the schedule: a side panel on wide screens and a bottom sheet on phones. Links to the former filter view (view=filters) open it too.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await expect(await page.findByRole("dialog", { name: "Filter" })).toBeVisible();
  },
};

export const FiltersMobile: Story = {
  ...Filters,
  globals: { viewport: { value: "mobile", isRotated: false } },
};

export const ClassesMobile: Story = {
  ...Classes,
  globals: { viewport: { value: "mobile", isRotated: false } },
};

export const RoomsMobile: Story = {
  ...Rooms,
  globals: { viewport: { value: "mobile", isRotated: false } },
};

export const SignInToBook: Story = {
  parameters: {
    tanstack: {
      router: {
        route: indexRoute,
        query: {
          date: addDays(todayInStockholm(), 1),
          locations: [1],
          instructors: [],
          activityTypes: [],
        },
      },
    },
    docs: {
      description: {
        story:
          "A signed-out customer presses Book, signs in, and lands in that class's confirmation without finding it again.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const book = (await canvas.findAllByRole("button", { name: "Boka" })).at(-1)!;
    await userEvent.click(book);
    const signIn = within(await page.findByRole("dialog", { name: "Logga in för att boka" }));
    await userEvent.type(signIn.getByRole("textbox", { name: "Användarnamn" }), "member");
    await userEvent.type(signIn.getByLabelText("Lösenord"), "password");
    await userEvent.click(signIn.getByRole("button", { name: "Logga in och fortsätt" }));
    await expect(
      await page.findByRole("dialog", { name: "Bekräfta bokning" }, { timeout: 5_000 }),
    ).toBeVisible();
  },
};
