import { downloadZip } from "client-zip"
import type { PaginatedEnvelope } from "@/shared/api/contracts/common"
import { unwrapData, unwrapPagination } from "@/shared/api/contracts/unwrap"
import { http } from "@/shared/api/http"
import type { PostFile, PostFileStatus, PublicPostFileListItem } from "../model/types"

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

export type UploadPostFileRequest = {
  file: File
  onUploadProgress?: (progress: number) => void
}

export type ReviewPostFileRequest = {
  feedback: string
  status: 1 | 2
}

type PostFileDownloadManifest = {
  archiveName: string
  files: Array<{
    name: string
    size: number
    url: string
  }>
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

export async function getPostFilesByUserId(params: GetUserPostFilesParams): Promise<PaginatedEnvelope<PublicPostFileListItem>> {
  const response = await http.get(`/postFile/user/${params.userId}`, {
    params: {
      page: params.page,
      pageSize: params.pageSize,
    },
  })

  return unwrapPagination<PublicPostFileListItem>(response)
}

export async function uploadPostFile(postId: string, request: UploadPostFileRequest): Promise<PostFile> {
  const formData = new FormData()
  formData.append("file", request.file)

  const response = await http.post(`/postFile/upload/${postId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (event) => {
      if (!event.total) return
      request.onUploadProgress?.(Math.min(100, Math.round((event.loaded / event.total) * 100)))
    },
    timeout: 5 * 60_000,
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

export type DownloadPostFilesArchiveRequest = {
  onProgress?: (completed: number, total: number) => void
  postId: number
}

export async function downloadPostFilesArchive({ onProgress, postId }: DownloadPostFilesArchiveRequest): Promise<{ blob: Blob; fileName: string }> {
  const response = await http.get(`/postFile/download-manifest/${postId}`)
  const manifest = unwrapData<PostFileDownloadManifest>(response)
  let completed = 0

  onProgress?.(completed, manifest.files.length)

  async function* fetchPostFiles() {
    for (const file of manifest.files) {
      const fileResponse = await fetch(file.url)
      if (!fileResponse.ok) {
        throw new Error(`Failed to download ${file.name} (${fileResponse.status})`)
      }

      yield {
        input: fileResponse,
        name: file.name,
        size: file.size,
      }

      completed += 1
      onProgress?.(completed, manifest.files.length)
    }
  }

  const metadata = manifest.files.map((file) => ({ name: file.name, size: file.size }))
  const blob = await downloadZip(fetchPostFiles(), { metadata }).blob()

  return { blob, fileName: manifest.archiveName }
}
