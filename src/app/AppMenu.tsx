import { Check, UserCircle } from "iconoir-react";
import { Dialog, DialogTrigger, Label, Popover, Radio, RadioGroup } from "react-aria-components";
import { useTranslation } from "react-i18next";
import type { LoginCredentials } from "../features/auth/api/auth";
import type { CustomerSession } from "../features/auth/sessionContext";
import { SignInAction } from "../features/auth/SignInAction";
import { Button } from "../ui/button/Button";
import interactionStyles from "../ui/interaction/Interaction.module.css";
import { supportedLanguages, type SupportedLanguage } from "../i18n";
import styles from "./AppMenu.module.css";

interface AppMenuProps {
  customer?: CustomerSession;
  canSignIn: boolean;
  onSignIn: (credentials: LoginCredentials, remember?: boolean) => Promise<void> | void;
  onSignOut: () => void;
}

const languageNames: Record<SupportedLanguage, string> = {
  sv: "Svenska",
  en: "English",
};

export function AppMenu({ customer, canSignIn, onSignIn, onSignOut }: AppMenuProps) {
  const { t, i18n } = useTranslation();
  const language = supportedLanguages.includes(i18n.resolvedLanguage as SupportedLanguage)
    ? (i18n.resolvedLanguage as SupportedLanguage)
    : "sv";

  return (
    <DialogTrigger>
      <Button
        className={styles.trigger}
        tone="quiet"
        aria-label={t(customer?.displayName ? "menu.openFor" : "menu.open", {
          name: customer?.displayName,
        })}
      >
        <span className={styles.icon} aria-hidden="true">
          <UserCircle />
        </span>
      </Button>
      <Popover className={styles.popover} placement="bottom end">
        <Dialog className={styles.dialog} aria-label={t("menu.label")}>
          <RadioGroup
            className={styles.languageGroup}
            value={language}
            onChange={(value) => void i18n.changeLanguage(value)}
          >
            <Label className={styles.sectionLabel}>{t("menu.language")}</Label>
            <div className={styles.options}>
              {supportedLanguages.map((supportedLanguage) => (
                <Radio
                  className={`${styles.option} ${interactionStyles.control} ${interactionStyles.quiet} ${interactionStyles.selectable}`}
                  key={supportedLanguage}
                  value={supportedLanguage}
                >
                  <span>{languageNames[supportedLanguage]}</span>
                  <span className={styles.check} aria-hidden="true">
                    <Check />
                  </span>
                </Radio>
              ))}
            </div>
          </RadioGroup>

          <div className={styles.accountSection}>
            <p className={styles.sectionLabel}>{t("menu.account")}</p>
            {customer?.displayName ? (
              <div className={styles.identity}>
                <p className={styles.identityLabel}>{t("auth.signedInAs")}</p>
                <p className={styles.name}>{customer.displayName}</p>
              </div>
            ) : null}
            {customer ? (
              <Button slot="close" tone="quiet" onPress={onSignOut}>
                {t("auth.signOut")}
              </Button>
            ) : canSignIn ? (
              <SignInAction onSignIn={onSignIn} tone="quiet" />
            ) : (
              <p className={styles.unavailable}>{t("auth.signInUnavailable")}</p>
            )}
          </div>
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}
