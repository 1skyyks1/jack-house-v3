import type { PaginatedEnvelope } from "@/shared/api/contracts/common"
import { unwrapData, unwrapPagination } from "@/shared/api/contracts/unwrap"
import { http, UPLOAD_REQUEST_TIMEOUT_MS } from "@/shared/api/http"
import type {
  CreateEventStagesRequest,
  EventItem,
  EventMutationRequest,
  EventStageMutationRequest,
  EventStageRankItem,
  EventStagesResponse,
  EventTotalRankItem,
  EventUserScoreResponse,
  GetEventListParams,
  GetEventRankParams,
  ImportEventStagesResponse,
} from "../model/types"

export async function getEventList(params: GetEventListParams): Promise<PaginatedEnvelope<EventItem>> {
  const response = await http.get("/event", {
    params: {
      isActive: params.isActive,
      isClosest: params.isClosest ?? false,
      page: params.page,
      pageSize: params.pageSize,
    },
  })

  return unwrapPagination<EventItem>(response)
}

export async function getEventById(eventId: string): Promise<EventItem> {
  const response = await http.get(`/event/${eventId}`)
  return unwrapData<EventItem>(response)
}

export async function createEvent(request: EventMutationRequest): Promise<EventItem> {
  const response = await http.post("/event", request)
  return unwrapData<EventItem>(response)
}

export async function updateEvent(eventId: string, request: EventMutationRequest): Promise<void> {
  await http.put(`/event/${eventId}`, request)
}

export async function deleteEvent(eventId: number): Promise<void> {
  await http.delete(`/event/${eventId}`)
}

export async function getEventStages(eventId: string): Promise<EventStagesResponse> {
  const response = await http.get(`/event/${eventId}/stage`)
  return response as unknown as EventStagesResponse
}

export async function importEventStages(beatmapsetId: number): Promise<ImportEventStagesResponse> {
  const response = await http.get(`/event/stage/import/${beatmapsetId}`)
  return response as unknown as ImportEventStagesResponse
}

export async function createEventStages(request: CreateEventStagesRequest): Promise<void> {
  const formData = new FormData()
  formData.append("event_id", request.eventId)
  formData.append("stages", JSON.stringify(request.stages))
  request.files.forEach((file) => formData.append("file", file))

  await http.post("/event/stage", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: UPLOAD_REQUEST_TIMEOUT_MS,
  })
}

export async function updateEventStage(stageId: number, request: EventStageMutationRequest): Promise<void> {
  await http.put(`/event/stage/${stageId}`, request)
}

export async function deleteEventStage(stageId: number): Promise<void> {
  await http.delete(`/event/stage/${stageId}`)
}

export async function getEventRank(eventId: string, params: GetEventRankParams): Promise<PaginatedEnvelope<EventTotalRankItem>> {
  const response = await http.get(`/event/rank/event/${eventId}`, { params })
  return unwrapPagination<EventTotalRankItem>(response)
}

export async function getEventStageRank(stageId: number, params: GetEventRankParams): Promise<PaginatedEnvelope<EventStageRankItem>> {
  const response = await http.get(`/event/rank/stage/${stageId}`, { params })
  return unwrapPagination<EventStageRankItem>(response)
}

export async function getEventUserScore(eventId: string): Promise<EventUserScoreResponse> {
  const response = await http.get(`/event/userRecord/${eventId}`)
  return response as unknown as EventUserScoreResponse
}

export async function submitEventScore(eventId: string): Promise<void> {
  await http.post(`/event/${eventId}/score`)
}
