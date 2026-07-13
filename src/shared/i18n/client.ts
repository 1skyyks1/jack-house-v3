import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import { resources } from "./resources"
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type AppLocale } from "./types"
export { DEFAULT_LOCALE, SUPPORTED_LOCALES, type AppLocale } from "./types"

const savedLocale = getSavedLocale()
const systemLocale = getSystemLocale()
const initialLocale = SUPPORTED_LOCALES.includes(savedLocale as AppLocale)
  ? (savedLocale as AppLocale)
  : systemLocale

void i18n.use(initReactI18next).init({
  resources,
  fallbackLng: DEFAULT_LOCALE,
  interpolation: {
    escapeValue: false,
  },
  lng: initialLocale,
})

export function saveLocale(locale: AppLocale) {
  try {
    window.localStorage.setItem("locale", locale)
  } catch {
    // Storage can be unavailable when the browser blocks site data.
  }
}

function getSavedLocale() {
  try {
    return window.localStorage.getItem("locale")
  } catch {
    return null
  }
}

function getSystemLocale(): AppLocale {
  try {
    const preferredLanguage = window.navigator.languages?.[0] ?? window.navigator.language
    return preferredLanguage?.toLowerCase().startsWith("zh") ? "zh" : DEFAULT_LOCALE
  } catch {
    return DEFAULT_LOCALE
  }
}

export { i18n }
