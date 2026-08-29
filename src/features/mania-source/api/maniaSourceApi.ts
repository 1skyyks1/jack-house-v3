import { unwrapData } from "@/shared/api/contracts/unwrap"
import { http } from "@/shared/api/http"
import type { ManiaBeatmapSource } from "../model/types"

export async function getManiaBeatmapSource(beatmapId: number) {
  const response = await http.get(`/tool/mania/sources/${beatmapId}`)
  return unwrapData<ManiaBeatmapSource>(response)
}
