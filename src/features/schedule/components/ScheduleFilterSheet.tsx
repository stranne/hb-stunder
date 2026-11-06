import type { ReactNode } from "react";
import { Xmark } from "iconoir-react";
import { Dialog, Heading, Modal } from "react-aria-components";
import { useTranslation } from "react-i18next";
import { Button } from "../../../ui/button/Button";
import styles from "./ScheduleFilterSheet.module.css";

export interface ScheduleFilterSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** Classes matching the current filters on the selected day, once the schedule has loaded. */
  resultCount?: number;
  children: ReactNode;
}

/**
 * Filters open over the schedule rather than replacing it: a bottom sheet on phones and a side
 * panel on wider screens, where the list stays visible and changes as selections are made.
 */
export function ScheduleFilterSheet({
  isOpen,
  onOpenChange,
  resultCount,
  children,
}: ScheduleFilterSheetProps) {
  const { t } = useTranslation();

  return (
    <Modal className={styles.backdrop} isOpen={isOpen} onOpenChange={onOpenChange} isDismissable>
      <Dialog className={styles.sheet}>
        {({ close }) => (
          <>
            <header className={styles.header}>
              <Heading slot="title" level={2}>
                {t("schedule.filters.filters")}
              </Heading>
              <Button
                tone="quiet"
                className={styles.close}
                aria-label={t("schedule.filters.close")}
                onPress={close}
              >
                <Xmark aria-hidden="true" />
              </Button>
            </header>
            <div className={styles.body}>{children}</div>
            <footer className={styles.footer}>
              <Button className={styles.showResults} onPress={close}>
                {resultCount === undefined
                  ? t("schedule.filters.showSchedule")
                  : t("schedule.filters.showResults", { count: resultCount })}
              </Button>
            </footer>
          </>
        )}
      </Dialog>
    </Modal>
  );
}
