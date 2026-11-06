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

  it("keeps the open filter sheet and the favorites choice in the URL", () => {
    const location = router.buildLocation({
      to: "/",
      search: { ...defaultSearch, filters: true, favorites: true },
    });
    const search = new URLSearchParams(location.searchStr);

    expect(search.get("filters")).toBe("true");
    expect(search.get("favorites")).toBe("true");
    expect(search.has("view")).toBe(false);
  });

  it("does not serialize a closed filter sheet or favorites that are off", () => {
    const location = router.buildLocation({
      to: "/",
      search: { ...defaultSearch, filters: false, favorites: false },
    });

    expect(location.searchStr).toBe("?date=2026-08-05");
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
