import { useTranslation } from "react-i18next";

export function FoundationPage() {
  const { t } = useTranslation();

  return (
    <main className="app-shell">
      <p className="eyebrow">{t("app.foundationReady")}</p>
      <h1>{t("app.name")}</h1>
      <p>{t("app.unofficial")}</p>
    </main>
  );
}
