import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { Calendar, CalendarCheck, FilterList, User, ViewGrid } from "iconoir-react";

const colorTokens = [
  ["Canvas", "--color-canvas"],
  ["Surface", "--color-surface"],
  ["Recessed", "--color-surface-recessed"],
  ["Elevated", "--color-surface-elevated"],
  ["Ink", "--color-ink"],
  ["Muted ink", "--color-ink-muted"],
  ["Action", "--color-accent"],
  ["Brass", "--color-brass"],
  ["Waiting", "--color-warning"],
  ["Error", "--color-error"],
  ["Focus", "--color-focus"],
] as const;

function Foundations() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "2rem",
        color: "var(--color-ink)",
        background: "var(--color-canvas)",
      }}
    >
      <div style={{ maxWidth: "60rem", marginInline: "auto" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-display)" }}>
          Foundations
        </h1>
        <h2>Colors and surfaces</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
          {colorTokens.map(([name, token]) => (
            <figure key={token} style={{ margin: 0 }}>
              <div
                style={{
                  width: "7rem",
                  height: "4.5rem",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  background: `var(${token})`,
                  boxShadow: token === "--color-surface-elevated" ? "var(--shadow-raised)" : "none",
                }}
              />
              <figcaption style={{ marginTop: "0.5rem", fontSize: "var(--text-sm)" }}>
                {name}
              </figcaption>
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
      </div>
    </main>
  );
}

function PalettePanel({ mode }: { mode: "light" | "dark" }) {
  const statusStyle = (background: string, color: string): CSSProperties => ({
    padding: "0.45rem 0.75rem",
    borderRadius: "var(--radius-pill)",
    color,
    background,
    fontSize: "var(--text-sm)",
    fontWeight: 700,
  });

  return (
    <section
      data-color-mode={mode}
      style={{
        display: "grid",
        gap: "1rem",
        minWidth: 0,
        padding: "1.5rem",
        color: "var(--color-ink)",
        background: "var(--color-canvas)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <header>
        <div style={{ color: "var(--color-brass-strong)", fontSize: "0.75rem", fontWeight: 750 }}>
          {mode === "light" ? "LIGHT" : "DARK"}
        </div>
        <h2
          style={{ margin: "0.25rem 0 0", fontFamily: "var(--font-display)", fontSize: "1.6rem" }}
        >
          Nordic Bathhouse
        </h2>
      </header>
      <article
        style={{
          display: "grid",
          gridTemplateColumns: "4rem minmax(0, 1fr)",
          gap: "1rem",
          padding: "1rem",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          background: "var(--color-surface)",
        }}
      >
        <strong style={{ fontVariantNumeric: "tabular-nums" }}>10:30</strong>
        <div>
          <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "1.25rem" }}>
            Yinyoga
          </h3>
          <p
            style={{ margin: "0.25rem 0 0", color: "var(--color-ink-muted)", fontSize: "0.875rem" }}
          >
            Alex · Yogastudio
          </p>
        </div>
        <div />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          <span style={statusStyle("var(--color-positive-soft)", "var(--color-positive-strong)")}>
            8 platser
          </span>
          <span style={statusStyle("var(--color-warning-soft)", "var(--color-warning-strong)")}>
            Väntelista
          </span>
        </div>
      </article>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button
          type="button"
          style={{
            minHeight: "2.75rem",
            paddingInline: "1rem",
            border: 0,
            borderRadius: "var(--radius-pill)",
            color: "var(--color-ink-inverse)",
            background: "var(--color-accent)",
            font: "inherit",
            fontWeight: 700,
          }}
        >
          Boka
        </button>
        <button
          type="button"
          style={{
            minHeight: "2.75rem",
            paddingInline: "1rem",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-pill)",
            color: "var(--color-ink)",
            background: "var(--color-surface-recessed)",
            font: "inherit",
            fontWeight: 700,
          }}
        >
          Detaljer
        </button>
      </div>
    </section>
  );
}

function ModeComparison() {
  return (
    <main style={{ minHeight: "100vh", padding: "1rem", background: "#68706d" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 25rem), 1fr))",
          gap: "1rem",
          maxWidth: "60rem",
          marginInline: "auto",
        }}
      >
        <PalettePanel mode="light" />
        <PalettePanel mode="dark" />
      </div>
    </main>
  );
}

const meta = {
  title: "Design system/Foundations/Overview",
  component: Foundations,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Foundations>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {};
export const Light: Story = { globals: { colorMode: "light" } };
export const Dark: Story = { globals: { colorMode: "dark" } };
export const Comparison: Story = { render: () => <ModeComparison /> };
