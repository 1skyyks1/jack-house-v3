import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createUser,
  deleteUser,
  getUserById,
  getUserList,
  updateUser,
  type CreateUserRequest,
  type GetUserListParams,
  type UpdateUserRequest,
} from "./userApi"

export const userQueryKeys = {
  detail: (userId: string) => ["user", "detail", userId] as const,
  list: (params: GetUserListParams) => ["user", "list", params] as const,
  root: ["user"] as const,
}

export function useUserListQuery(params: GetUserListParams) {
  return useQuery({
    queryFn: () => getUserList(params),
    queryKey: userQueryKeys.list(params),
  })
}

export function useUserDetailQuery(userId: string | undefined) {
  return useQuery({
    enabled: Boolean(userId),
    queryFn: () => getUserById(userId as string),
    queryKey: userQueryKeys.detail(userId ?? ""),
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
