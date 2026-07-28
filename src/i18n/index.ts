import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import sv from "./locales/sv.json";

export const supportedLanguages = ["sv", "en"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

type TranslationResource = typeof sv & typeof en;

const resources = {
  en: { translation: en },
  sv: { translation: sv },
} satisfies Record<SupportedLanguage, { translation: TranslationResource }>;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: supportedLanguages,
    fallbackLng: "sv",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "hb-stunder-language",
    },
  });

function updateDocumentLanguage(language: string) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = supportedLanguages.includes(language as SupportedLanguage)
    ? language
    : "sv";
}

updateDocumentLanguage(i18n.resolvedLanguage ?? i18n.language);
i18n.on("languageChanged", updateDocumentLanguage);

export default i18n;
