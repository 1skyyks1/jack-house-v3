import type { PaginatedEnvelope } from "@/shared/api/contracts/common"
import { unwrapPagination } from "@/shared/api/contracts/unwrap"
import { http, UPLOAD_REQUEST_TIMEOUT_MS } from "@/shared/api/http"
import type { Badge } from "../model/types"

export type GetBadgeListParams = {
  page: number
  pageSize: number
}

export type UploadBadgeRequest = {
  file: File
  name: string
  redirect_url: string
}

export async function getBadgeList(params: GetBadgeListParams): Promise<PaginatedEnvelope<Badge>> {
  const response = await http.get("/badge", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
    },
  })

  return unwrapPagination<Badge>(response)
}

export async function uploadBadge(request: UploadBadgeRequest): Promise<void> {
  const formData = new FormData()
  formData.append("file", request.file)
  formData.append("name", request.name)
  formData.append("redirect_url", request.redirect_url)

  await http.post("/badge", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: UPLOAD_REQUEST_TIMEOUT_MS,
  })
}

export async function addUsersToBadge(badgeId: number, userIds: number[]): Promise<void> {
  await http.post(`/badge/${badgeId}`, { userIds })
}

export async function deleteBadge(badgeId: number): Promise<void> {
  await http.delete(`/badge/${badgeId}`)
}
