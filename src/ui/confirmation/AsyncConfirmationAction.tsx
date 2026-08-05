import { useRef, useState, type RefObject } from "react";
import { Dialog, DialogTrigger, Heading, Modal } from "react-aria-components";
import { Button } from "../button/Button";
import { ErrorMessage } from "../feedback/ErrorMessage";
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
  presentation?: "modal" | "inline";
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
  presentation = "modal",
}: AsyncConfirmationActionProps) {
  const [isPending, setIsPending] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [isInlineOpen, setIsInlineOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const closeConfirmation = (close?: () => void) => {
    close?.();
    setIsInlineOpen(false);
    setTimeout(() => (triggerRef.current ?? focusFallbackRef?.current)?.focus(), 0);
  };

  const confirm = async (close?: () => void) => {
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

  const confirmationContent = (close?: () => void) => (
    <>
      {presentation === "modal" ? <Heading slot="title">{title}</Heading> : <h3>{title}</h3>}
      <p>{message}</p>
      <div className={styles.actions}>
        <Button tone="quiet" isDisabled={isPending} onPress={() => closeConfirmation(close)}>
          {cancelLabel}
        </Button>
        <Button isDisabled={isPending} onPress={() => void confirm(close)}>
          {hasFailed ? retryLabel : confirmLabel}
        </Button>
      </div>
      {hasFailed ? <ErrorMessage>{errorMessage}</ErrorMessage> : null}
      {isPending ? (
        <p className={styles.status} role="status" aria-live="polite">
          {pendingMessage}
        </p>
      ) : null}
    </>
  );

  if (presentation === "inline") {
    return isInlineOpen ? (
      <div className={styles.inlineConfirmation} role="group" aria-label={title}>
        {confirmationContent()}
      </div>
    ) : (
      <Button
        ref={triggerRef}
        tone={tone}
        onPress={() => {
          setHasFailed(false);
          setIsInlineOpen(true);
        }}
      >
        {triggerLabel}
      </Button>
    );
  }

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
        <Dialog className={styles.dialog}>{({ close }) => confirmationContent(close)}</Dialog>
      </Modal>
    </DialogTrigger>
  );
}
