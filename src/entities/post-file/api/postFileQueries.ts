import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  deletePostFile,
  getAdminPostFiles,
  getMyPostFiles,
  getPostFilesByUserId,
  getPostFileDownloadUrl,
  reviewPostFile,
  updatePostFile,
  uploadPostFile,
  type GetAdminPostFilesParams,
  type GetUserPostFilesParams,
  type ReviewPostFileRequest,
  type UpdatePostFileRequest,
  type UploadPostFileRequest,
} from "./postFileApi"

export const postFileQueryKeys = {
  adminList: (params: GetAdminPostFilesParams) => ["post-file", "admin-list", params] as const,
  myPostFiles: (postId: string) => ["post-file", "mine", postId] as const,
  root: ["post-file"] as const,
  userList: (params: GetUserPostFilesParams) => ["post-file", "user-list", params] as const,
}

export function useAdminPostFilesQuery(params: GetAdminPostFilesParams) {
  return useQuery({
    placeholderData: keepPreviousData,
    queryFn: () => getAdminPostFiles(params),
    queryKey: postFileQueryKeys.adminList(params),
  })
}

export function useMyPostFilesQuery(postId: string, enabled: boolean) {
  return useQuery({
    enabled: Boolean(postId) && enabled,
    queryFn: () => getMyPostFiles(postId),
    queryKey: postFileQueryKeys.myPostFiles(postId),
  })
}

export function useUserPostFileListQuery(params: GetUserPostFilesParams | undefined) {
  return useQuery({
    enabled: Boolean(params?.userId),
    placeholderData: keepPreviousData,
    queryFn: () => getPostFilesByUserId(params as GetUserPostFilesParams),
    queryKey: postFileQueryKeys.userList(params ?? { page: 1, pageSize: 5, userId: "" }),
  })
}

export function useUploadPostFileMutation(postId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: UploadPostFileRequest) => uploadPostFile(postId, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: postFileQueryKeys.myPostFiles(postId) })
    },
  })
}

export function useUpdatePostFileMutation(postId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ fileId, request }: { fileId: number; request: UpdatePostFileRequest }) => updatePostFile(fileId, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: postFileQueryKeys.myPostFiles(postId) })
    },
  })
}

export function useReviewPostFileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ fileId, request }: { fileId: number; request: ReviewPostFileRequest }) => reviewPostFile(fileId, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: postFileQueryKeys.root })
    },
  })
}

export function useDeletePostFileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deletePostFile,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: postFileQueryKeys.root })
    },
  })
}

export function usePostFileDownloadUrlMutation() {
  return useMutation({
    mutationFn: getPostFileDownloadUrl,
  })
}
