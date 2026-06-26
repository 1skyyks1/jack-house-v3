import type { PaginatedEnvelope } from "@/shared/api/contracts/common"
import { unwrapData, unwrapPagination } from "@/shared/api/contracts/unwrap"
import { http } from "@/shared/api/http"
import type {
  CreatePackRequest,
  CreatePackResponse,
  GetPackListParams,
  ImportOsuPackRequest,
  OsuPackPreview,
  PackDetail,
  PackListItem,
  PackTag,
  RefreshOsuPackRequest,
  UpdatePackTagsRequest,
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

export async function getTagList(): Promise<PackTag[]> {
  const response = await http.get("/tag")
  return unwrapData<PackTag[]>(response)
}

export async function updatePackTags(request: UpdatePackTagsRequest): Promise<void> {
  await http.put(`/tag/${request.packId}`, {
    tags: request.tags,
  })
}
