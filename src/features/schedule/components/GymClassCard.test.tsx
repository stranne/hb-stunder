// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vite-plus/test";
import i18n from "../../../i18n";
import { scheduleFixtures } from "../../../mocks/fixtures/schedule";
import { GymClassCard } from "./GymClassCard";

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

afterEach(cleanup);

describe("GymClassCard", () => {
  it("shows the room name rather than the business unit name", () => {
    render(<GymClassCard activity={scheduleFixtures.available} />);

    expect(screen.getByText(/Yogastudio/)).toBeTruthy();
    expect(screen.queryByText(/Hagabadet i Haga/)).toBeNull();
  });

  it("shows an existing customer booking instead of schedule availability", () => {
    const { container } = render(
      <GymClassCard
        activity={scheduleFixtures.available}
        booking={{ groupActivity: { id: scheduleFixtures.available.id } }}
      />,
    );

    expect(screen.getByText("Already booked")).toBeTruthy();
    expect(container.querySelector("[data-availability='booked']")).toBeTruthy();
    expect(screen.queryByText("8 spots")).toBeNull();
  });

  it("animates only the number in the direction of the availability change", () => {
    const { container, rerender } = render(<GymClassCard activity={scheduleFixtures.available} />);
    const availabilityNumber = () => container.querySelector("[data-availability-value]");

    expect(availabilityNumber()?.hasAttribute("data-updated")).toBe(false);
    expect(container.querySelector("[data-availability-text]")?.hasAttribute("data-updated")).toBe(
      false,
    );

    rerender(
      <GymClassCard
        activity={{
          ...scheduleFixtures.available,
          slots: { ...scheduleFixtures.available.slots, leftToBook: 7 },
        }}
      />,
    );

    expect(availabilityNumber()?.getAttribute("data-updated")).toBe("true");
    expect(availabilityNumber()?.getAttribute("data-direction")).toBe("decrease");
    expect(container.querySelector("[data-current-value]")?.textContent).toBe("7");
    expect(container.querySelector("[data-previous-value]")?.textContent).toBe("8");

    rerender(
      <GymClassCard
        activity={{
          ...scheduleFixtures.available,
          slots: { ...scheduleFixtures.available.slots, leftToBook: 9 },
        }}
      />,
    );

    expect(availabilityNumber()?.getAttribute("data-direction")).toBe("increase");
    expect(container.querySelector("[data-current-value]")?.textContent).toBe("9");
    expect(container.querySelector("[data-previous-value]")?.textContent).toBe("7");
  });
});
