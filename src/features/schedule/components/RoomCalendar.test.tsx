// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import i18n from "../../../i18n";
import { scheduleFixtures } from "../../../mocks/fixtures/schedule";
import { RoomCalendar } from "./RoomCalendar";

beforeAll(async () => i18n.changeLanguage("en"));
afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe("RoomCalendar", () => {
  it("only creates columns for rooms occupied by filtered activities", () => {
    render(
      <RoomCalendar
        date="2026-07-28"
        activities={[
          scheduleFixtures.available,
          { ...scheduleFixtures.almostFull, locations: [{ id: 12, name: "Ägget" }] },
        ]}
        bookingsByActivity={new Map()}
        onBook={async () => undefined}
        onCancel={async () => undefined}
      />,
    );

    expect(screen.getByText("Yogastudio")).toBeTruthy();
    expect(screen.getByText("Ägget")).toBeTruthy();
    expect(screen.queryByText("Hotyogastudio")).toBeNull();
  });

  it("shows time and booking controls only in the activity details", () => {
    render(
      <RoomCalendar
        date="2026-07-28"
        activities={[scheduleFixtures.available]}
        bookingsByActivity={new Map()}
        customerId="900001"
        onBook={async () => undefined}
        onCancel={async () => undefined}
      />,
    );

    const activity = screen.getByRole("button", { name: "Open details for Yinyoga, 55 min" });
    expect(activity.textContent).toBe("Yinyoga, 55 min");
    expect(screen.queryByRole("button", { name: "Book" })).toBeNull();

    fireEvent.click(activity);
    const details = screen.getByRole("dialog");
    expect(within(details).getByText(/^Time: 08:00.*09:00/)).toBeTruthy();
    fireEvent.click(within(details).getByRole("button", { name: "Book" }));

    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(within(details).getByRole("group", { name: "Confirm booking" })).toBeTruthy();
    fireEvent.click(within(details).getByRole("button", { name: "Cancel" }));
    expect(within(details).getByRole("button", { name: "Book" })).toBeTruthy();
  });

  it("marks the current time when showing today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-28T10:30:00Z"));

    render(
      <RoomCalendar
        date="2026-07-28"
        activities={[scheduleFixtures.available]}
        bookingsByActivity={new Map()}
        onBook={async () => undefined}
        onCancel={async () => undefined}
      />,
    );

    expect(screen.getByLabelText(/Current time: 12:30/)).toBeTruthy();
  });
});
