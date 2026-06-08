import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as SecureStore from "expo-secure-store";
import fr from "./fr.json";
import en from "./en.json";

const LANGUAGE_KEY = "app_language";

i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, en: { translation: en } },
  lng: "fr",
  fallbackLng: "fr",
  interpolation: { escapeValue: false },
  compatibilityJSON: "v4",
});

SecureStore.getItemAsync(LANGUAGE_KEY).then((lang) => {
  if (lang === "en" || lang === "fr") i18n.changeLanguage(lang);
}).catch(() => {});

export const persistLanguage = async (lang: "fr" | "en") => {
  await SecureStore.setItemAsync(LANGUAGE_KEY, lang);
  i18n.changeLanguage(lang);
};

export default i18n;
