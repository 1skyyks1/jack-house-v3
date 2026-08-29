export type ManiaPreviewNote = {
  column: number
  endTime: number | null
  startTime: number
}

export type ManiaPreviewTimingPoint = {
  beatLength: number
  time: number
  uninherited: boolean
}

export type ManiaPreviewBeatmap = {
  keyCount: number
  notes: ManiaPreviewNote[]
  previewTime: number
  timingPoints: ManiaPreviewTimingPoint[]
  totalTime: number
}
