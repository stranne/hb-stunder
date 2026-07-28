import type { Meta, StoryObj } from "@storybook/tanstack-react";

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
      <p style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)" }}>
        Display typography
      </p>
      <p>Body typography for clear, accessible interfaces.</p>
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
