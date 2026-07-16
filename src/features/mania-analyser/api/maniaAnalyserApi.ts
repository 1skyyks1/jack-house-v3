import { unwrapData } from "@/shared/api/contracts/unwrap"
import { http } from "@/shared/api/http"
import type { ManiaBeatmapSource } from "../model/types"

export async function getManiaBeatmapSource(beatmapId: number) {
  const response = await http.get(`/tool/mania/beatmaps/${beatmapId}`)
  return unwrapData<ManiaBeatmapSource>(response)
}

export async function getManiaBeatmapCover(beatmapsetId: number) {
  const response = await http.get<Blob>(`/tool/mania/covers/${beatmapsetId}`, { responseType: "blob" })
  return unwrapData<Blob>(response)
}
