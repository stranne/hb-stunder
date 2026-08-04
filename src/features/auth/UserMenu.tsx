import { Dialog, DialogTrigger, Popover } from "react-aria-components";
import { User } from "iconoir-react";
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
          <User />
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
        aria-label={t(customer.displayName ? "auth.openUserMenuFor" : "auth.openUserMenu", {
          name: customer.displayName,
        })}
      >
        <span className={styles.icon} aria-hidden="true">
          <User />
        </span>
      </Button>
      <Popover className={styles.popover} placement="bottom end">
        <Dialog className={styles.dialog}>
          {customer.displayName ? (
            <div className={styles.identity}>
              <p className={styles.label}>{t("auth.signedInAs")}</p>
              <p className={styles.name}>{customer.displayName}</p>
            </div>
          ) : null}
          <Button slot="close" tone="quiet" onPress={onSignOut}>
            {t("auth.signOut")}
          </Button>
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}
