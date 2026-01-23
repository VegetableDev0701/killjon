import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { translations } from "./translations";

// Initialize i18n with Spanish as default
// (will be updated by the store when it hydrates)
i18n.use(initReactI18next).init({
  resources: {
    es: {
      translation: translations.es,
    },
    en: {
      translation: translations.en,
    },
  },
  lng: "es",
  fallbackLng: "es",
  interpolation: {
    escapeValue: false,
    prefix: "{",
    suffix: "}",
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
