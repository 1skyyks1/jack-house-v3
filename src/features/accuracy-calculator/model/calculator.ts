import type { AccuracyCalculationMode, AccuracyCalculationResult } from "./types"

export function calculateDanAccuracies(
  mode: AccuracyCalculationMode,
  noteCounts: number[],
  accuracies: number[],
): AccuracyCalculationResult | null {
  if (
    noteCounts.length === 0
    || noteCounts.length !== accuracies.length
    || noteCounts.some((value) => !Number.isFinite(value) || value <= 0)
    || accuracies.some((value) => !Number.isFinite(value) || value < 0 || value > 100)
  ) return null

  const cumulativeNoteCounts: number[] = []
  let noteTotal = 0
  for (const noteCount of noteCounts) {
    noteTotal += noteCount
    cumulativeNoteCounts.push(noteTotal)
  }

  const values = mode === "cumulative-to-song"
    ? calculateSongAccuracies(noteCounts, cumulativeNoteCounts, accuracies)
    : calculateCumulativeAccuracies(noteCounts, cumulativeNoteCounts, accuracies)

  return {
    cumulativeNoteCounts,
    effectiveNoteCounts: noteCounts,
    hasImpossibleAccuracy: values.some((value) => value < 0 || value > 100),
    values,
  }
}

function calculateSongAccuracies(noteCounts: number[], cumulativeNoteCounts: number[], cumulativeAccuracies: number[]) {
  return cumulativeAccuracies.map((accuracy, index) => {
    const previousAccuracy = index === 0 ? 0 : cumulativeAccuracies[index - 1]
    const previousNoteCount = index === 0 ? 0 : cumulativeNoteCounts[index - 1]
    return (accuracy * cumulativeNoteCounts[index] - previousAccuracy * previousNoteCount) / noteCounts[index]
  })
}

function calculateCumulativeAccuracies(noteCounts: number[], cumulativeNoteCounts: number[], songAccuracies: number[]) {
  let weightedTotal = 0
  return songAccuracies.map((accuracy, index) => {
    weightedTotal += accuracy * noteCounts[index]
    return weightedTotal / cumulativeNoteCounts[index]
  })
}

export function formatAccuracy(value: number) {
  return value.toFixed(2)
}
