import type { PaginatedEnvelope } from "@/shared/api/contracts/common"
import { unwrapData, unwrapPagination } from "@/shared/api/contracts/unwrap"
import { http } from "@/shared/api/http"
import type { AppLocale } from "@/shared/i18n/client"
import type {
  ForumPreviewGroup,
  PostDetail,
  PostListItem,
  PostSearchResult,
  PostType,
  PostTypeFilter,
} from "../model/types"

export type GetPostListParams = {
  page: number
  pageSize: number
  type: PostTypeFilter
}

export type GetPostsByUserParams = {
  page: number
  pageSize: number
  userId: string
}

export type SearchPostsParams = {
  keyword: string
  locale: AppLocale
  page: number
  pageSize: number
}

export type PostMutationTranslation = {
  content: string
  language: AppLocale
  title: string
}

export type PostMutationRequest = {
  end: string | null
  limit: number | null
  translations: PostMutationTranslation[]
  type: PostType
}

export type CreatedPostResponse = {
  post_id: number
}

export async function getPostById(postId: string): Promise<PostDetail> {
  const response = await http.get(`/post/${postId}`)
  return unwrapData<PostDetail>(response)
}

export async function getPostList(params: GetPostListParams): Promise<PaginatedEnvelope<PostListItem>> {
  const url = params.type === -1 ? "/post" : `/post/type/${params.type}`

  const response = await http.get(url, {
    params: {
      page: params.page,
      pageSize: params.pageSize,
    },
  })

  return unwrapPagination<PostListItem>(response)
}

export async function getPostsByUserId(params: GetPostsByUserParams): Promise<PaginatedEnvelope<PostListItem>> {
  const response = await http.get(`/post/user/${params.userId}`, {
    params: {
      page: params.page,
      pageSize: params.pageSize,
    },
  })

  return unwrapPagination<PostListItem>(response)
}

export async function getForumPreview(): Promise<ForumPreviewGroup[]> {
  const response = await http.get("/post/forum")
  return unwrapData<ForumPreviewGroup[]>(response)
}

export async function searchPosts(params: SearchPostsParams): Promise<PostSearchResult[]> {
  const response = await http.get("/post/search", {
    params: {
      keyword: params.keyword,
      locale: params.locale,
      page: params.page,
      pageSize: params.pageSize,
    },
  })

  return unwrapData<PostSearchResult[]>(response)
}

export async function createPost(request: PostMutationRequest): Promise<CreatedPostResponse> {
  const response = await http.post("/post", request)
  return unwrapData<CreatedPostResponse>(response)
}

export async function updatePost(postId: string, request: PostMutationRequest): Promise<void> {
  await http.put(`/post/${postId}`, request)
}

export async function deletePost(postId: number): Promise<void> {
  await http.delete(`/post/${postId}`)
}
