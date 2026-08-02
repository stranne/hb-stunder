// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import i18n from "../../../i18n";
import { scheduleFixtures } from "../../../mocks/fixtures/schedule";
import { RoomCalendar } from "./RoomCalendar";

beforeAll(async () => i18n.changeLanguage("en"));
afterEach(() => vi.useRealTimers());

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
