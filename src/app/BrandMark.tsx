import styles from "./BrandMark.module.css";

/** Vector redraw of the app icon: the egg, its motion lines, ground shadow, and water drop. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      className={[styles.mark, className].filter(Boolean).join(" ")}
      viewBox="190 290 940 660"
      aria-hidden="true"
      focusable="false"
    >
      <g className={styles.brass}>
        <ellipse cx="625" cy="912" rx="252" ry="22" />
        <path d="M240 645C296 585 372 535 474 497M226 762C282 702 340 662 418 633" />
      </g>
      <ellipse
        className={styles.egg}
        cx="698"
        cy="600"
        rx="226"
        ry="302"
        transform="rotate(24 698 600)"
      />
      <path
        className={styles.drop}
        d="M1071 428c22 54 37 98 37 134 0 52-34 94-80 94-36 0-62-30-62-70 0-34 18-62 44-90 18-20 40-42 61-68Z"
      />
    </svg>
  );
}
