import type { HTMLAttributes, ReactNode } from "react";
import styles from "./StatusLabel.module.css";

export type StatusLabelTone = "positive" | "warning" | "neutral";

export interface StatusLabelProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  children: ReactNode;
  tone?: StatusLabelTone;
  dynamic?: boolean;
}

/** A compact, non-interactive state indicator for use beside actions and controls. */
export function StatusLabel({
  children,
  className,
  dynamic = false,
  tone = "neutral",
  ...props
}: StatusLabelProps) {
  return (
    <div
      {...props}
      className={[styles.label, className].filter(Boolean).join(" ")}
      data-dynamic={dynamic || undefined}
      data-status-label
      data-tone={tone}
    >
      <span className={styles.content}>{children}</span>
    </div>
  );
}
