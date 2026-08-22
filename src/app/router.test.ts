import { createMemoryHistory } from "@tanstack/react-router";
import { beforeAll, describe, expect, it } from "vite-plus/test";
import { router } from "./router";

const defaultSearch = {
  date: "2026-08-05",
  locations: [1, 3509, 4128],
  instructors: [],
  activityTypes: [],
  view: "classes" as const,
};

describe("schedule route search", () => {
  beforeAll(async () => {
    router.update({ history: createMemoryHistory({ initialEntries: ["/"] }) });
    await router.load();
  });

  it("does not serialize default filters as explicit URL filters", () => {
    const location = router.buildLocation({ to: "/", search: defaultSearch });

    expect(location.searchStr).toBe("?date=2026-08-05");
  });

  it("keeps the filter page in the view query parameter", () => {
    const location = router.buildLocation({
      to: "/",
      search: { ...defaultSearch, view: "filters" },
    });

    expect(new URLSearchParams(location.searchStr).get("view")).toBe("filters");
    expect(new URLSearchParams(location.searchStr).has("filters")).toBe(false);
  });

  it("keeps an actual filter selection in the URL", () => {
    const location = router.buildLocation({
      to: "/",
      search: { ...defaultSearch, locations: [4128] },
    });

    expect(new URLSearchParams(location.searchStr).get("locations")).toBe("[4128]");
  });

  it("keeps a selected class in a shareable view URL", () => {
    const location = router.buildLocation({
      to: "/",
      search: { ...defaultSearch, locations: [1], view: "rooms", activity: 123 },
    });
    const search = new URLSearchParams(location.searchStr);

    expect(search.get("activity")).toBe("123");
    expect(search.get("view")).toBe("rooms");
    expect(search.get("locations")).toBe("[1]");
  });
});
