import { useEffect, useState } from "react"
import { runManiaAnalysis } from "./runAnalysis"
import type { ManiaAnalysisOptions, ManiaAnalysisResult } from "./types"

type ManiaAnalysisState = {
  error: Error | null
  isAnalysing: boolean
  result: ManiaAnalysisResult | null
  sourceText: string | null
}

export function useManiaAnalysis(osuText: string | undefined, options: ManiaAnalysisOptions, enabled = true) {
  const [state, setState] = useState<ManiaAnalysisState>({ error: null, isAnalysing: false, result: null, sourceText: null })
  const { algorithm, cvtFlag, etternaVersion, odFlag, speedRate } = options

  useEffect(() => {
    let cancelled = false
    if (!enabled || !osuText) {
      queueMicrotask(() => {
        if (!cancelled) setState({ error: null, isAnalysing: false, result: null, sourceText: null })
      })
      return () => { cancelled = true }
    }

    const controller = new AbortController()
    queueMicrotask(() => {
      if (!cancelled) setState({ error: null, isAnalysing: true, result: null, sourceText: osuText })
    })
    void runManiaAnalysis(osuText, { algorithm, cvtFlag, etternaVersion, odFlag, speedRate }, controller.signal)
      .then((result) => {
        if (!cancelled) setState({ error: null, isAnalysing: false, result, sourceText: osuText })
      })
      .catch((error: unknown) => {
        if (cancelled || (error instanceof DOMException && error.name === "AbortError")) return
        setState({
          error: error instanceof Error ? error : new Error(String(error)),
          isAnalysing: false,
          result: null,
          sourceText: osuText,
        })
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [algorithm, cvtFlag, enabled, etternaVersion, odFlag, osuText, speedRate])

  if (!enabled || !osuText) return { error: null, isAnalysing: false, result: null }
  if (state.sourceText !== osuText) return { error: null, isAnalysing: true, result: null }
  return state
}
