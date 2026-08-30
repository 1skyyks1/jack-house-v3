import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createEventStages,
  createEvent,
  deleteEvent,
  deleteEventStage,
  getEventById,
  getEventList,
  getEventRank,
  getEventStageRank,
  getEventStages,
  getEventUserScore,
  importEventStages,
  submitEventScore,
  updateEvent,
  updateEventStage,
} from "./eventApi"
import type { CreateEventStagesRequest, EventMutationRequest, EventStageMutationRequest, GetEventListParams, GetEventRankParams } from "../model/types"

export const eventQueryKeys = {
  detail: (eventId: string) => ["event", "detail", eventId] as const,
  eventRank: (eventId: string, params: GetEventRankParams) => ["event", "rank", "event", eventId, params] as const,
  list: (params: GetEventListParams) => ["event", "list", params] as const,
  root: ["event"] as const,
  stageRank: (stageId: number, params: GetEventRankParams) => ["event", "rank", "stage", stageId, params] as const,
  stages: (eventId: string) => ["event", "stages", eventId] as const,
  userScore: (eventId: string) => ["event", "user-score", eventId] as const,
}

export function useEventListQuery(params: GetEventListParams) {
  return useQuery({
    queryFn: () => getEventList(params),
    queryKey: eventQueryKeys.list(params),
  })
}

export function useEventDetailQuery(eventId: string | undefined) {
  return useQuery({
    enabled: Boolean(eventId),
    queryFn: () => getEventById(eventId as string),
    queryKey: eventQueryKeys.detail(eventId ?? ""),
  })
}

export function useEventStagesQuery(eventId: string | undefined) {
  return useQuery({
    enabled: Boolean(eventId),
    queryFn: () => getEventStages(eventId as string),
    queryKey: eventQueryKeys.stages(eventId ?? ""),
  })
}

export function useEventRankQuery(eventId: string | undefined, params: GetEventRankParams) {
  return useQuery({
    enabled: Boolean(eventId),
    placeholderData: (previousData, previousQuery) => previousQuery?.queryKey[3] === eventId ? keepPreviousData(previousData) : undefined,
    queryFn: () => getEventRank(eventId as string, params),
    queryKey: eventQueryKeys.eventRank(eventId ?? "", params),
  })
}

export function useEventStageRankQuery(stageId: number | undefined, params: GetEventRankParams) {
  return useQuery({
    enabled: typeof stageId === "number",
    placeholderData: (previousData, previousQuery) => previousQuery?.queryKey[3] === stageId ? keepPreviousData(previousData) : undefined,
    queryFn: () => getEventStageRank(stageId as number, params),
    queryKey: eventQueryKeys.stageRank(stageId ?? 0, params),
  })
}

export function useEventUserScoreQuery(eventId: string | undefined, enabled: boolean) {
  return useQuery({
    enabled: Boolean(eventId) && enabled,
    queryFn: () => getEventUserScore(eventId as string),
    queryKey: eventQueryKeys.userScore(eventId ?? ""),
  })
}

export function useCreateEventMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createEvent,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: eventQueryKeys.root })
    },
  })
}

export function useUpdateEventMutation(eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: EventMutationRequest) => updateEvent(eventId, request),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: eventQueryKeys.root }),
        queryClient.invalidateQueries({ queryKey: eventQueryKeys.detail(eventId) }),
      ])
    },
  })
}

export function useDeleteEventMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteEvent,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: eventQueryKeys.root })
    },
  })
}

export function useCreateEventStagesMutation(eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateEventStagesRequest) => createEventStages(request),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: eventQueryKeys.root }),
        queryClient.invalidateQueries({ queryKey: eventQueryKeys.stages(eventId) }),
        queryClient.invalidateQueries({ queryKey: eventQueryKeys.detail(eventId) }),
      ])
    },
  })
}

export function useImportEventStagesMutation() {
  return useMutation({
    mutationFn: importEventStages,
  })
}

export function useUpdateEventStageMutation(eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ request, stageId }: { request: EventStageMutationRequest; stageId: number }) => updateEventStage(stageId, request),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: eventQueryKeys.root }),
        queryClient.invalidateQueries({ queryKey: eventQueryKeys.stages(eventId) }),
        queryClient.invalidateQueries({ queryKey: eventQueryKeys.detail(eventId) }),
      ])
    },
  })
}

export function useDeleteEventStageMutation(eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteEventStage,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: eventQueryKeys.root }),
        queryClient.invalidateQueries({ queryKey: eventQueryKeys.stages(eventId) }),
        queryClient.invalidateQueries({ queryKey: eventQueryKeys.detail(eventId) }),
      ])
    },
  })
}

export function useSubmitEventScoreMutation(eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => submitEventScore(eventId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: eventQueryKeys.root })
    },
  })
}
