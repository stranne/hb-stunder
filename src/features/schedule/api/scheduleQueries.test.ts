import { describe, expect, it } from "vite-plus/test";
import { scheduleKeys, scheduleQueryOptions } from "./scheduleQueries";

const filters = { businessUnit: 1, date: "2026-07-28" };

describe("schedule queries", () => {
  it("uses hierarchical keys containing the filters", () => {
    expect(scheduleKeys.list(filters)).toEqual(["classes", "list", filters]);
    expect(scheduleQueryOptions(filters).queryKey).toEqual(["classes", "list", filters]);
  });

  it("configures the initial refresh policy", () => {
    const options = scheduleQueryOptions(filters);
    expect(options.staleTime).toBe(20_000);
    expect(options.refetchInterval).toBe(60_000);
  });
});
