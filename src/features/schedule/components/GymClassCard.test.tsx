// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import i18n from "../../../i18n";
import { scheduleFixtures } from "../../../mocks/fixtures/schedule";
import { GymClassCard } from "./GymClassCard";

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

beforeEach(() => {
  vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-07-28T05:00:00.000Z"));
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

describe("GymClassCard", () => {
  it("shows the room name rather than the business unit name", () => {
    render(<GymClassCard activity={scheduleFixtures.available} />);

    expect(screen.getByText(/Yogastudio/)).toBeTruthy();
    expect(screen.queryByText(/Hagabadet i Haga/)).toBeNull();
  });

  it("includes the business unit in the location when requested", () => {
    render(<GymClassCard activity={scheduleFixtures.available} includeBusinessUnitName />);

    expect(screen.getByText("Yogastudio, Hagabadet i Haga")).toBeTruthy();
  });

  it("shows every instructor assigned to an activity", () => {
    render(
      <GymClassCard
        activity={{
          ...scheduleFixtures.available,
          instructors: [
            { id: 201, name: "Alex Example" },
            { id: 202, name: "Sam Example" },
          ],
        }}
      />,
    );

    expect(screen.getByText("Alex Example")).toBeTruthy();
    expect(screen.getByText("Sam Example")).toBeTruthy();
    expect(screen.getByText(/Yogastudio/)).toBeTruthy();
  });

  it("marks favorite class types and individual instructors", () => {
    render(
      <GymClassCard
        activity={{
          ...scheduleFixtures.available,
          instructors: [
            { id: 201, name: "Alex Example" },
            { id: 202, name: "Sam Example" },
          ],
        }}
        favoriteActivityTypeIds={[3392]}
        favoriteInstructorIds={[202]}
      />,
    );

    expect(screen.getAllByRole("img", { name: "Favorite" })).toHaveLength(2);
    expect(screen.getByText("Alex Example").querySelector("svg")).toBeNull();
    expect(screen.getByText("Sam Example").querySelector("svg")).toBeTruthy();
  });

  it("shows every location assigned to an activity", () => {
    render(
      <GymClassCard
        activity={{
          ...scheduleFixtures.available,
          locations: [
            { id: 18, name: "Yogastudio" },
            { id: 10, name: "Hotyogastudio" },
          ],
        }}
      />,
    );

    expect(screen.getByText(/Yogastudio, Hotyogastudio/)).toBeTruthy();
  });

  it("discloses activity-specific information and the class description", () => {
    const { container } = render(<GymClassCard activity={scheduleFixtures.withMessages} />);

    const disclosure = screen.getByRole("button", { name: "Show details" });
    expect(disclosure.getAttribute("aria-expanded")).toBe("false");
    expect(screen.getByRole("heading", { name: "For this class" })).toBeTruthy();
    expect(screen.getByText("Klassen hålls på lättförståelig engelska.")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "About the class" })).toBeNull();

    fireEvent.click(disclosure);
    expect(disclosure.getAttribute("aria-expanded")).toBe("true");

    fireEvent.click(screen.getByRole("heading", { name: /Hathayoga/ }));
    expect(disclosure.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(disclosure);

    expect(screen.getByRole("heading", { name: "About the class" })).toBeTruthy();
    expect(screen.getByText(/Hathayoga fokuserar på att skapa balans/)).toBeTruthy();
    expect(container.querySelector("[data-message-type='external']")).toBeTruthy();
    expect(container.querySelector("[data-message-type='internal']")).toBeTruthy();
  });

  it("does not show class information for blank messages", () => {
    render(
      <GymClassCard
        activity={{ ...scheduleFixtures.available, externalMessage: "  ", internalMessage: null }}
      />,
    );

    expect(screen.getByRole("button", { name: "Show details" })).toBeTruthy();
    expect(screen.queryByText("For this class")).toBeNull();
  });

  it.each([
    ["Yinyoga, 55 min", "Yinyoga", "55 min"],
    ["Yinyoga 55 min", "Yinyoga", "55 min"],
    ["Lång workshop, 2,5 timmar", "Lång workshop", "2,5 timmar"],
    ["Lång workshop 2,5 timmar", "Lång workshop", "2,5 timmar"],
  ])("uses the title duration for %s", (name, title, expectedDuration) => {
    render(
      <GymClassCard
        activity={{
          ...scheduleFixtures.available,
          name,
          duration: {
            start: "2026-07-28T06:00:00.000Z",
            end: "2026-07-28T07:30:00.000Z",
          },
        }}
        showTime={false}
      />,
    );

    expect(screen.getByRole("heading", { name: title })).toBeTruthy();
    expect(screen.getByText(expectedDuration)).toBeTruthy();
    expect(screen.queryByText("90 min")).toBeNull();
  });

  it.each([
    [90, "90 min"],
    [150, "2.5 hours"],
  ])("falls back to the start/end range for a %i-minute class", (minutes, expectedDuration) => {
    const start = new Date("2026-07-28T06:00:00.000Z");
    const end = new Date(start.getTime() + minutes * 60_000);

    render(
      <GymClassCard
        activity={{
          ...scheduleFixtures.available,
          name: "Workshop",
          duration: { start: start.toISOString(), end: end.toISOString() },
        }}
        showTime={false}
      />,
    );

    expect(screen.getByRole("heading", { name: "Workshop" })).toBeTruthy();
    expect(screen.getByText(expectedDuration)).toBeTruthy();
  });

  it("shows total availability in details and a simple waiting-list count", () => {
    const { container } = render(
      <GymClassCard
        activity={{
          ...scheduleFixtures.waitingList,
          slots: { ...scheduleFixtures.waitingList.slots, inWaitingList: 0 },
        }}
        showTime={false}
      />,
    );

    expect(screen.getByText("0 in queue")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Show details" }));
    expect(screen.getByText("0 of 20 spots available")).toBeTruthy();
    expect(container.querySelector("[data-spot-availability]")).toBeTruthy();
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

  it("does not offer booking actions and shows participants while an activity is ongoing", () => {
    const onBook = vi.fn(async () => undefined);
    vi.mocked(Date.now).mockReturnValue(Date.parse("2026-07-28T17:00:00.000Z"));

    render(<GymClassCard activity={scheduleFixtures.waitingList} onBook={onBook} />);

    expect(screen.queryByRole("button", { name: "Book" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Join waiting list" })).toBeNull();
    expect(screen.getByText("20 participating")).toBeTruthy();
    expect(screen.queryByText("20 participated")).toBeNull();
    expect(screen.queryByText("Started")).toBeNull();
    expect(screen.getByRole("article").getAttribute("data-started")).toBe("true");
  });

  it("shows participants in the past tense after an activity ends", () => {
    vi.mocked(Date.now).mockReturnValue(Date.parse("2026-07-28T18:15:00.000Z"));

    render(<GymClassCard activity={scheduleFixtures.waitingList} />);

    expect(screen.getByText("20 participated")).toBeTruthy();
    expect(screen.queryByText("20 participating")).toBeNull();
  });

  it("does not show misleading availability when a started activity has no slot data", () => {
    vi.mocked(Date.now).mockReturnValue(Date.parse("2026-07-28T17:00:00.000Z"));

    render(<GymClassCard activity={{ ...scheduleFixtures.available, slots: undefined }} />);

    expect(screen.queryByText("Started")).toBeNull();
    expect(screen.queryByText("Fully booked")).toBeNull();
    expect(screen.getByRole("article").getAttribute("data-started")).toBe("true");
  });

  it("requires confirmation and restores focus when cancelled", async () => {
    const onBook = vi.fn(async () => undefined);
    render(<GymClassCard activity={scheduleFixtures.available} onBook={onBook} />);

    const trigger = screen.getByRole("button", { name: "Book" });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "Enter", code: "Enter" });
    fireEvent.keyUp(trigger, { key: "Enter", code: "Enter" });

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(onBook).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });

  it("prevents duplicate submission and announces pending state", async () => {
    let resolveBooking: (() => void) | undefined;
    const onBook = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveBooking = resolve;
        }),
    );
    render(<GymClassCard activity={scheduleFixtures.available} onBook={onBook} />);

    fireEvent.click(screen.getByRole("button", { name: "Book" }));
    const confirm = screen.getByRole("button", { name: "Confirm booking" });
    fireEvent.click(confirm);
    fireEvent.click(confirm);

    expect(onBook).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status").textContent).toBe("Booking in progress…");
    expect(confirm.hasAttribute("data-disabled")).toBe(true);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape", code: "Escape" });
    expect(screen.getByRole("dialog")).toBeTruthy();

    resolveBooking?.();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("preserves availability after failure and offers deliberate retry", async () => {
    const onBook = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error("Unavailable"))
      .mockResolvedValueOnce(undefined);
    const { container } = render(
      <GymClassCard activity={scheduleFixtures.available} onBook={onBook} />,
    );

    const trigger = screen.getByRole("button", { name: "Book" });
    trigger.focus();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "Confirm booking" }));

    expect((await screen.findByRole("alert")).textContent).toContain("could not be booked");
    expect(container.querySelector("[data-availability='available']")).toBeTruthy();
    expect(container.querySelector("[data-current-value]")?.textContent).toBe("8");
    expect(onBook).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Try booking again" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(onBook).toHaveBeenCalledTimes(2);
    expect(document.activeElement).toBe(trigger);
  });

  it("requires explicit waiting-list confirmation before opting in", async () => {
    const onBook = vi.fn(async () => undefined);
    render(<GymClassCard activity={scheduleFixtures.waitingList} onBook={onBook} />);

    expect(screen.queryByRole("button", { name: "Book" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Join waiting list" }));

    expect(onBook).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Confirm waiting list" })).toBeTruthy();
    expect(screen.getByText(/This does not book a spot/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Join waiting list" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(onBook).toHaveBeenCalledTimes(1);
  });

  it("preserves waiting-list state on failure and offers a deliberate retry", async () => {
    const onBook = vi.fn<() => Promise<void>>().mockRejectedValue(new Error("Unavailable"));
    const { container } = render(
      <GymClassCard activity={scheduleFixtures.waitingList} onBook={onBook} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Join waiting list" }));
    fireEvent.click(screen.getByRole("button", { name: "Join waiting list" }));

    expect((await screen.findByRole("alert")).textContent).toContain("could not be joined");
    expect(container.querySelector("[data-availability='waitingList']")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try joining again" })).toBeTruthy();
    expect(onBook).toHaveBeenCalledTimes(1);
  });

  it("distinguishes a reconciled waiting-list booking", () => {
    const { container } = render(
      <GymClassCard
        activity={scheduleFixtures.waitingList}
        booking={{
          groupActivity: { id: scheduleFixtures.waitingList.id },
          type: "groupActivityWaitingListBooking",
        }}
      />,
    );

    expect(screen.getByText("In queue · 3 total")).toBeTruthy();
    expect(container.querySelector("[data-availability='waitingListBooked']")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Join waiting list" })).toBeNull();
  });

  it("offers cancellation only for an ID-backed ordinary booking and requires confirmation", async () => {
    const onCancel = vi.fn(async () => undefined);
    render(
      <GymClassCard
        activity={scheduleFixtures.available}
        booking={{
          groupActivity: { id: scheduleFixtures.available.id },
          groupActivityBooking: { id: 700001 },
          type: "groupActivityBooking",
        }}
        onCancel={onCancel}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Cancel booking" });
    trigger.focus();
    fireEvent.click(trigger);
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Confirm cancellation" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel booking" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(trigger);
  });

  it("prevents duplicate cancellation and preserves the booking on failure for retry", async () => {
    let rejectCancellation: ((reason: Error) => void) | undefined;
    const onCancel = vi.fn(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectCancellation = reject;
        }),
    );
    const { container } = render(
      <GymClassCard
        activity={scheduleFixtures.available}
        booking={{
          groupActivity: { id: scheduleFixtures.available.id },
          groupActivityBooking: { id: 700001 },
          type: "groupActivityBooking",
        }}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel booking" }));
    const confirm = screen.getByRole("button", { name: "Cancel booking" });
    fireEvent.click(confirm);
    fireEvent.click(confirm);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status").textContent).toBe("Cancelling booking…");
    expect(confirm.hasAttribute("data-disabled")).toBe(true);

    rejectCancellation?.(new Error("Unavailable"));
    expect((await screen.findByRole("alert")).textContent).toContain("could not be cancelled");
    expect(container.querySelector("[data-availability='booked']")).toBeTruthy();
    expect(screen.getByText("Already booked")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try cancelling again" })).toBeTruthy();
  });

  it("keeps waiting-list cancellation blocked", () => {
    render(
      <GymClassCard
        activity={scheduleFixtures.waitingList}
        booking={{
          groupActivity: { id: scheduleFixtures.waitingList.id },
          groupActivityBooking: { id: 700002 },
          type: "groupActivityWaitingListBooking",
        }}
        onCancel={vi.fn(async () => undefined)}
      />,
    );

    expect(screen.queryByRole("button", { name: "Cancel booking" })).toBeNull();
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
