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

export const Classes: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const links = canvas.getAllByRole("link");
    await expect(links.filter((link) => link.getAttribute("aria-current") === "page")).toEqual([
      expect.objectContaining({ textContent: "Klasser" }),
    ]);
    await expect(canvas.getByRole("link", { name: /filters|filter/i })).toBeInTheDocument();
  },
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const links = canvas.getAllByRole("link");
    await expect(links.filter((link) => link.getAttribute("aria-current") === "page")).toEqual([
      expect.objectContaining({ textContent: "Rum" }),
    ]);
    await expect(canvas.getByRole("link", { name: /filters|filter/i })).toBeInTheDocument();
  },
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
          view: "filters",
        },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const links = canvas.getAllByRole("link");
    await expect(links.filter((link) => link.getAttribute("aria-current") === "page")).toEqual([
      expect.objectContaining({ textContent: "Filter" }),
    ]);
    await expect(canvas.getByRole("main", { name: "Filter" })).toBeInTheDocument();
  },
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
