import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { Button } from "../button/Button";
import { StatusLabel } from "../status-label/StatusLabel";
import interactionStyles from "./Interaction.module.css";
import styles from "./InteractionStates.module.css";

function InteractionStates() {
  const [selectedDay, setSelectedDay] = useState("Tuesday");

  return (
    <main className={styles.page}>
      <header>
        <p className={styles.eyebrow}>Quiet architectural states</p>
        <h1>Interaction language</h1>
        <p className={styles.introduction}>
          Controls stay physically stationary. Tone, keylines, and explicit markers communicate
          hover, selection, status, and intent.
        </p>
      </header>

      <section className={styles.section}>
        <h2>Actions</h2>
        <div className={styles.row}>
          <Button>Book</Button>
          <Button tone="secondary">Details</Button>
          <Button tone="quiet">Previous week</Button>
          <Button tone="danger">Cancel booking</Button>
          <Button isDisabled>Unavailable</Button>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Persistent selection</h2>
        <div className={styles.row} role="group" aria-label="Example day selection">
          {["Monday", "Tuesday", "Wednesday"].map((day) => (
            <button
              key={day}
              type="button"
              className={`${styles.choice} ${interactionStyles.control} ${interactionStyles.secondary} ${interactionStyles.selectable}`}
              aria-pressed={selectedDay === day}
              onClick={() => setSelectedDay(day)}
            >
              {day}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Semantic status</h2>
        <div className={styles.row}>
          <StatusLabel tone="positive">8 spots available</StatusLabel>
          <StatusLabel tone="warning">Waiting list</StatusLabel>
          <StatusLabel tone="neutral">Class finished</StatusLabel>
        </div>
      </section>
    </main>
  );
}

const meta = {
  title: "Design system/Foundations/Interaction language",
  component: InteractionStates,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof InteractionStates>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {};

export const KeyboardFocus: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Book" })).toHaveFocus();
  },
};
