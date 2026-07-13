export const DEFAULT_LOCALE = "en"
export const SUPPORTED_LOCALES = ["zh", "en"] as const

export type AppLocale = (typeof SUPPORTED_LOCALES)[number]
