// @vitest-environment jsdom

import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import type { ScheduleSearch } from "../features/schedule/model/scheduleSearch";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(() => Promise.resolve()),
  renderedSearch: undefined as ScheduleSearch | undefined,
  onSearchChange: undefined as ((search: ScheduleSearch) => void) | undefined,
  onSelectedActivityChange: undefined as
    | ((activity: number | undefined, replace?: boolean) => void)
    | undefined,
  routeSearch: {
    date: "2026-07-29",
    locations: [1, 4128, 3509],
    instructors: [],
    activityTypes: [],
  } as ScheduleSearch,
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mocks.navigate,
  useSearch: () => mocks.routeSearch,
}));

vi.mock("../features/auth/sessionContext", () => ({
  useSession: () => ({ customer: undefined }),
}));

vi.mock("../features/schedule/components/SchedulePage", () => ({
  SchedulePage: ({
    search,
    onSearchChange,
    onSelectedActivityChange,
  }: {
    search: ScheduleSearch;
    onSearchChange: (search: ScheduleSearch) => void;
    onSelectedActivityChange: (activity: number | undefined, replace?: boolean) => void;
  }) => {
    mocks.renderedSearch = search;
    mocks.onSearchChange = onSearchChange;
    mocks.onSelectedActivityChange = onSelectedActivityChange;
    return null;
  },
}));

import { ScheduleRoute } from "./ScheduleRoute";

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
  mocks.navigate.mockClear();
  mocks.renderedSearch = undefined;
  mocks.onSearchChange = undefined;
  mocks.onSelectedActivityChange = undefined;
  mocks.routeSearch = {
    date: "2026-07-29",
    locations: [1, 4128, 3509],
    instructors: [],
    activityTypes: [],
  };
});

afterEach(cleanup);

describe("ScheduleRoute", () => {
  it("restores the last-used filters when the URL has no explicit filter selection", async () => {
    window.localStorage.setItem(
      "hb-stunder.schedule-preferences",
      JSON.stringify({
        version: 1,
        lastUsed: { locations: [4128], instructors: [21], activityTypes: [201] },
        favoriteInstructorIds: [],
        favoriteActivityTypeIds: [],
      }),
    );

    render(<ScheduleRoute />);

    expect(mocks.renderedSearch).toEqual({
      date: "2026-07-29",
      locations: [4128],
      instructors: [21],
      activityTypes: [201],
    });
    await waitFor(() =>
      expect(mocks.navigate).toHaveBeenCalledWith({
        search: mocks.renderedSearch,
        replace: true,
      }),
    );
  });

  it("keeps explicit URL filters instead of replacing them with stored preferences", () => {
    window.history.replaceState(null, "", "/?locations=1");
    window.localStorage.setItem(
      "hb-stunder.schedule-preferences",
      JSON.stringify({
        version: 1,
        lastUsed: { locations: [4128], instructors: [21], activityTypes: [201] },
        favoriteInstructorIds: [],
        favoriteActivityTypeIds: [],
      }),
    );
    mocks.routeSearch = { ...mocks.routeSearch, locations: [1] };

    render(<ScheduleRoute />);

    expect(mocks.renderedSearch).toEqual(mocks.routeSearch);
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("replaces history entries for immediate schedule refinements", () => {
    render(<ScheduleRoute />);

    mocks.onSearchChange?.({ ...mocks.routeSearch, instructors: [21] });
    expect(mocks.navigate).toHaveBeenLastCalledWith({
      search: { ...mocks.routeSearch, instructors: [21], activity: undefined },
      replace: true,
    });
  });

  it("pushes opened class details and replaces them when closed", () => {
    render(<ScheduleRoute />);

    mocks.onSelectedActivityChange?.(123);
    expect(mocks.navigate).toHaveBeenLastCalledWith({
      search: { ...mocks.routeSearch, activity: 123 },
      replace: false,
    });

    mocks.onSelectedActivityChange?.(undefined, true);
    expect(mocks.navigate).toHaveBeenLastCalledWith({
      search: { ...mocks.routeSearch, activity: undefined },
      replace: true,
    });
  });

  it("renders the view and selections restored by browser Back or Forward", () => {
    window.history.replaceState(null, "", "/?locations=1");
    const view = render(<ScheduleRoute />);

    mocks.routeSearch = {
      ...mocks.routeSearch,
      date: "2026-07-30",
      locations: [3509],
      instructors: [21],
      view: "filters",
    };
    view.rerender(<ScheduleRoute />);

    expect(mocks.renderedSearch).toEqual(mocks.routeSearch);
  });
});
