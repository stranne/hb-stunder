// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import i18n from "../../../i18n";
import { scheduleFixtures } from "../../../mocks/fixtures/schedule";
import { RoomCalendar } from "./RoomCalendar";
import styles from "./RoomCalendar.module.css";

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
    expect(screen.getAllByText("Hagabadet i Haga")).toHaveLength(1);
    expect(screen.queryByText("Hotyogastudio")).toBeNull();
  });

  it("keeps room headers aligned with horizontal calendar scrolling", () => {
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

    const calendar = screen.getByLabelText("Room calendar");
    const scroller = calendar.querySelector<HTMLElement>(`.${styles.scroller}`)!;
    const headers = calendar.querySelector<HTMLElement>(`.${styles.roomHeaders}`)!;
    scroller.scrollLeft = 160;
    fireEvent.scroll(scroller);

    expect(headers.style.transform).toBe("translateX(-160px)");
  });

  it("centers a business-unit label within the visible part of its room group", () => {
    render(
      <RoomCalendar
        date="2026-07-28"
        activities={[
          {
            ...scheduleFixtures.available,
            locations: [
              { id: 10, name: "Room 1" },
              { id: 11, name: "Room 2" },
              { id: 12, name: "Room 3" },
            ],
          },
        ]}
        bookingsByActivity={new Map()}
        onBook={async () => undefined}
        onCancel={async () => undefined}
      />,
    );

    const calendar = screen.getByLabelText("Room calendar");
    const scroller = calendar.querySelector<HTMLElement>(`.${styles.scroller}`)!;
    const viewport = calendar.querySelector<HTMLElement>(`.${styles.headerViewport}`)!;
    const group = calendar.querySelector<HTMLElement>(`.${styles.businessUnitGroup}`)!;
    Object.defineProperties(viewport, { clientWidth: { value: 240 } });
    Object.defineProperties(group, {
      offsetLeft: { value: 0 },
      offsetWidth: { value: 576 },
    });

    scroller.scrollLeft = 96;
    fireEvent.scroll(scroller);

    expect(group.style.getPropertyValue("--business-unit-visible-start")).toBe("96px");
    expect(group.style.getPropertyValue("--business-unit-visible-width")).toBe("240px");
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
    expect(within(activity).getByText("Yinyoga, 55 min")).toBeTruthy();
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

  it("shows every instructor assigned to an activity", () => {
    const activityWithMultipleInstructors = {
      ...scheduleFixtures.available,
      instructors: [
        { id: 201, name: "Alex Example" },
        { id: 202, name: "Sam Example" },
      ],
    };

    render(
      <RoomCalendar
        date="2026-07-28"
        activities={[activityWithMultipleInstructors]}
        bookingsByActivity={new Map()}
        onBook={async () => undefined}
        onCancel={async () => undefined}
      />,
    );

    const activity = screen.getByRole("button", { name: "Open details for Yinyoga, 55 min" });
    expect(within(activity).getByText("Alex Example, Sam Example")).toBeTruthy();

    fireEvent.click(activity);
    expect(within(screen.getByRole("dialog")).getByText("Alex Example, Sam Example")).toBeTruthy();
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
