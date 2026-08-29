import { unwrapData } from "@/shared/api/contracts/unwrap"
import { http } from "@/shared/api/http"

export async function getManiaBeatmapCover(beatmapsetId: number) {
  const response = await http.get<Blob>(`/tool/mania/covers/${beatmapsetId}`, { responseType: "blob" })
  return unwrapData<Blob>(response)
}
