import { CalendarPlus, Check, ShareAndroid, WarningCircle } from "iconoir-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import interactionStyles from "../../../ui/interaction/Interaction.module.css";
import { addActivityToCalendar } from "../model/calendarEvent";
import { classShareUrl, shareClass } from "../model/classSharing";
import type { ScheduledActivity } from "../model/schedule";
import styles from "./ClassUtilityActions.module.css";

type Feedback = "copied" | "calendarAdded" | "error";

export function ClassUtilityActions({
  activity,
  view,
  canShare = true,
  canAddToCalendar = false,
  align = "start",
}: {
  activity: ScheduledActivity;
  view: "classes" | "rooms";
  canShare?: boolean;
  canAddToCalendar?: boolean;
  align?: "start" | "end";
}) {
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState<Feedback>();
  const url = classShareUrl(activity, view);

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(undefined), 2_500);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const handleShare = async () => {
    try {
      const result = await shareClass(activity.name ?? t("schedule.unnamedClass"), url);
      if (result === "copied") setFeedback("copied");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setFeedback("error");
    }
  };

  const handleCalendar = async () => {
    try {
      const result = await addActivityToCalendar(activity, url);
      if (result === "downloaded") setFeedback("calendarAdded");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setFeedback("error");
    }
  };

  if (!canShare && !canAddToCalendar) return null;

  return (
    <div className={styles.wrapper} data-align={align}>
      <div className={styles.actions}>
        {canShare ? (
          <button
            type="button"
            className={`${styles.iconButton} ${interactionStyles.control} ${interactionStyles.quiet}`}
            aria-label={t("schedule.actions.share")}
            title={t("schedule.actions.share")}
            onClick={() => void handleShare()}
          >
            {feedback === "error" ? (
              <WarningCircle aria-hidden="true" />
            ) : feedback === "copied" ? (
              <Check aria-hidden="true" />
            ) : (
              <ShareAndroid aria-hidden="true" />
            )}
          </button>
        ) : null}
        {canAddToCalendar ? (
          <button
            type="button"
            className={`${styles.iconButton} ${interactionStyles.control} ${interactionStyles.quiet}`}
            aria-label={t("schedule.actions.addToCalendar")}
            title={t("schedule.actions.addToCalendar")}
            onClick={() => void handleCalendar()}
          >
            {feedback === "error" ? (
              <WarningCircle aria-hidden="true" />
            ) : (
              <CalendarPlus aria-hidden="true" />
            )}
          </button>
        ) : null}
      </div>
      {feedback ? (
        <span className={styles.visuallyHidden} role="status" aria-live="polite">
          {t(`schedule.actions.${feedback}`)}
        </span>
      ) : null}
    </div>
  );
}
