import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import { resources } from "./resources"
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type AppLocale } from "./types"
export { DEFAULT_LOCALE, SUPPORTED_LOCALES, type AppLocale } from "./types"

const savedLocale = window.localStorage.getItem("locale")
const initialLocale = SUPPORTED_LOCALES.includes(savedLocale as AppLocale)
  ? (savedLocale as AppLocale)
  : DEFAULT_LOCALE

void i18n.use(initReactI18next).init({
  resources,
  fallbackLng: DEFAULT_LOCALE,
  interpolation: {
    escapeValue: false,
  },
  lng: initialLocale,
})

export { i18n }
