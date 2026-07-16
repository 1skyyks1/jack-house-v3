export const DEFAULT_SCORE_GOAL: number
export const DISPLAY_SKILLSET_ORDER: readonly string[]

export type EtternaAnalysisOptions = {
  cvtFlag?: string | null
  etternaVersion?: string | null
  keyOverride?: number | null
  musicRate?: number
  scoreGoal?: number
}

export type EtternaAnalysisResult = {
  engine: "wasm"
  etternaVersion: string
  etternaVersionFallbackReason?: string | null
  keycount: number
  lnRatio: number
  requestedEtternaVersion: string
  values: Record<string, number>
}

export function analyzeEtternaFromText(osuText: string, options?: EtternaAnalysisOptions): Promise<EtternaAnalysisResult>
