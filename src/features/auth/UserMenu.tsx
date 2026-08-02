import { Dialog, DialogTrigger, Popover } from "react-aria-components";
import { useTranslation } from "react-i18next";
import { Button } from "../../ui/button/Button";
import type { LoginCredentials } from "./api/auth";
import type { CustomerSession } from "./sessionContext";
import { SignInAction } from "./SignInAction";
import styles from "./UserMenu.module.css";

interface UserMenuProps {
  customer?: CustomerSession;
  canSignIn: boolean;
  onSignIn: (credentials: LoginCredentials, remember?: boolean) => Promise<void> | void;
  onSignOut: () => void;
}

export function UserMenu({ customer, canSignIn, onSignIn, onSignOut }: UserMenuProps) {
  const { t } = useTranslation();

  if (!customer) {
    return canSignIn ? (
      <div className={styles.signedOut}>
        <span className={styles.icon} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="8" r="3.25" />
            <path d="M5.5 20c.45-4.1 2.6-6.15 6.5-6.15S18.05 15.9 18.5 20" />
          </svg>
        </span>
        <SignInAction onSignIn={onSignIn} tone="quiet" />
      </div>
    ) : null;
  }

  return (
    <DialogTrigger>
      <Button
        className={styles.trigger}
        tone="quiet"
        aria-label={t("auth.openUserMenu", { name: customer.displayName })}
      >
        <span className={styles.icon} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="8" r="3.25" />
            <path d="M5.5 20c.45-4.1 2.6-6.15 6.5-6.15S18.05 15.9 18.5 20" />
          </svg>
        </span>
        <span className={styles.triggerName}>{customer.displayName}</span>
      </Button>
      <Popover className={styles.popover} placement="bottom end">
        <Dialog className={styles.dialog}>
          <p className={styles.label}>{t("auth.signedInAs")}</p>
          <p className={styles.name}>{customer.displayName}</p>
          <Button slot="close" tone="quiet" onPress={onSignOut}>
            {t("auth.signOut")}
          </Button>
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}
