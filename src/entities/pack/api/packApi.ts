import type { PaginatedEnvelope } from "@/shared/api/contracts/common"
import { unwrapData, unwrapPagination } from "@/shared/api/contracts/unwrap"
import { http } from "@/shared/api/http"
import type {
  CreatePackRequest,
  CreatePackResponse,
  CreatePackFeedbackRequest,
  GetPackFeedbackParams,
  GetPackListParams,
  ImportOsuPackRequest,
  OsuPackPreview,
  PackDetail,
  PackFeedback,
  PackListItem,
  PackTag,
  AdminPackTag,
  CreatePackTagRequest,
  RefreshOsuPackRequest,
  UpdatePackTagsRequest,
  UpdatePackTagRequest,
  UpdatePackFeedbackStatusRequest,
} from "../model/types"

export async function getPackList(params: GetPackListParams): Promise<PaginatedEnvelope<PackListItem>> {
  const response = await http.get("/pack", {
    params: {
      loved: params.loved ? 1 : undefined,
      page: params.page,
      pageSize: params.pageSize,
      ranked: params.ranked ? 1 : undefined,
      searchKeys: params.searchKeys || undefined,
      sort: params.sort,
      tags: params.tags.length > 0 ? params.tags : undefined,
      type: params.type === -1 ? undefined : params.type,
    },
  })

  return unwrapPagination<PackListItem>(response)
}

export async function getPackById(packId: string): Promise<PackDetail> {
  const response = await http.get(`/pack/${packId}`)
  return unwrapData<PackDetail>(response)
}

export async function getOsuPackPreview(beatmapsetId: string): Promise<OsuPackPreview> {
  const response = await http.get(`/pack/osu/${beatmapsetId}`)
  return unwrapData<OsuPackPreview>(response)
}

export async function createPack(request: CreatePackRequest): Promise<CreatePackResponse> {
  const response = await http.post("/pack", request)
  return unwrapData<CreatePackResponse>(response)
}

export async function importOsuPack(request: ImportOsuPackRequest): Promise<void> {
  await http.post(`/pack/osu/${request.beatmapsetId}`, {
    tags: request.tags,
    type: request.type,
  })
}

export async function refreshOsuPack(request: RefreshOsuPackRequest): Promise<void> {
  await http.put(`/pack/osu/${request.beatmapsetId}`)
}

export async function deletePack(packId: number | string): Promise<void> {
  await http.delete(`/pack/${packId}`)
}

export async function getTagList(): Promise<PackTag[]> {
  const response = await http.get("/tag")
  return unwrapData<PackTag[]>(response)
}

export async function getAdminTagList(): Promise<AdminPackTag[]> {
  const response = await http.get("/tag/admin")
  return unwrapData<AdminPackTag[]>(response)
}

export async function createPackTag(request: CreatePackTagRequest): Promise<void> {
  await http.post("/tag/admin", request)
}

export async function updatePackTag(request: UpdatePackTagRequest): Promise<void> {
  await http.patch(`/tag/admin/${request.tagId}`, request.values)
}

export async function deletePackTag(tagId: number): Promise<void> {
  await http.delete(`/tag/admin/${tagId}`)
}

export async function updatePackTags(request: UpdatePackTagsRequest): Promise<void> {
  await http.put(`/tag/${request.packId}`, {
    tags: request.tags,
  })
}

export async function createPackFeedback(request: CreatePackFeedbackRequest): Promise<void> {
  await http.post(`/pack/${request.packId}/feedback`, {
    category: request.category,
    content: request.content,
  })
}

export async function getPackFeedbackList(params: GetPackFeedbackParams): Promise<PaginatedEnvelope<PackFeedback>> {
  const response = await http.get("/pack/feedback", { params })
  return unwrapPagination<PackFeedback>(response)
}

export async function updatePackFeedbackStatus(request: UpdatePackFeedbackStatusRequest): Promise<void> {
  await http.patch(`/pack/feedback/${request.feedbackId}`, { status: request.status })
}
