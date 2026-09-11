import { useTranslation } from "react-i18next";
import styles from "./ViewLoading.module.css";

export function ViewLoading() {
  const { t } = useTranslation();

  return (
    <p className={styles.message} role="status">
      {t("app.loadingView")}
    </p>
  );
}
