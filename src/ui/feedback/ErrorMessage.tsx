import { WarningTriangle } from "iconoir-react";
import type { ReactNode } from "react";
import styles from "./ErrorMessage.module.css";

export interface ErrorMessageProps {
  children: ReactNode;
  action?: ReactNode;
}

export function ErrorMessage({ children, action }: ErrorMessageProps) {
  return (
    <div className={styles.message} role="alert" aria-live="assertive">
      <WarningTriangle className={styles.icon} aria-hidden="true" />
      <div className={styles.content}>{children}</div>
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
