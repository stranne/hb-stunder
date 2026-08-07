// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import i18n from "../../../i18n";
import type { ScheduleSearch } from "../model/scheduleSearch";
import { SavedSearches } from "./SavedSearches";
import { ScheduleFilterPanel } from "./ScheduleFilterPanel";

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

function Harness({ initial = initialSearch }: { initial?: ScheduleSearch }) {
  const [search, setSearch] = useState(initial);
  return (
    <>
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
      />
      <output aria-label="Current instructors">{search.instructors.join(",")}</output>
      <button type="button" onClick={() => setSearch({ ...search, instructors: [22] })}>
        Refine filters
      </button>
    </>
  );
}

function PanelHarness() {
  const [search, setSearch] = useState(initialSearch);
  return (
    <ScheduleFilterPanel
      search={search}
      onChange={setSearch}
      instructors={[
        { id: 21, name: "Anna Andersson" },
        { id: 22, name: "Beatrice Berg" },
      ]}
      activityTypes={[{ id: 743, name: "Body pump" }]}
    />
  );
}

function openSaveDialog() {
  fireEvent.click(screen.getByRole("button", { name: "Save current selection" }));
  expect(screen.getByRole("dialog")).toBeTruthy();
}

function saveSearch(name = "Morning classes") {
  openSaveDialog();
  fireEvent.change(screen.getByLabelText("Name this search"), { target: { value: name } });
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Save" }));
}

function selectSavedSearch(name: string) {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${name}`) }));
}

function editSavedSearch(name: string) {
  fireEvent.click(screen.getByRole("button", { name: `Edit ${name}` }));
}

describe("SavedSearches", () => {
  it("only offers saving for meaningful restrictions and validates a focused save dialog", () => {
    render(
      <Harness
        initial={{
          ...initialSearch,
          locations: [1, 4128, 3509],
          instructors: [],
          activityTypes: [],
        }}
      />,
    );
    expect(screen.queryByRole("button", { name: "Save current selection" })).toBeNull();
    cleanup();

    render(<Harness />);
    openSaveDialog();
    expect(document.activeElement).toBe(screen.getByLabelText("Name this search"));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Save" }));
    expect(screen.getByText("Enter a name for the saved search.")).toBeTruthy();
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("saves without adding saved-search provenance to the current selection", () => {
    render(<Harness />);
    saveSearch();

    expect(screen.getByRole("heading", { name: "Saved searches" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Morning classes/ })).toBeTruthy();
    expect(screen.getByText("Morning classes saved.")).toBeTruthy();
    expect(document.querySelector("details")).toBeNull();
    expect(
      JSON.parse(window.localStorage.getItem("hb-stunder.schedule-preferences") ?? "null"),
    ).toMatchObject({ version: 2, savedSearches: [{ name: "Morning classes" }] });
  });

  it("does not render an empty library and applies a saved search as ordinary filters", () => {
    render(<Harness />);
    expect(screen.queryByRole("heading", { name: "Saved searches" })).toBeNull();
    saveSearch();
    fireEvent.click(screen.getByRole("button", { name: "Refine filters" }));
    expect(screen.getByLabelText("Current instructors").textContent).toBe("22");
    selectSavedSearch("Morning classes");
    expect(screen.getByLabelText("Current instructors").textContent).toBe("21");
    expect(document.querySelector("details")).toBeNull();
  });

  it("keeps only save and clear actions in the selected-filter summary", () => {
    render(<PanelHarness />);
    const summary = screen.getByRole("heading", { name: "Selected filters" }).closest("section");
    expect(summary).not.toBeNull();
    expect(within(summary!).getByRole("button", { name: "Save current selection" })).toBeTruthy();
    expect(within(summary!).getByRole("button", { name: "Clear filters" })).toBeTruthy();

    saveSearch();
    expect(within(summary!).queryByText("Morning classes")).toBeNull();
    expect(within(summary!).queryByRole("heading", { name: "Saved searches" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Saved searches" })).toBeTruthy();

    editSavedSearch("Morning classes");
    fireEvent.click(
      screen.getByRole("button", { name: "Edit locations, instructors, and class types" }),
    );
    const criteriaHeading = screen.getByRole("heading", {
      name: "Filter criteria for Morning classes",
    });
    const finishHeading = screen.getByRole("heading", {
      name: "Save changes to Morning classes",
    });
    expect(document.activeElement).toBe(criteriaHeading.closest("#saved-search-criteria"));
    expect(criteriaHeading.compareDocumentPosition(finishHeading)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(within(summary!).queryByText("Morning classes")).toBeNull();
  });

  it("edits the name and criteria together, then duplicates the definition", () => {
    render(<Harness />);
    saveSearch();
    editSavedSearch("Morning classes");
    expect(screen.getByRole("heading", { name: "Edit saved search" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Edit locations, instructors, and class types" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Save changes to Morning classes" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Search name"), {
      target: { value: "Weekday classes" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Refine filters" }));
    fireEvent.click(screen.getByRole("button", { name: "Update" }));

    const stored = JSON.parse(
      window.localStorage.getItem("hb-stunder.schedule-preferences") ?? "null",
    );
    expect(stored.savedSearches[0]).toMatchObject({
      name: "Weekday classes",
      criteria: { instructorIds: [22] },
    });

    editSavedSearch("Weekday classes");
    fireEvent.click(screen.getByRole("button", { name: "Duplicate" }));
    expect(screen.getByRole("button", { name: /^Copy of Weekday classes/ })).toBeTruthy();
  });

  it("keeps edits as a draft and cancel restores the stored criteria", () => {
    render(<Harness />);
    saveSearch();
    editSavedSearch("Morning classes");
    fireEvent.click(screen.getByRole("button", { name: "Refine filters" }));
    expect(screen.getByLabelText("Current instructors").textContent).toBe("22");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByLabelText("Current instructors").textContent).toBe("21");
    expect(screen.queryByRole("heading", { name: "Edit saved search" })).toBeNull();
  });

  it("offers save as new and confirms deletion without clearing current filters", () => {
    render(<Harness />);
    saveSearch();
    editSavedSearch("Morning classes");
    fireEvent.click(screen.getByRole("button", { name: "Refine filters" }));
    fireEvent.click(screen.getByRole("button", { name: "Save as new" }));
    fireEvent.change(screen.getByLabelText("Name this search"), {
      target: { value: "Evening classes" },
    });
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Save" }));
    expect(screen.getByRole("button", { name: /^Evening classes/ })).toBeTruthy();

    editSavedSearch("Evening classes");
    fireEvent.click(screen.getByRole("button", { name: "Remove saved search" }));
    expect(screen.getByText(/Current filters will stay selected/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));
    expect(screen.queryByText("Evening classes")).toBeNull();
    expect(screen.getByLabelText("Current instructors").textContent).toBe("22");
  });

  it("reports a browser storage failure without pretending a search was saved", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });
    render(<Harness />);
    saveSearch();
    expect(screen.getByText(/could not be read or stored in this browser/)).toBeTruthy();
    expect(screen.queryByText("Morning classes saved.")).toBeNull();
    setItem.mockRestore();
  });

  it("keeps unavailable-reference cleanup in the editor", () => {
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
    editSavedSearch("Legacy options");
    expect(screen.getByText(/3 unavailable options/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Remove unavailable options" }));
    expect(screen.getAllByText("All classes").length).toBeGreaterThan(0);
  });
});
