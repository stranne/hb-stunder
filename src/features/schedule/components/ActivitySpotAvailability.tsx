import { Group } from "iconoir-react";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import styles from "./ActivitySpotAvailability.module.css";

export interface ActivitySpotAvailabilityProps {
  available?: number;
  total?: number;
  hasStarted?: boolean;
  presentation?: "details" | "edge";
  className?: string;
}

/** Shared spot summary used by both schedule cards and room-calendar events. */
export function ActivitySpotAvailability({
  available,
  total,
  hasStarted = false,
  presentation = "details",
  className,
}: ActivitySpotAvailabilityProps) {
  const { t } = useTranslation();
  if (available === undefined || total === undefined) return null;

  const ratio = total > 0 ? Math.max(0, Math.min(1, available / total)) : 0;
  const label = t("schedule.details.spots", { available, total });

  return (
    <div
      className={[styles.availability, styles[presentation], className].filter(Boolean).join(" ")}
      data-spot-summary
      data-availability={available === 0 ? "full" : available <= 3 ? "low" : "available"}
      data-started={hasStarted || undefined}
    >
      {presentation === "details" ? (
        <p className={styles.label}>
          <Group aria-hidden="true" />
          {label}
        </p>
      ) : null}
      <div
        className={styles.bar}
        role={presentation === "edge" ? "img" : undefined}
        aria-label={presentation === "edge" ? label : undefined}
        aria-hidden={presentation === "details" ? true : undefined}
      >
        <span style={{ "--spot-ratio": ratio } as CSSProperties} data-spot-availability />
      </div>
    </div>
  );
}
