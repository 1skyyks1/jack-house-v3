import { useQuery } from "@tanstack/react-query"
import { getManiaBeatmapSource } from "./maniaSourceApi"

export const maniaSourceQueryKeys = {
  beatmap: (beatmapId: number) => ["mania", "beatmap-source", beatmapId] as const,
}

export function useManiaBeatmapSourceQuery(beatmapId: number | null | undefined, enabled = true) {
  return useQuery({
    enabled: enabled && Number.isSafeInteger(beatmapId) && Number(beatmapId) > 0,
    queryFn: () => getManiaBeatmapSource(Number(beatmapId)),
    queryKey: maniaSourceQueryKeys.beatmap(Number(beatmapId) || 0),
    staleTime: 60 * 60_000,
  })
}
