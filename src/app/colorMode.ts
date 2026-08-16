export const COLOR_MODE_STORAGE_KEY = "hb-stunder-color-mode";

export type ColorModePreference = "system" | "light" | "dark";
export type ResolvedColorMode = Exclude<ColorModePreference, "system">;

function isColorModePreference(value: unknown): value is ColorModePreference {
  return value === "system" || value === "light" || value === "dark";
}

export function readColorModePreference(): ColorModePreference {
  if (typeof window === "undefined") return "system";

  try {
    const stored = window.localStorage.getItem(COLOR_MODE_STORAGE_KEY);
    return isColorModePreference(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

export function resolveColorMode(preference: ColorModePreference): ResolvedColorMode {
  if (preference !== "system") return preference;
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyColorMode(preference: ColorModePreference): ResolvedColorMode {
  const colorMode = resolveColorMode(preference);
  document.documentElement.dataset.colorMode = colorMode;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", colorMode === "dark" ? "#111110" : "#e8e1d5");
  return colorMode;
}

export function writeColorModePreference(preference: ColorModePreference): boolean {
  try {
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, preference);
    return true;
  } catch {
    return false;
  }
}
