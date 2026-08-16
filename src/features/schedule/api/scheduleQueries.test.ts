import { describe, expect, it } from "vite-plus/test";
import { groupActivityQueryOptions, scheduleKeys, scheduleQueryOptions } from "./scheduleQueries";

const filters = { businessUnit: 1, date: "2026-07-28" };

describe("schedule queries", () => {
  it("uses hierarchical keys containing the filters", () => {
    expect(scheduleKeys.list(filters)).toEqual(["classes", "list", filters]);
    expect(scheduleQueryOptions(filters).queryKey).toEqual(["classes", "list", filters]);
  });

  it("creates detail queries that are enabled only with both identifiers", () => {
    expect(groupActivityQueryOptions(1, 42).queryKey).toEqual(["classes", "detail", 1, 42]);
    expect(groupActivityQueryOptions(1, 42).enabled).toBe(true);
    expect(groupActivityQueryOptions(undefined, 42).enabled).toBe(false);
  });

  it("configures the initial refresh policy and preserves visible results", () => {
    const options = scheduleQueryOptions(filters);
    const previousData = [{ id: 42 }];

    expect(options.placeholderData).toBeTypeOf("function");
    if (typeof options.placeholderData === "function") {
      expect(options.placeholderData(previousData, undefined as never)).toBe(previousData);
    }
    expect(options.staleTime).toBe(20_000);
    expect(options.refetchInterval).toBe(60_000);
  });
});
