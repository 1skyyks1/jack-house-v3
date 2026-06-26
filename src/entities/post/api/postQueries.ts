import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createPost,
  deletePost,
  getForumPreview,
  getPostById,
  getPostList,
  getPostsByUserId,
  searchPosts,
  updatePost,
  type GetPostListParams,
  type GetPostsByUserParams,
  type PostMutationRequest,
  type SearchPostsParams,
} from "./postApi"

export const postQueryKeys = {
  detail: (postId: string) => ["post", "detail", postId] as const,
  forumPreview: () => ["post", "forum-preview"] as const,
  list: (params: GetPostListParams) => ["post", "list", params] as const,
  root: ["post"] as const,
  search: (params: SearchPostsParams) => ["post", "search", params] as const,
  userList: (params: GetPostsByUserParams) => ["post", "user-list", params] as const,
}

export function usePostDetailQuery(postId: string | undefined) {
  return useQuery({
    enabled: Boolean(postId),
    queryFn: () => getPostById(postId as string),
    queryKey: postQueryKeys.detail(postId ?? ""),
  })
}

export function usePostListQuery(params: GetPostListParams) {
  return useQuery({
    queryFn: () => getPostList(params),
    queryKey: postQueryKeys.list(params),
  })
}

export function useUserPostListQuery(params: GetPostsByUserParams | undefined) {
  return useQuery({
    enabled: Boolean(params?.userId),
    queryFn: () => getPostsByUserId(params as GetPostsByUserParams),
    queryKey: postQueryKeys.userList(params ?? { page: 1, pageSize: 5, userId: "" }),
  })
}

export function useForumPreviewQuery() {
  return useQuery({
    queryFn: getForumPreview,
    queryKey: postQueryKeys.forumPreview(),
  })
}

export function usePostSearchQuery(params: SearchPostsParams) {
  return useQuery({
    enabled: params.keyword.trim().length > 0,
    queryFn: () => searchPosts(params),
    queryKey: postQueryKeys.search(params),
  })
}

export function useCreatePostMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: PostMutationRequest) => createPost(request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: postQueryKeys.root })
    },
  })
}

export function useUpdatePostMutation(postId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: PostMutationRequest) => updatePost(postId, request),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: postQueryKeys.root }),
        queryClient.invalidateQueries({ queryKey: postQueryKeys.detail(postId) }),
      ])
    },
  })
}

export function useDeletePostMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deletePost,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: postQueryKeys.root })
    },
  })
}
