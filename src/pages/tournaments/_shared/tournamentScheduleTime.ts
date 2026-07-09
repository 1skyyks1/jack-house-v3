const TEN_MINUTES_IN_MS = 10 * 60 * 1000

export function formatTournamentScheduleTimeUtc(value?: string | null) {
  if (!value) return "-"
  const date = parseScheduleDate(value)
  if (!date) return "-"
  const normalizedDate = roundToTenMinuteUtc(date)
  return `${normalizedDate.getUTCFullYear()}-${padDatePart(normalizedDate.getUTCMonth() + 1)}-${padDatePart(normalizedDate.getUTCDate())} ${padDatePart(normalizedDate.getUTCHours())}:${padDatePart(normalizedDate.getUTCMinutes())} UTC`
}

export function toUtcDateTimeInputValue(value?: string | null) {
  const date = parseScheduleDate(value)
  if (!date) return ""
  const normalizedDate = roundToTenMinuteUtc(date)
  return `${normalizedDate.getUTCFullYear()}-${padDatePart(normalizedDate.getUTCMonth() + 1)}-${padDatePart(normalizedDate.getUTCDate())}T${padDatePart(normalizedDate.getUTCHours())}:${padDatePart(normalizedDate.getUTCMinutes())}`
}

export function fromUtcDateTimeInputValue(value: string) {
  if (!value) return null
  const date = new Date(`${value}:00.000Z`)
  if (Number.isNaN(date.getTime())) return null
  return roundToTenMinuteUtc(date).toISOString()
}

function parseScheduleDate(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function roundToTenMinuteUtc(date: Date) {
  return new Date(Math.round(date.getTime() / TEN_MINUTES_IN_MS) * TEN_MINUTES_IN_MS)
}

function padDatePart(value: number) {
  return String(value).padStart(2, "0")
}
