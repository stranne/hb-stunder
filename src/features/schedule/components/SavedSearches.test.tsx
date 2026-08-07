// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeAll, describe, expect, it } from "vite-plus/test";
import i18n from "../../../i18n";
import type { ScheduleSearch } from "../model/scheduleSearch";
import { SavedSearches } from "./SavedSearches";

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

const initialSearch: ScheduleSearch = {
  date: "2026-08-07",
  locations: [1],
  instructors: [21],
  activityTypes: [743],
};

function Harness() {
  const [search, setSearch] = useState(initialSearch);
  const [activeId, setActiveId] = useState<string>();
  const [isVisible, setIsVisible] = useState(true);
  return (
    <>
      {isVisible ? (
        <SavedSearches
          search={search}
          onChange={setSearch}
          instructors={[
            { id: 21, name: "Anna Andersson" },
            { id: 22, name: "Beatrice Berg" },
          ]}
          activityTypes={[
            { id: 743, name: "Body pump" },
            { id: 744, name: "Yin yoga" },
          ]}
          canValidateReferences
          activeId={activeId}
          onActiveChange={setActiveId}
        />
      ) : null}
      <button type="button" onClick={() => setSearch({ ...search, instructors: [22] })}>
        Refine filters
      </button>
      <button type="button" onClick={() => setIsVisible((visible) => !visible)}>
        Toggle editor
      </button>
    </>
  );
}

function saveSearch(name = "Morning classes") {
  fireEvent.change(screen.getByLabelText("Name this search"), { target: { value: name } });
  fireEvent.click(screen.getByRole("button", { name: "Save current filters" }));
}

describe("SavedSearches", () => {
  it("creates a named search and describes all of its criteria", () => {
    render(<Harness />);
    saveSearch();

    expect(screen.getByText("Morning classes")).toBeTruthy();
    expect(
      screen.getByText(
        "Locations: Hagabadet i Haga · Instructors: Anna Andersson · Class types: Body pump",
      ),
    ).toBeTruthy();
    expect(
      JSON.parse(window.localStorage.getItem("hb-stunder.schedule-preferences") ?? "null"),
    ).toMatchObject({ version: 2, savedSearches: [{ name: "Morning classes" }] });
  });

  it("activates one search without overwriting it when filters change", () => {
    render(<Harness />);
    saveSearch();

    fireEvent.click(screen.getByRole("button", { name: "Use search" }));
    fireEvent.click(screen.getByRole("button", { name: "Toggle editor" }));
    fireEvent.click(screen.getByRole("button", { name: "Toggle editor" }));
    expect(screen.getByText("Active")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Refine filters" }));
    expect(screen.getByText(/Current filters differ/)).toBeTruthy();
    let stored = JSON.parse(
      window.localStorage.getItem("hb-stunder.schedule-preferences") ?? "null",
    );
    expect(stored.savedSearches[0].criteria.instructorIds).toEqual([21]);

    fireEvent.click(screen.getByRole("button", { name: /Update with current filters/ }));
    stored = JSON.parse(window.localStorage.getItem("hb-stunder.schedule-preferences") ?? "null");
    expect(stored.savedSearches[0].criteria.instructorIds).toEqual([22]);
  });

  it("renames, duplicates, and deletes searches", () => {
    render(<Harness />);
    saveSearch();

    fireEvent.click(screen.getByRole("button", { name: "Rename Morning classes" }));
    fireEvent.change(screen.getByLabelText("Rename saved search"), {
      target: { value: "Weekday classes" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save name" }));
    expect(screen.getByText("Weekday classes")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Duplicate Weekday classes" }));
    expect(screen.getByText("Copy of Weekday classes")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Delete Weekday classes" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));
    expect(screen.queryByText("Weekday classes")).toBeNull();
    expect(screen.getByText("Copy of Weekday classes")).toBeTruthy();
  });

  it("rejects duplicate names and can remove unavailable references", () => {
    window.localStorage.setItem(
      "hb-stunder.schedule-preferences",
      JSON.stringify({
        version: 2,
        favoriteInstructorIds: [],
        favoriteActivityTypeIds: [],
        savedSearches: [
          {
            version: 1,
            id: "legacy-options",
            name: "Legacy options",
            criteria: { businessUnitIds: [999], instructorIds: [888], activityTypeIds: [777] },
          },
        ],
      }),
    );
    render(<Harness />);

    saveSearch("legacy options");
    expect(screen.getByText("Saved-search names must be unique.")).toBeTruthy();

    const card = screen.getByText("Legacy options").closest("li");
    expect(card).not.toBeNull();
    expect(within(card!).getByText(/3 unavailable options/i)).toBeTruthy();
    fireEvent.click(within(card!).getByRole("button", { name: "Remove unavailable options" }));
    expect(within(card!).getByText("All classes")).toBeTruthy();
  });
});
