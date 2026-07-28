import type en from "./locales/en.json";
import type sv from "./locales/sv.json";

type TranslationResource = typeof sv & typeof en;

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: {
      translation: TranslationResource;
    };
    strictKeyChecks: true;
  }
}
