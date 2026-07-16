/// <reference lib="webworker" />

import { runAzusaEstimatorFromText } from "../vendor/estimator/azusaEstimator.js"
import { runDanielEstimatorFromText } from "../vendor/estimator/danielEstimator.js"
import { runMixedEstimatorFromText } from "../vendor/estimator/mixedEstimator.js"
import { runRoxyEstimatorFromText } from "../vendor/estimator/roxyEstimator.js"
import { runSunnyEstimatorFromText } from "../vendor/estimator/sunnyEstimator.js"
import { DEFAULT_SCORE_GOAL, analyzeEtternaFromText } from "../vendor/ett/index.js"
import { detectVibro } from "../vendor/app/vibro.js"
import { analyzePatternFromText } from "../vendor/patterns/service.js"
import type {
  ManiaAnalysisOptions,
  ManiaAnalysisResult,
  ManiaDifficultyGraphPoint,
  ManiaEtternaSkill,
  ManiaPatternSummary,
} from "./types"

type AnalysisRequest = {
  id: string
  options: ManiaAnalysisOptions
  osuText: string
}

type AnalysisResponse =
  | { id: string; result: ManiaAnalysisResult }
  | { error: string; id: string }

type VendorEstimatorResult = {
  columnCount?: unknown
  errorMessage?: unknown
  estDiff?: unknown
  graph?: unknown
  lnRatio?: unknown
  numericDifficulty?: unknown
  numericDifficultyHint?: unknown
  star?: unknown
}

self.addEventListener("message", (event: MessageEvent<AnalysisRequest>) => {
  void handleAnalysisRequest(event.data)
})

async function handleAnalysisRequest({ id, options, osuText }: AnalysisRequest) {
  try {
    if (!osuText.trim()) throw new Error("Beatmap file is empty")
    if (parseKeyCount(osuText) !== 4) throw new Error("Only 4K beatmaps are supported")

    const { actualAlgorithm, result } = runEstimator(osuText, options)
    if (!isValidResult(result)) {
      throw new Error(typeof result.errorMessage === "string" ? result.errorMessage : "Difficulty calculation failed")
    }
    if (Number(result.columnCount) !== 4) throw new Error("Only 4K beatmaps are supported")

    const etternaResult = await analyzeEtternaFromText(osuText, {
      cvtFlag: options.cvtFlag || null,
      etternaVersion: options.etternaVersion,
      keyOverride: 4,
      musicRate: options.speedRate,
      scoreGoal: DEFAULT_SCORE_GOAL,
    })
    const etternaValues = normalizeEtternaValues(etternaResult.values)
    const isVibro = Number(result.star) > 5 && detectVibro(etternaValues, 0.95)

    const response: AnalysisResponse = {
      id,
      result: {
        actualAlgorithm,
        columnCount: Number(result.columnCount),
        etterna: {
          scoreGoal: DEFAULT_SCORE_GOAL,
          values: etternaValues,
          version: options.etternaVersion,
        },
        estDiff: String(result.estDiff),
        graph: normalizeGraph(result.graph),
        isVibro,
        lnRatio: Number(result.lnRatio) || 0,
        numericDifficulty: finiteOrNull(result.numericDifficulty),
        numericDifficultyHint: typeof result.numericDifficultyHint === "string" ? result.numericDifficultyHint : null,
        pattern: analyzePattern(osuText),
        star: Number(result.star),
      },
    }
    self.postMessage(response)
  } catch (error) {
    const response: AnalysisResponse = {
      error: error instanceof Error ? error.message : "Difficulty calculation failed",
      id,
    }
    self.postMessage(response)
  }
}

function parseKeyCount(osuText: string) {
  const match = osuText.match(/^\s*CircleSize\s*:\s*(\d+(?:\.\d+)?)\s*$/m)
  return match ? Math.round(Number(match[1])) : null
}

const ETTERNA_SKILLS: ManiaEtternaSkill[] = [
  "Overall",
  "Stream",
  "Jumpstream",
  "Handstream",
  "Stamina",
  "JackSpeed",
  "Chordjack",
  "Technical",
]

function normalizeEtternaValues(values: Record<string, number>) {
  return Object.fromEntries(ETTERNA_SKILLS.map((skill) => {
    const value = Number(values[skill])
    return [skill, Number.isFinite(value) ? value : 0]
  })) as Record<ManiaEtternaSkill, number>
}

function runEstimator(osuText: string, options: ManiaAnalysisOptions): { actualAlgorithm: ManiaAnalysisResult["actualAlgorithm"]; result: VendorEstimatorResult } {
  const estimatorOptions = {
    cvtFlag: options.cvtFlag || null,
    odFlag: options.odFlag,
    speedRate: options.speedRate,
    withGraph: true,
  }

  if (options.algorithm === "Mixed") {
    return { actualAlgorithm: "Mixed", result: runMixedEstimatorFromText(osuText, estimatorOptions) as VendorEstimatorResult }
  }
  if (options.algorithm === "Daniel") {
    return { actualAlgorithm: "Daniel", result: runDanielEstimatorFromText(osuText, estimatorOptions) as VendorEstimatorResult }
  }
  if (options.algorithm === "Azusa") {
    const result = runAzusaEstimatorFromText(osuText, estimatorOptions) as VendorEstimatorResult
    if (isValidResult(result)) return { actualAlgorithm: "Azusa", result }
    return { actualAlgorithm: "Sunny", result: runSunnyEstimatorFromText(osuText, estimatorOptions) as VendorEstimatorResult }
  }
  if (options.algorithm === "Roxy") {
    const result = runRoxyEstimatorFromText(osuText, estimatorOptions) as VendorEstimatorResult
    if (isValidResult(result)) return { actualAlgorithm: "Roxy", result }
    return { actualAlgorithm: "Sunny", result: runSunnyEstimatorFromText(osuText, estimatorOptions) as VendorEstimatorResult }
  }
  return { actualAlgorithm: "Sunny", result: runSunnyEstimatorFromText(osuText, estimatorOptions) as VendorEstimatorResult }
}

function isValidResult(result: VendorEstimatorResult | null | undefined): result is VendorEstimatorResult & { columnCount: unknown; estDiff: string; star: unknown } {
  if (!result) return false
  return Number.isFinite(Number(result.star))
    && Number.isFinite(Number(result.columnCount))
    && typeof result.estDiff === "string"
}

function finiteOrNull(value: unknown) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function normalizeGraph(graph: unknown): ManiaDifficultyGraphPoint[] {
  const graphRecord = graph && typeof graph === "object" ? graph as Record<string, unknown> : {}
  const times = Array.isArray(graphRecord.times) ? graphRecord.times : []
  const values = Array.isArray(graphRecord.values) ? graphRecord.values : []
  const length = Math.min(times.length, values.length)
  if (length === 0) return []

  const points: ManiaDifficultyGraphPoint[] = []
  for (let index = 0; index < length; index += 1) {
    const time = Number(times[index])
    const difficulty = Number(values[index])
    if (Number.isFinite(time) && Number.isFinite(difficulty)) {
      points.push({ difficulty, time })
    }
  }

  return downsampleGraph(points, 360)
}

function downsampleGraph(points: ManiaDifficultyGraphPoint[], limit: number) {
  if (points.length <= limit) return points

  const result: ManiaDifficultyGraphPoint[] = [points[0]]
  const bucketSize = (points.length - 2) / (limit - 2)
  for (let bucket = 0; bucket < limit - 2; bucket += 1) {
    const start = Math.floor(1 + bucket * bucketSize)
    const end = Math.min(points.length - 1, Math.floor(1 + (bucket + 1) * bucketSize))
    let peak = points[start]
    for (let index = start + 1; index < end; index += 1) {
      if (points[index].difficulty > peak.difficulty) peak = points[index]
    }
    result.push(peak)
  }
  result.push(points[points.length - 1])
  return result
}

function analyzePattern(osuText: string): ManiaPatternSummary | null {
  try {
    const analysis = analyzePatternFromText(osuText)
    const analysisRecord = analysis && typeof analysis === "object" ? analysis as Record<string, unknown> : {}
    const report = analysisRecord.report && typeof analysisRecord.report === "object"
      ? analysisRecord.report as Record<string, unknown>
      : null
    if (!report) return null

    return {
      category: String(report.Category || "Unknown"),
      duration: Number(report.Duration) || 0,
      modeTag: String(report.ModeTag || "Mix"),
      svAmount: Number(report.SVAmount) || 0,
      topClusters: (Array.isArray(report.Clusters) ? report.Clusters : []).slice(0, 6).map((cluster) => {
        const clusterRecord = cluster && typeof cluster === "object" ? cluster as Record<string, unknown> : {}
        const specific = Array.isArray(clusterRecord.SpecificTypes) ? clusterRecord.SpecificTypes[0] : null
        const specificName = Array.isArray(specific) && Number(specific[1]) >= 0.05 ? String(specific[0]) : ""
        return {
          amount: Number(clusterRecord.Amount) || 0,
          bpm: Number(clusterRecord.BPM) || 0,
          importance: Number(clusterRecord.Importance) || 0,
          name: specificName || String(clusterRecord.Pattern || "Unknown"),
          pattern: String(clusterRecord.Pattern || "Unknown"),
        }
      }),
    }
  } catch {
    return null
  }
}

export {}
