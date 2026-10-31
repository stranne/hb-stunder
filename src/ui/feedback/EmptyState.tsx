import type { ReactNode } from "react";
import styles from "./EmptyState.module.css";

export interface EmptyStateProps {
  children: ReactNode;
  role?: "status";
}

/** Quiet message for views with nothing to list, drawn as an empty arched window. */
export function EmptyState({ children, role }: EmptyStateProps) {
  return (
    <div className={styles.emptyState} role={role}>
      <svg className={styles.arch} viewBox="0 0 64 72" aria-hidden="true" focusable="false">
        <path d="M6 71V32a26 26 0 0 1 52 0v39" />
        <path d="M16 71V32a16 16 0 0 1 32 0v39" />
        <path d="M0 71h64" />
      </svg>
      <p>{children}</p>
    </div>
  );
}
