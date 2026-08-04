import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { Calendar, CalendarCheck, FilterList, User, ViewGrid } from "iconoir-react";

function Foundations() {
  return (
    <main style={{ padding: "2rem", maxWidth: "60rem" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-display)" }}>
        Foundations
      </h1>
      <h2>Colors</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        {[
          ["Canvas", "--color-canvas"],
          ["Surface", "--color-surface"],
          ["Ink", "--color-ink"],
          ["Accent", "--color-accent"],
          ["Focus", "--color-focus"],
        ].map(([name, token]) => (
          <figure key={token} style={{ margin: 0 }}>
            <div
              style={{
                width: "8rem",
                height: "5rem",
                borderRadius: "var(--radius-md)",
                background: `var(${token})`,
                boxShadow: "var(--shadow-raised)",
              }}
            />
            <figcaption style={{ marginTop: "0.5rem" }}>{name}</figcaption>
          </figure>
        ))}
      </div>
      <h2>Typography</h2>
      <p
        style={{
          marginBlock: "1rem 0.25rem",
          fontFamily: "var(--font-display)",
          fontSize: "2.75rem",
          fontWeight: 520,
          lineHeight: 1,
        }}
      >
        Rörelse, vila & återhämtning
      </p>
      <p style={{ marginBlock: 0, maxWidth: "42rem", lineHeight: 1.6 }}>
        Commissioner keeps schedules, controls, and descriptions clear. 08:30–17:45 · 12 platser
        kvar
      </p>
      <h2>Icons</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem" }}>
        {(
          [
            ["Classes", Calendar],
            ["Rooms", ViewGrid],
            ["Bookings", CalendarCheck],
            ["Filters", FilterList],
            ["Account", User],
          ] as const
        ).map(([label, Icon]) => (
          <div
            key={String(label)}
            style={{ display: "grid", justifyItems: "center", gap: "0.5rem", minWidth: "4rem" }}
          >
            <Icon aria-hidden="true" width={24} height={24} />
            <span style={{ fontSize: "var(--text-sm)" }}>{String(label)}</span>
          </div>
        ))}
      </div>
      <h2>Motion</h2>
      <p>
        Fast: {"var(--motion-fast)"} · Standard: {"var(--motion-standard)"}
      </p>
    </main>
  );
}

const meta = {
  title: "Foundations/Overview",
  component: Foundations,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Foundations>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {};
