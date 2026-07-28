import { describe, expect, it } from "vite-plus/test";
import { supportedLanguages } from ".";

describe("localization foundation", () => {
  it("supports Swedish and English", () => {
    expect(supportedLanguages).toEqual(["sv", "en"]);
  });
});
