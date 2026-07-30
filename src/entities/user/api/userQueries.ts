import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createUser,
  deleteUser,
  getUserById,
  getUserTournamentExperiences,
  getUserList,
  searchUsers,
  updateUser,
  type CreateUserRequest,
  type GetUserListParams,
  type UpdateUserRequest,
} from "./userApi"

export const userQueryKeys = {
  detail: (userId: string) => ["user", "detail", userId] as const,
  list: (params: GetUserListParams) => ["user", "list", params] as const,
  root: ["user"] as const,
  search: (params: GetUserListParams) => ["user", "search", params] as const,
  tournamentExperiences: (userId: string) => ["user", "tournament-experiences", userId] as const,
}

export function useUserListQuery(params: GetUserListParams) {
  return useQuery({
    queryFn: () => getUserList(params),
    queryKey: userQueryKeys.list(params),
  })
}

export function useUserSearchQuery(params: GetUserListParams, enabled = true) {
  return useQuery({
    enabled,
    queryFn: () => searchUsers(params),
    queryKey: userQueryKeys.search(params),
  })
}

export function useUserDetailQuery(userId: string | undefined) {
  return useQuery({
    enabled: Boolean(userId),
    queryFn: () => getUserById(userId as string),
    queryKey: userQueryKeys.detail(userId ?? ""),
  })
}

export function useUserTournamentExperiencesQuery(userId: string | undefined) {
  return useQuery({
    enabled: Boolean(userId),
    queryFn: () => getUserTournamentExperiences(userId as string),
    queryKey: userQueryKeys.tournamentExperiences(userId ?? ""),
  })
}

export function useUpdateUserMutation(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: UpdateUserRequest) => updateUser(userId, request),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: userQueryKeys.detail(userId) }),
        queryClient.invalidateQueries({ queryKey: ["auth", "current-user"] }),
      ])
    },
  })
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateUserRequest) => createUser(request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: userQueryKeys.root })
    },
  })
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: userQueryKeys.root })
    },
  })
}
