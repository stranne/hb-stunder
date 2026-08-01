import { useState, type FormEvent } from "react";
import {
  Dialog,
  DialogTrigger,
  Heading,
  Input,
  Label,
  Modal,
  TextField,
} from "react-aria-components";
import { useTranslation } from "react-i18next";
import { Button } from "../../ui/button/Button";
import type { LoginCredentials } from "./api/auth";
import styles from "./SignInAction.module.css";

export function SignInAction({
  onSignIn,
  tone,
}: {
  onSignIn: (credentials: LoginCredentials) => Promise<void> | void;
  tone?: "accent" | "quiet";
}) {
  const { t } = useTranslation();
  const [isPending, setIsPending] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>, close: () => void) => {
    event.preventDefault();
    if (isPending) return;

    const form = new FormData(event.currentTarget);
    const username = form.get("username");
    const password = form.get("password");
    setHasFailed(false);
    setIsPending(true);

    try {
      await onSignIn({
        username: typeof username === "string" ? username : "",
        password: typeof password === "string" ? password : "",
      });
      close();
    } catch {
      setHasFailed(true);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <DialogTrigger>
      <Button tone={tone} onPress={() => setHasFailed(false)}>
        {t("auth.signIn")}
      </Button>
      <Modal
        className={styles.modal}
        isDismissable={!isPending}
        isKeyboardDismissDisabled={isPending}
      >
        <Dialog className={styles.dialog}>
          {({ close }) => (
            <form onSubmit={(event) => void submit(event, close)}>
              <Heading slot="title">{t("auth.title")}</Heading>
              <TextField className={styles.field} name="username" isRequired autoFocus>
                <Label>{t("auth.username")}</Label>
                <Input autoComplete="username" />
              </TextField>
              <TextField className={styles.field} name="password" type="password" isRequired>
                <Label>{t("auth.password")}</Label>
                <Input autoComplete="current-password" />
              </TextField>
              <div className={styles.actions}>
                <Button type="button" tone="quiet" isDisabled={isPending} onPress={close}>
                  {t("auth.cancel")}
                </Button>
                <Button type="submit" isDisabled={isPending}>
                  {t("auth.signIn")}
                </Button>
              </div>
              {isPending || hasFailed ? (
                <p className={styles.status} role={hasFailed ? "alert" : "status"}>
                  {t(hasFailed ? "auth.error" : "auth.pending")}
                </p>
              ) : null}
            </form>
          )}
        </Dialog>
      </Modal>
    </DialogTrigger>
  );
}
