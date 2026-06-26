import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { addUsersToBadge, deleteBadge, getBadgeList, uploadBadge, type GetBadgeListParams, type UploadBadgeRequest } from "./badgeApi"

export const badgeQueryKeys = {
  list: (params: GetBadgeListParams) => ["badge", "list", params] as const,
  root: ["badge"] as const,
}

export function useBadgeListQuery(params: GetBadgeListParams) {
  return useQuery({
    queryFn: () => getBadgeList(params),
    queryKey: badgeQueryKeys.list(params),
  })
}

export function useUploadBadgeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: UploadBadgeRequest) => uploadBadge(request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: badgeQueryKeys.root })
    },
  })
}

export function useAddUsersToBadgeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ badgeId, userIds }: { badgeId: number; userIds: number[] }) => addUsersToBadge(badgeId, userIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: badgeQueryKeys.root })
    },
  })
}

export function useDeleteBadgeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteBadge,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: badgeQueryKeys.root })
    },
  })
}
