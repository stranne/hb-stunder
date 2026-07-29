// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import i18n from "../../../i18n";
import { addDays, todayInStockholm } from "../model/scheduleDate";
import { ScheduleFilters } from "./ScheduleFilters";

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

afterEach(cleanup);

const today = todayInStockholm();
const search = { date: addDays(today, 7), location: 1 };

describe("ScheduleFilters", () => {
  it("shows three weeks of named upcoming days and selects a day directly", () => {
    const onChange = vi.fn();
    render(<ScheduleFilters search={{ date: today, location: 1 }} onChange={onChange} />);

    const upcomingDays = screen.getByRole("group", { name: "Upcoming days" });
    const dayButtons = within(upcomingDays).getAllByRole("button");

    expect(dayButtons).toHaveLength(21);
    expect(dayButtons.filter((button) => button.dataset.visible === "true")).toHaveLength(7);
    expect(dayButtons[0]?.getAttribute("aria-current")).toBe("date");
    expect(dayButtons[0]?.querySelector("span:first-child")?.textContent?.trim()).toBe("Today");
    expect(dayButtons[0]?.querySelector("strong")?.textContent).toBe(
      String(Number(today.slice(-2))),
    );
    expect(dayButtons[0]?.querySelector("span:last-child")?.textContent).not.toContain("Today");
    expect(dayButtons[0]?.tabIndex).toBe(0);
    expect(dayButtons.slice(1).every((button) => button.tabIndex === -1)).toBe(true);

    fireEvent.click(dayButtons[3]!);
    expect(onChange).toHaveBeenCalledWith({ date: addDays(today, 3), location: 1 });
  });

  it("moves between weeks without changing the location", () => {
    const onChange = vi.fn();
    render(<ScheduleFilters search={search} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Previous week" }));
    fireEvent.click(screen.getByRole("button", { name: "Next week" }));

    expect(onChange).toHaveBeenNthCalledWith(1, { date: today, location: 1 });
    expect(onChange).toHaveBeenNthCalledWith(2, { date: addDays(today, 14), location: 1 });
  });

  it("selects and focuses adjacent days with the left and right arrow keys", () => {
    function ControlledFilters() {
      const [controlledSearch, setControlledSearch] = useState({
        date: addDays(today, 6),
        location: 1,
      });

      return <ScheduleFilters search={controlledSearch} onChange={setControlledSearch} />;
    }

    render(<ControlledFilters />);
    const dayButtons = within(screen.getByRole("group", { name: "Upcoming days" })).getAllByRole(
      "button",
    );

    dayButtons[6]!.focus();
    fireEvent.keyDown(dayButtons[6]!, { key: "ArrowRight" });

    expect(dayButtons[7]?.getAttribute("aria-current")).toBe("date");
    expect(dayButtons[7]?.tabIndex).toBe(0);
    expect(dayButtons[6]?.tabIndex).toBe(-1);
    expect(document.activeElement).toBe(dayButtons[7]);

    fireEvent.keyDown(dayButtons[7]!, { key: "ArrowLeft" });

    expect(dayButtons[6]?.getAttribute("aria-current")).toBe("date");
    expect(dayButtons[6]?.tabIndex).toBe(0);
    expect(dayButtons[7]?.tabIndex).toBe(-1);
    expect(document.activeElement).toBe(dayButtons[6]);
  });

  it("changes the date and location while preserving the other filter", () => {
    const onChange = vi.fn();
    render(<ScheduleFilters search={search} onChange={onChange} />);
    const chosenDate = addDays(today, 10);

    fireEvent.change(screen.getByLabelText("Choose date…"), { target: { value: chosenDate } });
    fireEvent.change(screen.getByLabelText("Location"), { target: { value: "4128" } });
    fireEvent.click(
      within(screen.getByRole("group", { name: "Upcoming days" })).getAllByRole("button")[0]!,
    );

    expect(onChange).toHaveBeenNthCalledWith(1, { date: chosenDate, location: 1 });
    expect(onChange).toHaveBeenNthCalledWith(2, { date: search.date, location: 4128 });
    expect(onChange).toHaveBeenNthCalledWith(3, { date: today, location: 1 });
  });
});
