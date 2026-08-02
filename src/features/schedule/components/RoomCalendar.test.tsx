// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vite-plus/test";
import i18n from "../../../i18n";
import { scheduleFixtures } from "../../../mocks/fixtures/schedule";
import { RoomCalendar } from "./RoomCalendar";

beforeAll(async () => i18n.changeLanguage("en"));

describe("RoomCalendar", () => {
  it("only creates columns for rooms occupied by filtered activities", () => {
    render(
      <RoomCalendar
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
});
