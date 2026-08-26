import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createPack, createPackFeedback, createPackTag, deletePack, deletePackTag, getAdminTagList, getOsuPackPreview, getPackById, getPackFeedbackList, getPackLeaderboard, getPackList, getTagList, importOsuPack, refreshOsuPack, submitPackBeatmapScore, updatePackFeedbackStatus, updatePackOriginal, updatePackRecommendation, updatePackTag, updatePackTags } from "./packApi"
import type { CreatePackFeedbackRequest, CreatePackRequest, CreatePackTagRequest, GetPackFeedbackParams, GetPackLeaderboardParams, GetPackListParams, ImportOsuPackRequest, RefreshOsuPackRequest, UpdatePackFeedbackStatusRequest, UpdatePackOriginalRequest, UpdatePackRecommendationRequest, UpdatePackTagRequest, UpdatePackTagsRequest } from "../model/types"

export const packQueryKeys = {
  detail: (packId: string) => ["pack", "detail", packId] as const,
  feedback: (params: GetPackFeedbackParams) => ["pack", "feedback", params] as const,
  feedbackRoot: ["pack", "feedback"] as const,
  list: (params: GetPackListParams) => ["pack", "list", params] as const,
  leaderboard: (params: GetPackLeaderboardParams) => ["pack", "leaderboard", params] as const,
  leaderboardRoot: ["pack", "leaderboard"] as const,
  root: ["pack"] as const,
  tags: ["pack", "tags"] as const,
  tagsAdmin: ["pack", "tags", "admin"] as const,
}

export function usePackLeaderboardQuery(params: GetPackLeaderboardParams) {
  return useQuery({
    enabled: Boolean(params.packId) && Number.isInteger(params.beatmapId) && params.beatmapId > 0,
    queryFn: () => getPackLeaderboard(params),
    queryKey: packQueryKeys.leaderboard(params),
  })
}

export function useSubmitPackBeatmapScoreMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ beatmapId, packId }: Pick<GetPackLeaderboardParams, "beatmapId" | "packId">) => submitPackBeatmapScore(packId, beatmapId),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: packQueryKeys.leaderboardRoot }),
  })
}

export function useUpdatePackRecommendationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: UpdatePackRecommendationRequest) => updatePackRecommendation(request),
    onSuccess: async (_data, request) => Promise.all([
      queryClient.invalidateQueries({ queryKey: packQueryKeys.detail(String(request.packId)) }),
      queryClient.invalidateQueries({ queryKey: packQueryKeys.root }),
    ]),
  })
}

export function useUpdatePackOriginalMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: UpdatePackOriginalRequest) => updatePackOriginal(request),
    onSuccess: async (_data, request) => Promise.all([
      queryClient.invalidateQueries({ queryKey: packQueryKeys.detail(String(request.packId)) }),
      queryClient.invalidateQueries({ queryKey: packQueryKeys.root }),
    ]),
  })
}

export function useCreatePackFeedbackMutation() {
  return useMutation({ mutationFn: (request: CreatePackFeedbackRequest) => createPackFeedback(request) })
}

export function usePackFeedbackListQuery(params: GetPackFeedbackParams) {
  return useQuery({ queryFn: () => getPackFeedbackList(params), queryKey: packQueryKeys.feedback(params) })
}

export function useUpdatePackFeedbackStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: UpdatePackFeedbackStatusRequest) => updatePackFeedbackStatus(request),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: packQueryKeys.feedbackRoot }),
  })
}

export function usePackDetailQuery(packId?: string) {
  return useQuery({
    enabled: Boolean(packId),
    queryFn: () => getPackById(packId ?? ""),
    queryKey: packQueryKeys.detail(packId ?? ""),
  })
}

export function usePackListQuery(params: GetPackListParams) {
  return useQuery({
    queryFn: () => getPackList(params),
    queryKey: packQueryKeys.list(params),
  })
}

export function usePackTagsQuery() {
  return useQuery({
    queryFn: getTagList,
    queryKey: packQueryKeys.tags,
    staleTime: 5 * 60_000,
  })
}

export function useAdminPackTagsQuery() {
  return useQuery({ queryFn: getAdminTagList, queryKey: packQueryKeys.tagsAdmin })
}

export function useCreatePackTagMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CreatePackTagRequest) => createPackTag(request),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: packQueryKeys.tags }),
  })
}

export function useUpdatePackTagMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: UpdatePackTagRequest) => updatePackTag(request),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: packQueryKeys.tags }),
  })
}

export function useDeletePackTagMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deletePackTag,
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: packQueryKeys.tags }),
  })
}

export function useOsuPackPreviewMutation() {
  return useMutation({
    mutationFn: getOsuPackPreview,
  })
}

export function useCreatePackMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreatePackRequest) => createPack(request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: packQueryKeys.root })
    },
  })
}

export function useImportOsuPackMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: ImportOsuPackRequest) => importOsuPack(request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: packQueryKeys.root })
    },
  })
}

export function useRefreshOsuPackMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: RefreshOsuPackRequest) => refreshOsuPack(request),
    onSuccess: async (_data, request) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: packQueryKeys.detail(String(request.packId)) }),
        queryClient.invalidateQueries({ queryKey: packQueryKeys.root }),
      ])
    },
  })
}

export function useDeletePackMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (packId: number | string) => deletePack(packId),
    onSuccess: async (_data, packId) => {
      queryClient.removeQueries({ queryKey: packQueryKeys.detail(String(packId)) })
      await queryClient.invalidateQueries({ queryKey: packQueryKeys.root })
    },
  })
}

export function useUpdatePackTagsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: UpdatePackTagsRequest) => updatePackTags(request),
    onSuccess: async (_data, request) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: packQueryKeys.detail(String(request.packId)) }),
        queryClient.invalidateQueries({ queryKey: packQueryKeys.root }),
      ])
    },
  })
}
