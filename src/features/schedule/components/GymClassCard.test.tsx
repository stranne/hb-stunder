// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vite-plus/test";
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

  it("discloses activity-specific information and the class description", () => {
    const { container } = render(<GymClassCard activity={scheduleFixtures.withMessages} />);

    const disclosure = screen.getByRole("button", { name: "Show details" });
    expect(disclosure.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(disclosure);
    expect(disclosure.getAttribute("aria-expanded")).toBe("true");

    expect(screen.getByRole("heading", { name: "For this class" })).toBeTruthy();
    expect(screen.getByText("Klassen hålls på lättförståelig engelska.")).toBeTruthy();
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

    expect(screen.getByText("On waiting list")).toBeTruthy();
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
