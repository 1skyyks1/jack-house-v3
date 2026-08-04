import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createPack, createPackFeedback, deletePack, getOsuPackPreview, getPackById, getPackFeedbackList, getPackList, getTagList, importOsuPack, refreshOsuPack, updatePackFeedbackStatus, updatePackTags } from "./packApi"
import type { CreatePackFeedbackRequest, CreatePackRequest, GetPackFeedbackParams, GetPackListParams, ImportOsuPackRequest, RefreshOsuPackRequest, UpdatePackFeedbackStatusRequest, UpdatePackTagsRequest } from "../model/types"

export const packQueryKeys = {
  detail: (packId: string) => ["pack", "detail", packId] as const,
  feedback: (params: GetPackFeedbackParams) => ["pack", "feedback", params] as const,
  feedbackRoot: ["pack", "feedback"] as const,
  list: (params: GetPackListParams) => ["pack", "list", params] as const,
  root: ["pack"] as const,
  tags: ["pack", "tags"] as const,
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
