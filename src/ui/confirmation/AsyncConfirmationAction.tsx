import { useRef, useState, type RefObject } from "react";
import { Dialog, DialogTrigger, Heading, Modal } from "react-aria-components";
import { Button } from "../button/Button";
import styles from "./AsyncConfirmationAction.module.css";

export interface AsyncConfirmationActionProps {
  triggerLabel: string;
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  retryLabel: string;
  pendingMessage: string;
  errorMessage: string;
  onConfirm: () => Promise<void>;
  focusFallbackRef?: RefObject<HTMLElement | null>;
  tone?: "accent" | "quiet";
}

export function AsyncConfirmationAction({
  triggerLabel,
  title,
  message,
  cancelLabel,
  confirmLabel,
  retryLabel,
  pendingMessage,
  errorMessage,
  onConfirm,
  focusFallbackRef,
  tone,
}: AsyncConfirmationActionProps) {
  const [isPending, setIsPending] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const closeConfirmation = (close: () => void) => {
    close();
    setTimeout(() => (triggerRef.current ?? focusFallbackRef?.current)?.focus(), 0);
  };

  const confirm = async (close: () => void) => {
    if (isPending) return;

    setHasFailed(false);
    setIsPending(true);
    try {
      await onConfirm();
      closeConfirmation(close);
    } catch {
      setHasFailed(true);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <DialogTrigger>
      <Button ref={triggerRef} tone={tone} onPress={() => setHasFailed(false)}>
        {triggerLabel}
      </Button>
      <Modal
        className={styles.modal}
        isDismissable={!isPending}
        isKeyboardDismissDisabled={isPending}
      >
        <Dialog className={styles.dialog}>
          {({ close }) => (
            <>
              <Heading slot="title">{title}</Heading>
              <p>{message}</p>
              <div className={styles.actions}>
                <Button
                  tone="quiet"
                  isDisabled={isPending}
                  onPress={() => closeConfirmation(close)}
                >
                  {cancelLabel}
                </Button>
                <Button isDisabled={isPending} onPress={() => void confirm(close)}>
                  {hasFailed ? retryLabel : confirmLabel}
                </Button>
              </div>
              {isPending || hasFailed ? (
                <p
                  className={styles.status}
                  role={hasFailed ? "alert" : "status"}
                  aria-live={hasFailed ? "assertive" : "polite"}
                >
                  {hasFailed ? errorMessage : pendingMessage}
                </p>
              ) : null}
            </>
          )}
        </Dialog>
      </Modal>
    </DialogTrigger>
  );
}
