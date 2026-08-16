// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import {
  applyColorMode,
  COLOR_MODE_STORAGE_KEY,
  readColorModePreference,
  resolveColorMode,
  writeColorModePreference,
} from "./colorMode";

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-color-mode");
  document.head.innerHTML = '<meta name="theme-color" content="#e8e1d5">';
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("color mode", () => {
  it("uses the system preference when no explicit preference is stored", () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true }));

    expect(readColorModePreference()).toBe("system");
    expect(resolveColorMode("system")).toBe("dark");
  });

  it("persists an explicit preference", () => {
    expect(writeColorModePreference("dark")).toBe(true);
    expect(window.localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBe("dark");
    expect(readColorModePreference()).toBe("dark");
  });

  it("applies the resolved mode and browser theme color", () => {
    applyColorMode("dark");

    expect(document.documentElement.dataset.colorMode).toBe("dark");
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute("content")).toBe(
      "#111110",
    );
  });
});
