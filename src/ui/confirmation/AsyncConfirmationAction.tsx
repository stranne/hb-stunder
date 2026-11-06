import { useEffect, useRef, useState, type RefObject } from "react";
import { Dialog, DialogTrigger, Heading, Modal } from "react-aria-components";
import { Button, type ButtonTone } from "../button/Button";
import dialogStyles from "../dialog/Dialog.module.css";
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
  tone?: ButtonTone;
  presentation?: "modal" | "inline";
  /** Controls the confirmation, for example to continue a request started before sign-in. */
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
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
  isOpen,
  onOpenChange,
}: AsyncConfirmationActionProps) {
  const [isPending, setIsPending] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [isInlineOpenInternally, setIsInlineOpenInternally] = useState(false);
  const isInlineOpen = isOpen ?? isInlineOpenInternally;
  const setIsInlineOpen = (open: boolean) => {
    setIsInlineOpenInternally(open);
    onOpenChange?.(open);
  };
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inlineRef = useRef<HTMLDivElement>(null);

  // The inline confirmation replaces its trigger, so focus would otherwise fall to the page.
  useEffect(() => {
    if (presentation === "inline" && isInlineOpen) inlineRef.current?.focus();
  }, [presentation, isInlineOpen]);

  const closeConfirmation = (close?: () => void) => {
    if (close) close();
    else setIsInlineOpen(false);
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
        <Button tone={tone} isDisabled={isPending} onPress={() => void confirm(close)}>
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
      <div
        ref={inlineRef}
        className={styles.inlineConfirmation}
        role="group"
        aria-label={title}
        tabIndex={-1}
      >
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
    <DialogTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
      <Button ref={triggerRef} tone={tone} onPress={() => setHasFailed(false)}>
        {triggerLabel}
      </Button>
      <Modal
        className={dialogStyles.backdrop}
        isDismissable={!isPending}
        isKeyboardDismissDisabled={isPending}
      >
        <Dialog className={dialogStyles.dialog}>{({ close }) => confirmationContent(close)}</Dialog>
      </Modal>
    </DialogTrigger>
  );
}
