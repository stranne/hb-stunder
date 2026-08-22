// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import i18n from "../../../i18n";
import { scheduleFixtures } from "../../../mocks/fixtures/schedule";
import { ClassUtilityActions } from "./ClassUtilityActions";

beforeAll(async () => i18n.changeLanguage("en"));
afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
});

describe("ClassUtilityActions", () => {
  it("renders nothing when both utilities are unavailable", () => {
    const { container } = render(
      <ClassUtilityActions activity={scheduleFixtures.available} view="classes" canShare={false} />,
    );

    expect(container.childElementCount).toBe(0);
  });

  it("copies a canonical class link when native sharing is unavailable", async () => {
    const writeText = vi.fn<(value: string) => Promise<void>>(() => Promise.resolve());
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    window.history.replaceState(null, "", "/?locations=%5B4128%5D&instructors=%5B21%5D");

    render(<ClassUtilityActions activity={scheduleFixtures.available} view="classes" />);
    fireEvent.click(screen.getByRole("button", { name: "Share class" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const sharedUrl = new URL(writeText.mock.calls[0]![0]);
    expect(sharedUrl.searchParams.get("activity")).toBe(String(scheduleFixtures.available.id));
    expect(sharedUrl.searchParams.get("locations")).toBe(
      JSON.stringify([scheduleFixtures.available.businessUnit?.id]),
    );
    expect(sharedUrl.searchParams.has("instructors")).toBe(false);
    expect(screen.getByRole("status").textContent).toBe("Class link copied");
  });
});
