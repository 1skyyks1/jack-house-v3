export const MANIA_ANALYSER_ALGORITHMS = ["Mixed", "Roxy", "Azusa", "Sunny", "Daniel"] as const
export const MANIA_ETTERNA_VERSIONS = ["0.72.3"] as const

export type ManiaAnalyserAlgorithm = (typeof MANIA_ANALYSER_ALGORITHMS)[number]
export type ManiaConversion = "" | "HO" | "IN"
export type ManiaEtternaVersion = (typeof MANIA_ETTERNA_VERSIONS)[number]

export type ManiaAnalysisOptions = {
  algorithm: ManiaAnalyserAlgorithm
  cvtFlag: ManiaConversion
  etternaVersion: ManiaEtternaVersion
  odFlag: number | null
  speedRate: number
}

export type ManiaEtternaSkill =
  | "Overall"
  | "Stream"
  | "Jumpstream"
  | "Handstream"
  | "Stamina"
  | "JackSpeed"
  | "Chordjack"
  | "Technical"

export type ManiaEtternaResult = {
  scoreGoal: number
  values: Record<ManiaEtternaSkill, number>
  version: ManiaEtternaVersion
}

export type ManiaDifficultyGraphPoint = {
  difficulty: number
  time: number
}

export type ManiaPatternCluster = {
  amount: number
  bpm: number
  importance: number
  name: string
  pattern: string
}

export type ManiaPatternSummary = {
  category: string
  duration: number
  modeTag: string
  svAmount: number
  topClusters: ManiaPatternCluster[]
}

export type ManiaAnalysisResult = {
  actualAlgorithm: ManiaAnalyserAlgorithm
  columnCount: number
  etterna: ManiaEtternaResult
  estDiff: string
  graph: ManiaDifficultyGraphPoint[]
  isVibro: boolean
  lnRatio: number
  numericDifficulty: number | null
  numericDifficultyHint: string | null
  pattern: ManiaPatternSummary | null
  star: number
}

export type ManiaBeatmapMetadata = {
  artist: string
  beatmapId: number
  beatmapsetId: number | null
  bpm: number | null
  coverUrl: string | null
  creator: string
  difficultyRating: number | null
  mode: string
  title: string
  totalLength: number | null
  version: string
}

export type ManiaBeatmapSource = {
  beatmap: ManiaBeatmapMetadata
  osuText: string
}
