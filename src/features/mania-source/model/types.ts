export type ManiaBeatmapMetadata = {
  artist: string
  beatmapId: number
  beatmapsetId: number | null
  bpm: number | null
  coverUrl: string | null
  creator: string
  difficultyRating: number | null
  keyCount: number | null
  mode: string
  title: string
  totalLength: number | null
  version: string
}

export type ManiaBeatmapSource = {
  beatmap: ManiaBeatmapMetadata
  osuText: string
}
