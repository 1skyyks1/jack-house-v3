import { i18n } from "@/shared/i18n/client"

export type EventStageSummary = {
  artist: string
  desc?: string | null
  id: number
  map_id: number
  mapper: string
  minio_bg?: string
  pack_id?: number | null
  title: string
  url?: string
}

export type EventItem = {
  created_time: string
  desc: string | null
  end: string
  id: number
  name: string
  stage?: EventStageSummary[]
  start: string
  updated_time: string
}

export type GetEventListParams = {
  isActive: boolean
  isClosest?: boolean
  page: number
  pageSize: number
}

export type EventMutationRequest = {
  desc: string
  end: string
  name: string
  start: string
}

export type EventStageMutationRequest = {
  artist: string
  desc?: string
  map_id: number
  mapper: string
  title: string
}

export type ImportedEventStage = EventStageMutationRequest

export type ImportEventStagesResponse = {
  data: ImportedEventStage[]
}

export type CreateEventStagesRequest = {
  eventId: string
  files: File[]
  stages: EventStageMutationRequest[]
}

export type EventStagesResponse = {
  data: EventStageSummary[]
  event: Omit<EventItem, "created_time" | "stage" | "updated_time">
  total: number
}

export type EventRankUser = {
  avatar: string | null
  user_name: string
}

export type EventTotalRankItem = {
  totalScore: number | string
  user: EventRankUser
  user_id: number
}

export type EventStageRankItem = {
  id: number
  score: number
  stage_id: number
  user: EventRankUser
  user_id: number
}

export type EventUserStageScore = {
  rank: number
  score: number
  stage_id: number
}

export type EventUserTotalScore = {
  totalRank: number | null
  totalScore: number | string
}

export type EventUserScoreResponse = {
  data: EventUserStageScore[]
  total: EventUserTotalScore
}

export type GetEventRankParams = {
  page: number
  pageSize: number
}

export function getEventStatus(event: Pick<EventItem, "end" | "start">) {
  const now = Date.now()
  const start = new Date(event.start).getTime()
  const end = new Date(event.end).getTime()

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return { label: i18n.t("event.status.unknown"), tone: "muted" as const }
  }

  if (now < start) return { label: i18n.t("event.status.upcoming"), tone: "info" as const }
  if (now > end) return { label: i18n.t("event.status.ended"), tone: "muted" as const }
  return { label: i18n.t("event.status.active"), tone: "success" as const }
}
