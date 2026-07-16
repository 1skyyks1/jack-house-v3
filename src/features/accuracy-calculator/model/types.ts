export type AccuracyCalculationMode = "cumulative-to-song" | "song-to-cumulative"

export type DanPreset = {
  lnote?: number[]
  note: number[]
  num: number
  song: string[]
}

export type DanCatalogGroup = {
  dans: Array<{
    id: string
    name: string
  }>
  id: string
  name: string
}

export type AccuracyCalculationResult = {
  cumulativeNoteCounts: number[]
  effectiveNoteCounts: number[]
  hasImpossibleAccuracy: boolean
  values: number[]
}
