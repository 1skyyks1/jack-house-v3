import type { ManiaAnalysisOptions, ManiaAnalysisResult } from "./types"

type WorkerResponse =
  | { id: string; result: ManiaAnalysisResult }
  | { error: string; id: string }

export function runManiaAnalysis(osuText: string, options: ManiaAnalysisOptions, signal?: AbortSignal) {
  return new Promise<ManiaAnalysisResult>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Analysis aborted", "AbortError"))
      return
    }
    const worker = new Worker(new URL("./analyser.worker.ts", import.meta.url), { type: "module" })
    const id = crypto.randomUUID()
    const timeout = window.setTimeout(() => {
      finish()
      reject(new Error("Difficulty calculation timed out"))
    }, 30_000)

    const finish = () => {
      window.clearTimeout(timeout)
      signal?.removeEventListener("abort", handleAbort)
      worker.terminate()
    }

    const handleAbort = () => {
      finish()
      reject(new DOMException("Analysis aborted", "AbortError"))
    }

    signal?.addEventListener("abort", handleAbort, { once: true })

    worker.addEventListener("message", (event: MessageEvent<WorkerResponse>) => {
      if (event.data.id !== id) return
      finish()
      if ("error" in event.data) reject(new Error(event.data.error))
      else resolve(event.data.result)
    })
    worker.addEventListener("error", (event) => {
      finish()
      reject(new Error(event.message || "Difficulty calculation worker failed"))
    })
    worker.postMessage({ id, options, osuText })
  })
}
