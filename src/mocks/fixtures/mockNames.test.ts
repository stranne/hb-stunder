import { describe, expect, it } from "vite-plus/test";
import { stableMockInstructorName } from "./mockNames";

describe("mock instructor names", () => {
  it("generates stable synthetic names from a seed", () => {
    expect(stableMockInstructorName(21)).toBe("Søren Nielsen");
    expect(stableMockInstructorName(21)).toBe(stableMockInstructorName(21));
    expect(stableMockInstructorName(22)).not.toBe(stableMockInstructorName(21));
  });
});
