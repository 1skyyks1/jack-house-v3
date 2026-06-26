export const DEFAULT_LOCALE = "zh"
export const SUPPORTED_LOCALES = ["zh", "en"] as const

export type AppLocale = (typeof SUPPORTED_LOCALES)[number]
