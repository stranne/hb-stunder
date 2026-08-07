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
  const [activeId, setActiveId] = useState<string>();
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
        activeId={activeId}
        onActiveChange={setActiveId}
      />
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

function manageSavedSearch(name: string) {
  fireEvent.click(screen.getByRole("button", { name: `Manage ${name}` }));
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

  it("saves and immediately shows an expanded named applied group", () => {
    render(<Harness />);
    saveSearch();

    expect(screen.getByRole("heading", { name: "Saved searches" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Morning classes/ })).toBeTruthy();
    expect(
      screen.getAllByText(
        "Locations: Hagabadet i Haga · Instructors: Anna Andersson · Class types: Body pump",
      ).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("Morning classes saved and applied.")).toBeTruthy();
    expect(
      JSON.parse(window.localStorage.getItem("hb-stunder.schedule-preferences") ?? "null"),
    ).toMatchObject({ version: 2, savedSearches: [{ name: "Morning classes" }] });
  });

  it("does not render a library when there are no definitions, then applies one from its picker", () => {
    render(<Harness />);
    expect(screen.queryByRole("heading", { name: "Saved searches" })).toBeNull();
    saveSearch();
    expect(screen.getByRole("heading", { name: "Saved searches" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Remove applied search" }));
    selectSavedSearch("Morning classes");
    expect(document.querySelector("details")).not.toBeNull();
  });

  it("keeps compact selection actions in the summary and the saved-search library outside it", () => {
    render(<PanelHarness />);
    const summary = screen.getByRole("heading", { name: "Selected filters" }).closest("section");
    expect(summary).not.toBeNull();
    expect(within(summary!).getByRole("button", { name: "Save current selection" })).toBeTruthy();
    expect(within(summary!).getByRole("button", { name: "Clear filters" })).toBeTruthy();

    saveSearch();

    expect(within(summary!).queryByRole("heading", { name: "Saved searches" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Saved searches" })).toBeTruthy();

    manageSavedSearch("Morning classes");
    expect(within(summary!).queryByRole("button", { name: "Edit filters" })).toBeNull();
    expect(screen.getByRole("button", { name: "Edit filters" })).toBeTruthy();
  });

  it("renames and duplicates the applied definition", () => {
    render(<Harness />);
    saveSearch();
    manageSavedSearch("Morning classes");
    fireEvent.change(screen.getByLabelText("Rename saved search"), {
      target: { value: "Weekday classes" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save name" }));
    expect(screen.getByRole("button", { name: /^Weekday classes/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Duplicate" }));
    expect(screen.getByRole("button", { name: /^Copy of Weekday classes/ })).toBeTruthy();
  });

  it("detaches an applied group when ordinary or external filters change", () => {
    const view = render(<PanelHarness />);
    saveSearch();
    expect(document.querySelector("details")).not.toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: "Hagabadet Drottningtorget" }));
    expect(document.querySelector("details")).toBeNull();
    let stored = JSON.parse(
      window.localStorage.getItem("hb-stunder.schedule-preferences") ?? "null",
    );
    expect(stored.savedSearches[0].criteria.businessUnitIds).toEqual([1]);

    view.unmount();
    render(<Harness />);
    selectSavedSearch("Morning classes");
    fireEvent.click(screen.getByRole("button", { name: "Refine filters" }));
    expect(document.querySelector("details")).toBeNull();
    stored = JSON.parse(window.localStorage.getItem("hb-stunder.schedule-preferences") ?? "null");
    expect(stored.savedSearches[0].criteria.instructorIds).toEqual([21]);
  });

  it("keeps ordinary controls attached while explicitly editing a saved-search draft", () => {
    render(<PanelHarness />);
    saveSearch();
    manageSavedSearch("Morning classes");
    fireEvent.click(screen.getByRole("button", { name: "Edit filters" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Hagabadet Drottningtorget" }));
    expect(document.querySelector("details")).not.toBeNull();
    expect(screen.getByText("Editing filters — changes are not saved yet.")).toBeTruthy();
  });

  it("keeps edits as a draft until update and cancel restores the stored definition", () => {
    render(<Harness />);
    saveSearch();
    manageSavedSearch("Morning classes");
    fireEvent.click(screen.getByRole("button", { name: "Edit filters" }));
    fireEvent.click(screen.getByRole("button", { name: "Refine filters" }));
    expect(screen.getByText("Editing filters — changes are not saved yet.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getAllByText(/Instructors: Anna Andersson/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Edit filters" }));
    fireEvent.click(screen.getByRole("button", { name: "Refine filters" }));
    fireEvent.click(screen.getByRole("button", { name: "Update" }));
    const stored = JSON.parse(
      window.localStorage.getItem("hb-stunder.schedule-preferences") ?? "null",
    );
    expect(stored.savedSearches[0].criteria.instructorIds).toEqual([22]);
  });

  it("offers save as new and confirms deletion without clearing current filters", () => {
    render(<Harness />);
    saveSearch();
    manageSavedSearch("Morning classes");
    fireEvent.click(screen.getByRole("button", { name: "Edit filters" }));
    fireEvent.click(screen.getByRole("button", { name: "Refine filters" }));
    fireEvent.click(screen.getByRole("button", { name: "Save as new" }));
    fireEvent.change(screen.getByLabelText("Name this search"), {
      target: { value: "Evening classes" },
    });
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Save" }));
    expect(screen.getByRole("button", { name: /^Evening classes/ })).toBeTruthy();

    manageSavedSearch("Evening classes");
    fireEvent.click(screen.getByRole("button", { name: "Remove saved search" }));
    expect(screen.getByText(/Current filters will stay selected/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));
    expect(screen.queryByText("Evening classes")).toBeNull();
  });

  it("reports a browser storage failure without pretending a search was saved", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });
    render(<Harness />);
    saveSearch();
    expect(screen.getByText(/could not be read or stored in this browser/)).toBeTruthy();
    expect(screen.queryByText("Morning classes saved and applied.")).toBeNull();
    setItem.mockRestore();
  });

  it("keeps unavailable-reference cleanup visible", () => {
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
    selectSavedSearch("Legacy options");
    manageSavedSearch("Legacy options");
    expect(screen.getByText(/3 unavailable options/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Remove unavailable options" }));
    expect(screen.getAllByText("All classes").length).toBeGreaterThan(0);
  });
});
