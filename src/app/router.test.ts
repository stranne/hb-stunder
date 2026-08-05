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

  it("keeps an actual filter selection in the URL", () => {
    const location = router.buildLocation({
      to: "/",
      search: { ...defaultSearch, locations: [4128] },
    });

    expect(new URLSearchParams(location.searchStr).get("locations")).toBe("[4128]");
  });
});
