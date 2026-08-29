import { useState } from "react"
import { getDifficultyColor, getDifficultyTextColor } from "@/entities/pack"
import type { ManiaAnalysisResult } from "../model/types"

export type ManiaAnalysisSummaryLabels = {
  difficulty: string
  graph: string
  reworkStar: string
}

type ManiaAnalysisSummaryProps = {
  labels: ManiaAnalysisSummaryLabels
  result: ManiaAnalysisResult
}

export function ManiaAnalysisSummary({ labels, result }: ManiaAnalysisSummaryProps) {
  const graph = buildGraph(result.graph, 320, 92)
  const [hoveredGraphPoint, setHoveredGraphPoint] = useState<GraphPoint | null>(null)
  const overallMsd = result.etterna.values.Overall
  const difficultyColor = getDifficultyColor(result.star)
  const difficultyTextColor = getDifficultyTextColor(result.star)

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{labels.difficulty}</p>
          <p className="mt-1 break-words font-heading text-xl font-semibold">{result.estDiff}</p>
        </div>
        <div
          className="flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2"
          style={{ backgroundColor: difficultyColor, color: difficultyTextColor }}
        >
          <span className="text-xs font-bold uppercase tracking-[0.1em] opacity-65">MSD</span>
          <span className="font-heading text-xl font-bold tabular-nums">{overallMsd.toFixed(2)}</span>
        </div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {labels.reworkStar}{" "}
        <span className="font-heading font-semibold tabular-nums text-foreground">{result.star.toFixed(2)}</span>
      </p>

      {graph ? (
        <div className="relative mt-6">
          <svg
            aria-label={labels.graph}
            className="h-24 w-full overflow-visible pointer-events-none xl:pointer-events-auto xl:cursor-crosshair"
            onMouseLeave={() => setHoveredGraphPoint(null)}
            onMouseMove={(event) => {
              const bounds = event.currentTarget.getBoundingClientRect()
              const targetX = Math.max(0, Math.min(320, ((event.clientX - bounds.left) / bounds.width) * 320))
              setHoveredGraphPoint(findClosestGraphPoint(graph.points, targetX))
            }}
            preserveAspectRatio="none"
            role="img"
            viewBox="0 0 320 92"
          >
            <defs>
              <linearGradient id="compact-mania-analysis-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity=".35" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity=".03" />
              </linearGradient>
            </defs>
            <path
              d="M 0 4 V 92 H 320 M 0 32 H 4 M 0 62 H 4 M 80 88 V 92 M 160 88 V 92 M 240 88 V 92"
              fill="none"
              opacity=".35"
              stroke="var(--muted-foreground)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <path d={`${graph.path} L 320 92 L 0 92 Z`} fill="url(#compact-mania-analysis-fill)" />
            <path d={graph.path} fill="none" stroke="var(--primary)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            {hoveredGraphPoint ? (
              <g className="hidden xl:block">
                <line opacity=".45" stroke="var(--muted-foreground)" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" x1={hoveredGraphPoint.x} x2={hoveredGraphPoint.x} y1={4} y2={92} />
                <circle cx={hoveredGraphPoint.x} cy={hoveredGraphPoint.y} fill="var(--card)" r="4" stroke="var(--primary)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              </g>
            ) : null}
          </svg>
          {hoveredGraphPoint ? (
            <div
              className="pointer-events-none absolute hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border bg-popover px-2 py-1 font-mono text-[11px] text-popover-foreground shadow-md xl:block"
              style={{
                left: `${Math.max(12, Math.min(88, (hoveredGraphPoint.x / 320) * 100))}%`,
                top: `${Math.max(4, (hoveredGraphPoint.y / 92) * 100 - 5)}%`,
              }}
            >
              {formatGraphTime(hoveredGraphPoint.time)} · {hoveredGraphPoint.difficulty.toFixed(2)}
            </div>
          ) : null}
        </div>
      ) : <p className="mt-6 py-8 text-center text-sm text-muted-foreground">—</p>}
    </div>
  )
}

type GraphPoint = ManiaAnalysisResult["graph"][number] & { x: number; y: number }

function buildGraph(points: ManiaAnalysisResult["graph"], width: number, height: number) {
  const validPoints = points.filter((point) => Number.isFinite(point.time) && Number.isFinite(point.difficulty))
  if (validPoints.length < 2) return null
  const firstTime = validPoints[0].time
  const lastTime = validPoints.at(-1)?.time ?? firstTime + 1
  const timeSpan = Math.max(1, lastTime - firstTime)
  const maxDifficulty = Math.max(1, ...validPoints.map((point) => point.difficulty))
  const graphPoints = validPoints.map((point): GraphPoint => {
    const x = ((point.time - firstTime) / timeSpan) * width
    const y = height - (point.difficulty / maxDifficulty) * (height - 4)
    return { ...point, x, y }
  })
  return {
    path: graphPoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" "),
    points: graphPoints,
  }
}

function findClosestGraphPoint(points: GraphPoint[], targetX: number) {
  let low = 0
  let high = points.length - 1
  while (low < high) {
    const middle = Math.floor((low + high) / 2)
    if (points[middle].x < targetX) low = middle + 1
    else high = middle
  }
  const right = points[low]
  const left = points[Math.max(0, low - 1)]
  return Math.abs(left.x - targetX) <= Math.abs(right.x - targetX) ? left : right
}

function formatGraphTime(milliseconds: number) {
  const seconds = Math.max(0, Math.round(milliseconds / 1_000))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
}
