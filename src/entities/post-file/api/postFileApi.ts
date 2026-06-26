import type { PaginatedEnvelope } from "@/shared/api/contracts/common"
import { unwrapData, unwrapPagination } from "@/shared/api/contracts/unwrap"
import { http } from "@/shared/api/http"
import type { PostFile, PostFileStatus } from "../model/types"

export type GetAdminPostFilesParams = {
  keyword?: string
  page: number
  pageSize: number
  post_id?: number | null
  status?: PostFileStatus | null
}

export type GetUserPostFilesParams = {
  page: number
  pageSize: number
  userId: string
}

export type UpdatePostFileRequest = {
  note: string
}

export type ReviewPostFileRequest = {
  feedback: string
  status: 1 | 2
}

export async function getAdminPostFiles(params: GetAdminPostFilesParams): Promise<PaginatedEnvelope<PostFile>> {
  const response = await http.get("/postFile", {
    params: {
      keyword: params.keyword || undefined,
      page: params.page,
      pageSize: params.pageSize,
      post_id: params.post_id ?? undefined,
      status: params.status ?? undefined,
    },
  })

  return unwrapPagination<PostFile>(response)
}

export async function getMyPostFiles(postId: string): Promise<PostFile[]> {
  const response = await http.get(`/postFile/post/${postId}`)
  return unwrapData<PostFile[]>(response)
}

export async function getPostFilesByUserId(params: GetUserPostFilesParams): Promise<PaginatedEnvelope<PostFile>> {
  const response = await http.get(`/postFile/user/${params.userId}`, {
    params: {
      page: params.page,
      pageSize: params.pageSize,
    },
  })

  return unwrapPagination<PostFile>(response)
}

export async function uploadPostFile(postId: string, file: File): Promise<PostFile> {
  const formData = new FormData()
  formData.append("file", file)

  const response = await http.post(`/postFile/upload/${postId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })

  return unwrapData<PostFile>(response)
}

export async function updatePostFile(fileId: number, request: UpdatePostFileRequest): Promise<void> {
  await http.put(`/postFile/${fileId}`, request)
}

export async function reviewPostFile(fileId: number, request: ReviewPostFileRequest): Promise<void> {
  await http.put(`/postFile/review/${fileId}`, request)
}

export async function deletePostFile(fileId: number): Promise<void> {
  await http.delete(`/postFile/${fileId}`)
}

export async function getPostFileDownloadUrl(fileId: number): Promise<string> {
  const response = await http.get(`/postFile/download/${fileId}`)
  return unwrapData<string>(response)
}
