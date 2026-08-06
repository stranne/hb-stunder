import { Fragment } from "react";
import { Star } from "iconoir-react";
import { useTranslation } from "react-i18next";
import type { ScheduledActivity } from "../model/schedule";
import styles from "./ScheduleFavoriteLabels.module.css";

interface FavoriteMarkerProps {
  isFavorite: boolean;
}

export function FavoriteMarker({ isFavorite }: FavoriteMarkerProps) {
  const { t } = useTranslation();
  if (!isFavorite) return null;

  return (
    <Star
      className={styles.star}
      fill="currentColor"
      role="img"
      aria-label={t("schedule.filters.favorite")}
    />
  );
}

interface FavoriteInstructorNamesProps {
  instructors: ScheduledActivity["instructors"];
  favoriteInstructorIds?: number[];
}

export function FavoriteInstructorNames({
  instructors,
  favoriteInstructorIds = [],
}: FavoriteInstructorNamesProps) {
  const namedInstructors = (instructors ?? []).filter(
    (instructor): instructor is typeof instructor & { name: string } => Boolean(instructor.name),
  );

  return namedInstructors.map((instructor, index) => (
    <Fragment key={instructor.id ?? `${instructor.name}-${index}`}>
      {index > 0 ? ", " : null}
      <span className={styles.name}>
        {instructor.name}
        <FavoriteMarker
          isFavorite={
            instructor.id !== undefined && favoriteInstructorIds.includes(instructor.id)
          }
        />
      </span>
    </Fragment>
  ));
}
