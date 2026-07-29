// @vitest-environment jsdom

import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import type { ScheduleSearch } from "../features/schedule/model/scheduleSearch";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(() => Promise.resolve()),
  renderedSearch: undefined as ScheduleSearch | undefined,
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

vi.mock("../features/schedule/components/SchedulePage", () => ({
  SchedulePage: ({ search }: { search: ScheduleSearch }) => {
    mocks.renderedSearch = search;
    return null;
  },
}));

import { ScheduleRoute } from "./ScheduleRoute";

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
  mocks.navigate.mockClear();
  mocks.renderedSearch = undefined;
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

  it("renders changed router search after browser navigation", () => {
    window.history.replaceState(null, "", "/?locations=1");
    const view = render(<ScheduleRoute />);

    mocks.routeSearch = {
      ...mocks.routeSearch,
      date: "2026-07-30",
      locations: [3509],
    };
    view.rerender(<ScheduleRoute />);

    expect(mocks.renderedSearch).toEqual(mocks.routeSearch);
  });
});
