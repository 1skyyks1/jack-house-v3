import type { TFunction } from "i18next"
import { i18n as appI18n } from "@/shared/i18n/client"

export const HIGHLIGHTED_RANK_COUNT = 3
export const EVENT_LEADERBOARD_PAGE_SIZE = 10
export const SCORE_COOLDOWN_SECONDS = 30 * 60

export type EventTab = "overview" | "leaderboard" | `stage-${number}`

export type EventCopy = {
  countdown: string
  desc: string
  leaderboard: string
  myScore: string
  noScore: string
  overview: string
  rank: string
  rule: string
  rules: string[]
  score: string
  submitScore: string
  totalRank: string
  totalScore: string
  username: string
}

export function parseStageTab(tab: EventTab) {
  if (!tab.startsWith("stage-")) return null

  const value = Number(tab.slice("stage-".length))
  return Number.isInteger(value) ? value : null
}

export function formatShortDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"

  return new Intl.DateTimeFormat(appI18n.language === "zh" ? "zh-CN" : "en-CA", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  }).format(date)
}

export function formatCountdown(end: string) {
  const endTime = new Date(end).getTime()
  if (Number.isNaN(endTime)) return "-"

  const diffSeconds = Math.max(0, Math.floor((endTime - Date.now()) / 1000))
  const days = Math.floor(diffSeconds / 86_400)
  const hours = Math.floor((diffSeconds % 86_400) / 3_600)
  const minutes = Math.floor((diffSeconds % 3_600) / 60)
  return `${days}d ${hours}h ${minutes}m`
}

export function formatCooldown(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${String(rest).padStart(2, "0")}`
}

export function formatScore(value: number | string | undefined) {
  const numberValue = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(numberValue)) return "-"

  return new Intl.NumberFormat("en-US").format(numberValue)
}

export function getUserInitial(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "?"
}

export function getEventCopy(t: TFunction): EventCopy {
  return {
    countdown: t("event.countdown"),
    desc: t("event.details"),
    leaderboard: t("event.leaderboard"),
    myScore: t("event.myScore"),
    noScore: t("event.noScore"),
    overview: t("event.overview"),
    rank: t("event.rank"),
    rule: t("event.rulesTitle"),
    rules: t("event.rules", { returnObjects: true }) as string[],
    score: t("event.score"),
    submitScore: t("event.submitScore"),
    totalRank: t("event.totalRank"),
    totalScore: t("event.totalScore"),
    username: t("event.username"),
  }
}
