import type { PaginatedEnvelope } from "@/shared/api/contracts/common"
import { unwrapPagination } from "@/shared/api/contracts/unwrap"
import { http } from "@/shared/api/http"
import type { PackComment, PostComment } from "../model/types"

export type GetPostCommentsParams = {
  page: number
  pageSize: number
  postId: string
}

export type CreatePostCommentRequest = {
  comment: string
  post_id: number
}

export type GetPackCommentsParams = {
  packId: string
  page: number
  pageSize: number
}

export type CreatePackCommentRequest = {
  content: string
  pack_id: number
}

export async function getPostComments(params: GetPostCommentsParams): Promise<PaginatedEnvelope<PostComment>> {
  const response = await http.get(`/comment/post/${params.postId}`, {
    params: {
      page: params.page,
      pageSize: params.pageSize,
    },
  })

  return unwrapPagination<PostComment>(response)
}

export async function createPostComment(request: CreatePostCommentRequest): Promise<void> {
  await http.post("/comment", request)
}

export async function deletePostComment(commentId: number): Promise<void> {
  await http.delete(`/comment/${commentId}`)
}

export async function getPackComments(params: GetPackCommentsParams): Promise<PaginatedEnvelope<PackComment>> {
  const response = await http.get(`/packCom/${params.packId}`, {
    params: {
      page: params.page,
      pageSize: params.pageSize,
    },
  })

  return unwrapPagination<PackComment>(response)
}

export async function createPackComment(request: CreatePackCommentRequest): Promise<void> {
  await http.post("/packCom", request)
}

export async function deletePackComment(commentId: number): Promise<void> {
  await http.delete(`/packCom/${commentId}`)
}
