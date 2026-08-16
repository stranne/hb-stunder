// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useState, type ComponentProps } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import i18n from "../../../i18n";
import { addDays, todayInStockholm } from "../model/scheduleDate";
import type { ScheduleSearch } from "../model/scheduleSearch";
import { ScheduleFilterPanel } from "./ScheduleFilterPanel";
import { ScheduleFilterToggle } from "./ScheduleFilterToggle";
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

type FilterTestViewProps = ComponentProps<typeof ScheduleFilters> &
  Pick<
    ComponentProps<typeof ScheduleFilterPanel>,
    | "instructors"
    | "activityTypes"
    | "isLoadingOptions"
    | "hasOptionsError"
    | "onRetryOptions"
    | "onFavoriteFiltersChange"
  >;

function FilterTestView({
  search,
  onChange,
  instructors,
  activityTypes,
  isLoadingOptions,
  hasOptionsError,
  onRetryOptions,
  onFavoriteFiltersChange,
}: FilterTestViewProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <ScheduleFilterToggle search={search} isOpen={isOpen} onOpenChange={setIsOpen} />
      <ScheduleFilters search={search} onChange={onChange} />
      {isOpen ? (
        <ScheduleFilterPanel
          search={search}
          onChange={onChange}
          instructors={instructors}
          activityTypes={activityTypes}
          isLoadingOptions={isLoadingOptions}
          hasOptionsError={hasOptionsError}
          onRetryOptions={onRetryOptions}
          onFavoriteFiltersChange={onFavoriteFiltersChange}
        />
      ) : null}
    </>
  );
}

describe("ScheduleFilters", () => {
  it("toggles the filter view from a separate, consistently labelled action", () => {
    render(<FilterTestView search={search} onChange={vi.fn()} />);

    const filterButton = screen.getByRole("button", { name: "Open schedule filters" });
    const selectedDay = screen.getByRole("button", { pressed: true });
    expect(filterButton.tabIndex).toBe(0);
    expect(
      filterButton.compareDocumentPosition(selectedDay) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    filterButton.focus();
    fireEvent.keyDown(filterButton, { key: "Enter" });
    fireEvent.keyUp(filterButton, { key: "Enter" });

    expect(document.activeElement).toBe(filterButton);
    expect(filterButton.getAttribute("aria-expanded")).toBe("true");
    expect(filterButton.textContent).toContain("Filters");
    expect(screen.getByRole("region", { name: "Filters" })).toBeTruthy();

    fireEvent.keyDown(filterButton, { key: "Enter" });
    fireEvent.keyUp(filterButton, { key: "Enter" });

    expect(filterButton.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("region", { name: "Filters" })).toBeNull();
  });

  it("shows three weeks of named upcoming days and selects a day directly", () => {
    const onChange = vi.fn();
    render(<FilterTestView search={{ date: today, ...filterSelection }} onChange={onChange} />);

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

  it("shows an out-of-range selected date and includes the year when needed", () => {
    const currentYear = Number(today.slice(0, 4));
    const sameYearDate = today.endsWith("01-01") ? `${currentYear}-12-31` : `${currentYear}-01-01`;
    const otherYearDate = `${currentYear + 2}-01-01`;
    const { container, rerender } = render(
      <FilterTestView search={{ date: sameYearDate, ...filterSelection }} onChange={vi.fn()} />,
    );

    const selectedDate = container.querySelector(`time[datetime="${sameYearDate}"]`);
    expect(selectedDate?.textContent).toBe(
      new Intl.DateTimeFormat("en", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(new Date(`${sameYearDate}T12:00:00Z`)),
    );
    expect(screen.queryByRole("button", { pressed: true })).toBeNull();

    rerender(
      <FilterTestView search={{ date: otherYearDate, ...filterSelection }} onChange={vi.fn()} />,
    );

    expect(container.querySelector(`time[datetime="${otherYearDate}"]`)?.textContent).toBe(
      new Intl.DateTimeFormat("en", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(`${otherYearDate}T12:00:00Z`)),
    );
  });

  it("moves between weeks without changing the filters", () => {
    const onChange = vi.fn();
    render(<FilterTestView search={search} onChange={onChange} />);

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

      return <FilterTestView search={controlledSearch} onChange={setControlledSearch} />;
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

  it("searches instructors and keeps favorite quick picks ordered by name", () => {
    const onChange = vi.fn();
    render(
      <FilterTestView
        search={search}
        onChange={onChange}
        instructors={[
          { id: 20, name: "Aaron Ahl" },
          { id: 21, name: "Anna Andersson" },
          { id: 22, name: "Beatrice Berg" },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open schedule filters" }));
    const instructorSelector = within(screen.getByRole("region", { name: "Instructor" }));
    fireEvent.click(instructorSelector.getByRole("button", { name: "Browse options" }));
    fireEvent.click(
      instructorSelector.getByRole("button", { name: "Add Beatrice Berg to favorites" }),
    );
    fireEvent.click(
      instructorSelector.getByRole("button", { name: "Add Anna Andersson to favorites" }),
    );

    expect(onChange).not.toHaveBeenCalled();
    expect(
      (instructorSelector.getByRole("checkbox", { name: "Beatrice Berg" }) as HTMLInputElement)
        .checked,
    ).toBe(false);

    fireEvent.change(instructorSelector.getByRole("searchbox", { name: "Search instructors" }), {
      target: { value: "beatrice" },
    });

    expect(instructorSelector.getByRole("checkbox", { name: "Beatrice Berg" })).toBeTruthy();
    expect(instructorSelector.queryByRole("checkbox", { name: "Anna Andersson" })).toBeNull();
    expect(window.localStorage.getItem("hb-stunder.schedule-preferences")).toContain("21");
    expect(window.localStorage.getItem("hb-stunder.schedule-preferences")).toContain("22");
  });

  it("moves focus to the next shortcut when a favorite is removed", () => {
    window.localStorage.setItem(
      "hb-stunder.schedule-preferences",
      JSON.stringify({
        version: 1,
        favoriteInstructorIds: [21, 22],
        favoriteActivityTypeIds: [],
      }),
    );
    render(
      <FilterTestView
        search={search}
        onChange={vi.fn()}
        instructors={[
          { id: 21, name: "Anna Andersson" },
          { id: 22, name: "Beatrice Berg" },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open schedule filters" }));
    const instructorSelector = within(screen.getByRole("region", { name: "Instructor" }));
    fireEvent.click(
      instructorSelector.getByRole("button", { name: "Remove Anna Andersson from favorites" }),
    );

    expect(instructorSelector.queryByRole("checkbox", { name: "Anna Andersson" })).toBeNull();
    expect(document.activeElement).toBe(
      instructorSelector.getByRole("button", { name: "Remove Beatrice Berg from favorites" }),
    );

    fireEvent.click(
      instructorSelector.getByRole("button", { name: "Remove Beatrice Berg from favorites" }),
    );
    expect(document.activeElement).toBe(
      instructorSelector.getByRole("button", { name: "Browse options" }),
    );
  });

  it("shows class types for selected business units and fails open for unknown metadata", () => {
    render(
      <FilterTestView
        search={{ ...search, locations: [1], activityTypes: [4] }}
        onChange={vi.fn()}
        activityTypes={[
          { id: 1, name: "Haga class", businessUnitIds: [1] },
          { id: 2, name: "Drottningtorget class", businessUnitIds: [4128] },
          { id: 3, name: "Class with unknown locations" },
          { id: 4, name: "Selected class from another location", businessUnitIds: [4128] },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open schedule filters" }));
    fireEvent.click(
      within(screen.getByRole("region", { name: "Class type" })).getByRole("button", {
        name: "Browse options",
      }),
    );

    expect(screen.getByRole("checkbox", { name: "Haga class" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Class with unknown locations" })).toBeTruthy();
    expect(
      (
        screen.getByRole("checkbox", {
          name: "Selected class from another location",
        }) as HTMLInputElement
      ).checked,
    ).toBe(true);
    expect(screen.queryByRole("checkbox", { name: "Drottningtorget class" })).toBeNull();
  });

  it("reveals alphabetized long lists in bounded chunks and keeps every option searchable", () => {
    const instructors = Array.from({ length: 45 }, (_, index) => ({
      id: index + 1,
      name: `Instructor ${String(index + 1).padStart(3, "0")}`,
    }));
    render(<FilterTestView search={search} onChange={vi.fn()} instructors={instructors} />);

    fireEvent.click(screen.getByRole("button", { name: "Open schedule filters" }));
    const selector = within(screen.getByRole("region", { name: "Instructor" }));

    expect(selector.queryByRole("checkbox")).toBeNull();
    fireEvent.click(selector.getByRole("button", { name: "Browse options" }));
    expect(selector.getAllByRole("checkbox")).toHaveLength(20);
    expect(selector.getByRole("group", { name: "I" })).toBeTruthy();
    expect(selector.queryByRole("checkbox", { name: "Instructor 045" })).toBeNull();

    fireEvent.click(selector.getByRole("button", { name: "Show 20 more" }));
    expect(selector.getAllByRole("checkbox")).toHaveLength(40);
    fireEvent.click(selector.getByRole("button", { name: "Show 5 more" }));
    expect(selector.getAllByRole("checkbox")).toHaveLength(45);

    fireEvent.change(selector.getByRole("searchbox", { name: "Search instructors" }), {
      target: { value: "Instructor 045" },
    });
    expect(selector.getAllByRole("checkbox")).toHaveLength(1);
    expect(selector.getByRole("checkbox", { name: "Instructor 045" })).toBeTruthy();
  });

  it("keeps selected options checked in place without filtering or reordering the list", () => {
    window.localStorage.setItem(
      "hb-stunder.schedule-preferences",
      JSON.stringify({
        version: 1,
        favoriteInstructorIds: [1, 45],
        favoriteActivityTypeIds: [],
      }),
    );
    const instructors = Array.from({ length: 45 }, (_, index) => ({
      id: index + 1,
      name: `Instructor ${String(index + 1).padStart(3, "0")}`,
    }));
    render(
      <FilterTestView
        search={{ ...search, instructors: [45] }}
        onChange={vi.fn()}
        instructors={instructors}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open schedule filters" }));

    expect(screen.getByRole("button", { name: "Remove Instructor 045" })).toBeTruthy();
    const firstFavorite = screen.getByRole("checkbox", { name: "Instructor 001" });
    const selectedFavorite = screen.getByRole("checkbox", { name: "Instructor 045" });
    expect(
      firstFavorite.compareDocumentPosition(selectedFavorite) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect((firstFavorite as HTMLInputElement).checked).toBe(false);
    expect((selectedFavorite as HTMLInputElement).checked).toBe(true);

    fireEvent.change(screen.getByRole("searchbox", { name: "Search instructors" }), {
      target: { value: "Instructor 045" },
    });
    expect(
      (screen.getByRole("checkbox", { name: "Instructor 045" }) as HTMLInputElement).checked,
    ).toBe(true);
  });

  it("removes summary selections and clears every filter without changing the date", () => {
    const onChange = vi.fn();
    const selectedSearch = { ...search, instructors: [21], activityTypes: [201] };
    render(
      <FilterTestView
        search={selectedSearch}
        onChange={onChange}
        instructors={[{ id: 21, name: "Anna Andersson" }]}
        activityTypes={[{ id: 201, name: "Yinyoga" }]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open schedule filters" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove Hagabadet i Haga" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove Anna Andersson" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove Yinyoga" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(onChange).toHaveBeenNthCalledWith(1, {
      ...selectedSearch,
      locations: [1, 4128, 3509],
    });
    expect(onChange).toHaveBeenNthCalledWith(2, { ...selectedSearch, instructors: [] });
    expect(onChange).toHaveBeenNthCalledWith(3, { ...selectedSearch, activityTypes: [] });
    expect(onChange).toHaveBeenNthCalledWith(4, {
      ...selectedSearch,
      locations: [1, 4128, 3509],
      instructors: [],
      activityTypes: [],
    });
  });

  it("announces filter-option failures and retries them", () => {
    const onRetryOptions = vi.fn();
    render(
      <FilterTestView
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
    render(<FilterTestView search={search} onChange={onChange} />);
    const chosenDate = addDays(today, 10);

    fireEvent.change(screen.getByLabelText("Choose date…"), { target: { value: chosenDate } });
    fireEvent.click(screen.getByRole("button", { name: "Open schedule filters" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Hagabadet Drottningtorget" }));
    fireEvent.click(screen.getByRole("button", { name: "Show schedule" }));
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
