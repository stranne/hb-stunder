// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import i18n from "../../../i18n";
import { addDays, todayInStockholm } from "../model/scheduleDate";
import type { ScheduleSearch } from "../model/scheduleSearch";
import { ScheduleFilters } from "./ScheduleFilters";

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

const today = todayInStockholm();
const filterSelection = { locations: [1], instructors: [], activityTypes: [] };
const search = { date: addDays(today, 7), ...filterSelection };

describe("ScheduleFilters", () => {
  it("allows the filter dialog to be opened from the keyboard", () => {
    render(<ScheduleFilters search={search} onChange={vi.fn()} />);

    const selectedDay = screen.getByRole("button", { pressed: true });
    const nextWeekButton = screen.getByRole("button", { name: "Next week" });
    const filterButton = screen.getByRole("button", { name: "Open schedule filters" });
    expect(filterButton.tabIndex).toBe(0);
    expect(
      selectedDay.compareDocumentPosition(nextWeekButton) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      nextWeekButton.compareDocumentPosition(filterButton) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    filterButton.focus();
    fireEvent.keyDown(filterButton, { key: "Enter" });
    fireEvent.keyUp(filterButton, { key: "Enter" });

    expect(document.activeElement).not.toBe(filterButton);
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("shows three weeks of named upcoming days and selects a day directly", () => {
    const onChange = vi.fn();
    render(<ScheduleFilters search={{ date: today, ...filterSelection }} onChange={onChange} />);

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
    expect(onChange).toHaveBeenCalledWith({ date: addDays(today, 3), ...filterSelection });
  });

  it("moves between weeks without changing the filters", () => {
    const onChange = vi.fn();
    render(<ScheduleFilters search={search} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Previous week" }));
    fireEvent.click(screen.getByRole("button", { name: "Next week" }));

    expect(onChange).toHaveBeenNthCalledWith(1, { date: today, ...filterSelection });
    expect(onChange).toHaveBeenNthCalledWith(2, {
      date: addDays(today, 14),
      ...filterSelection,
    });
  });

  it("selects and focuses adjacent days with the left and right arrow keys", () => {
    function ControlledFilters() {
      const [controlledSearch, setControlledSearch] = useState<ScheduleSearch>({
        date: addDays(today, 6),
        ...filterSelection,
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

  it("searches instructors and manages favorite quick picks separately", () => {
    render(
      <ScheduleFilters
        search={search}
        onChange={vi.fn()}
        instructors={[
          { id: 20, name: "Aaron Ahl" },
          { id: 21, name: "Anna Andersson" },
          { id: 22, name: "Beatrice Berg" },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open schedule filters" }));
    fireEvent.click(screen.getByRole("button", { name: "Manage favorites" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Beatrice Berg" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Anna Andersson" }));
    fireEvent.click(screen.getByRole("button", { name: "Done managing" }));

    const favoriteHeading = screen.getByRole("heading", { name: "Favorites" });
    const favoriteGroup = within(favoriteHeading.parentElement!);
    expect(favoriteGroup.getAllByRole("button")).toEqual([
      favoriteGroup.getByRole("button", { name: "Anna Andersson" }),
      favoriteGroup.getByRole("button", { name: "Beatrice Berg" }),
    ]);

    fireEvent.change(screen.getByRole("searchbox", { name: "Search instructors" }), {
      target: { value: "beatrice" },
    });

    expect(screen.getByRole("checkbox", { name: "Beatrice Berg" })).toBeTruthy();
    expect(screen.queryByRole("checkbox", { name: "Anna Andersson" })).toBeNull();
    expect(window.localStorage.getItem("hb-stunder.schedule-preferences")).toContain("21");
    expect(window.localStorage.getItem("hb-stunder.schedule-preferences")).toContain("22");
  });

  it("shows one searchable option category with stable roving keyboard focus", () => {
    const instructors = Array.from({ length: 85 }, (_, index) => ({
      id: index + 1,
      name: `Instructor ${String(index + 1).padStart(3, "0")}`,
    }));
    render(<ScheduleFilters search={search} onChange={vi.fn()} instructors={instructors} />);

    fireEvent.click(screen.getByRole("button", { name: "Open schedule filters" }));

    const instructorList = screen.getByRole("group", { name: "Instructor" });
    const instructorOptions = within(instructorList).getAllByRole("checkbox");
    expect(screen.getByText("85 options")).toBeTruthy();
    expect(instructorList.getAttribute("aria-describedby")).toBeTruthy();
    expect(instructorOptions).toHaveLength(85);
    expect(instructorOptions[0]!.tabIndex).toBe(0);
    expect(instructorOptions.slice(1).every((option) => option.tabIndex === -1)).toBe(true);

    fireEvent.focus(instructorOptions[0]!);
    fireEvent.keyDown(instructorOptions[0]!, { key: "End" });
    expect(document.activeElement).toBe(instructorOptions[84]);

    const classTypeTab = screen.getByRole("tab", { name: "Class type" });
    fireEvent.blur(instructorOptions[84]!, { relatedTarget: classTypeTab });
    expect(instructorOptions[0]!.tabIndex).toBe(0);

    fireEvent.change(screen.getByRole("searchbox", { name: "Search instructors" }), {
      target: { value: "Instructor 085" },
    });
    expect(screen.getByRole("checkbox", { name: "Instructor 085" })).toBeTruthy();
    expect(screen.getByText("1 option")).toBeTruthy();

    fireEvent.click(classTypeTab);
    expect(screen.getByRole("searchbox", { name: "Search class types" })).toBeTruthy();
    expect(screen.queryByRole("searchbox", { name: "Search instructors" })).toBeNull();
  });

  it("shows selected options as removable chips", () => {
    const instructors = Array.from({ length: 85 }, (_, index) => ({
      id: index + 1,
      name: `Instructor ${String(index + 1).padStart(3, "0")}`,
    }));
    render(
      <ScheduleFilters
        search={{ ...search, instructors: [85] }}
        onChange={vi.fn()}
        instructors={instructors}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open schedule filters" }));

    expect(
      (screen.getByRole("checkbox", { name: "Instructor 085" }) as HTMLInputElement).checked,
    ).toBe(true);
    expect(screen.getByRole("button", { name: "Remove Instructor 085 from filters" })).toBeTruthy();
  });

  it("announces filter-option failures and retries them", () => {
    const onRetryOptions = vi.fn();
    render(
      <ScheduleFilters
        search={search}
        onChange={vi.fn()}
        hasOptionsError
        onRetryOptions={onRetryOptions}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open schedule filters" }));

    expect(screen.getByRole("alert").textContent).toContain(
      "Some filter options could not be loaded.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry filter options" }));
    expect(onRetryOptions).toHaveBeenCalledOnce();
  });

  it("changes the date and locations while preserving the other filters", () => {
    const onChange = vi.fn();
    render(<ScheduleFilters search={search} onChange={onChange} />);
    const chosenDate = addDays(today, 10);

    fireEvent.change(screen.getByLabelText("Choose date…"), { target: { value: chosenDate } });
    fireEvent.click(screen.getByRole("button", { name: "Open schedule filters" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Hagabadet Drottningtorget" }));
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    fireEvent.click(
      within(screen.getByRole("group", { name: "Upcoming days" })).getAllByRole("button")[0]!,
    );

    expect(onChange).toHaveBeenNthCalledWith(1, { date: chosenDate, ...filterSelection });
    expect(onChange).toHaveBeenNthCalledWith(2, {
      ...search,
      locations: [1, 4128],
    });
    expect(onChange).toHaveBeenNthCalledWith(3, { date: today, ...filterSelection });
  });
});
