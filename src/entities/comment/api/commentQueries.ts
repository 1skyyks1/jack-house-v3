import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createPackComment,
  createPostComment,
  deletePackComment,
  deletePostComment,
  getPackComments,
  getPostComments,
  type CreatePackCommentRequest,
  type CreatePostCommentRequest,
  type GetPackCommentsParams,
  type GetPostCommentsParams,
} from "./commentApi"

export const commentQueryKeys = {
  pack: (packId: string, page: number, pageSize: number) => ["comment", "pack", packId, page, pageSize] as const,
  post: (postId: string, page: number, pageSize: number) => ["comment", "post", postId, page, pageSize] as const,
}

export function usePostCommentsQuery(params: GetPostCommentsParams) {
  return useQuery({
    enabled: Boolean(params.postId),
    queryFn: () => getPostComments(params),
    queryKey: commentQueryKeys.post(params.postId, params.page, params.pageSize),
  })
}

export function useCreatePostCommentMutation(postId: string, page: number, pageSize: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreatePostCommentRequest) => createPostComment(request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: commentQueryKeys.post(postId, page, pageSize) })
    },
  })
}

export function useDeletePostCommentMutation(postId: string, page: number, pageSize: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deletePostComment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: commentQueryKeys.post(postId, page, pageSize) })
    },
  })
}

export function usePackCommentsQuery(params: GetPackCommentsParams) {
  return useQuery({
    enabled: Boolean(params.packId),
    queryFn: () => getPackComments(params),
    queryKey: commentQueryKeys.pack(params.packId, params.page, params.pageSize),
  })
}

export function useCreatePackCommentMutation(packId: string, page: number, pageSize: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreatePackCommentRequest) => createPackComment(request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: commentQueryKeys.pack(packId, page, pageSize) })
    },
  })
}

export function useDeletePackCommentMutation(packId: string, page: number, pageSize: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deletePackComment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: commentQueryKeys.pack(packId, page, pageSize) })
    },
  })
}
