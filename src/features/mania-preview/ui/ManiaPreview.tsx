import { Pause, Play, Speedometer } from "@phosphor-icons/react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { parseManiaPreviewBeatmap } from "../model/parseBeatmap"
import type { ManiaPreviewBeatmap } from "../model/types"

const CANVAS_WIDTH = 250
const CANVAS_HEIGHT = 500
const MIN_SPEED = 1
const MAX_SPEED = 10
const SPEED_STEP = 0.5

export type ManiaPreviewLabels = {
  empty: string
  invalid: string
  pause: string
  play: string
  speed: string
}

type ManiaPreviewProps = {
  className?: string
  labels: ManiaPreviewLabels
  osuText: string
}

export function ManiaPreview({ className, labels, osuText }: ManiaPreviewProps) {
  const parsed = useMemo(() => {
    try {
      return { beatmap: parseManiaPreviewBeatmap(osuText), error: null }
    } catch (error) {
      return { beatmap: null, error: error instanceof Error ? error : new Error(String(error)) }
    }
  }, [osuText])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timeRef = useRef(0)
  const playingRef = useRef(true)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(5)
  const [displayTime, setDisplayTime] = useState(0)

  useEffect(() => {
    let cancelled = false
    const startTime = parsed.beatmap?.previewTime ?? 0
    timeRef.current = startTime
    playingRef.current = Boolean(parsed.beatmap)
    queueMicrotask(() => {
      if (cancelled) return
      setDisplayTime(startTime)
      setPlaying(Boolean(parsed.beatmap))
    })
    return () => { cancelled = true }
  }, [parsed.beatmap])

  useEffect(() => {
    const pauseWhenHidden = () => {
      if (!document.hidden) return
      playingRef.current = false
      setPlaying(false)
    }
    document.addEventListener("visibilitychange", pauseWhenHidden)
    return () => document.removeEventListener("visibilitychange", pauseWhenHidden)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const beatmap = parsed.beatmap
    if (!canvas || !beatmap) return
    const context = canvas.getContext("2d")
    if (!context) return

    const scrollModel = createScrollModel(beatmap)
    const renderModel = createRenderModel(beatmap, scrollModel)
    let animationFrame = 0
    let lastFrame = performance.now()
    let lastLabelUpdate = lastFrame

    const drawFrame = (now: number) => {
      const elapsed = Math.min(100, now - lastFrame)
      lastFrame = now
      if (playingRef.current) {
        timeRef.current = Math.min(beatmap.totalTime, timeRef.current + elapsed)
        if (timeRef.current >= beatmap.totalTime) {
          playingRef.current = false
          setPlaying(false)
        }
      }
      drawBeatmap(canvas, context, beatmap, scrollModel, renderModel, timeRef.current, speed)
      if (now - lastLabelUpdate >= 100) {
        lastLabelUpdate = now
        setDisplayTime(timeRef.current)
      }
      animationFrame = requestAnimationFrame(drawFrame)
    }

    animationFrame = requestAnimationFrame(drawFrame)
    return () => cancelAnimationFrame(animationFrame)
  }, [parsed.beatmap, speed])

  const togglePlaying = () => {
    if (!parsed.beatmap) return
    if (timeRef.current >= parsed.beatmap.totalTime) timeRef.current = 0
    playingRef.current = !playingRef.current
    setPlaying(playingRef.current)
  }

  if (!parsed.beatmap) {
    return <div className={cn("flex min-h-52 items-center justify-center rounded-xl border bg-black/85 p-6 text-center text-sm text-white/65", className)}>{labels.invalid}</div>
  }

  const beatmap = parsed.beatmap
  return (
    <div className={cn("w-full", className)}>
      <canvas
        aria-label={labels.play}
        className="block aspect-[1/2] h-auto w-full rounded-t-lg bg-black shadow-inner"
        height={CANVAS_HEIGHT}
        ref={canvasRef}
        width={CANVAS_WIDTH}
      />
      <div className="space-y-3 rounded-b-lg border border-t-0 bg-card px-2.5 pb-2.5 pt-3.5">
        <input
          aria-label={`${labels.play} / ${labels.pause}`}
          className="block h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted outline-none [&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow-sm [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm focus-visible:[&::-moz-range-thumb]:ring-4 focus-visible:[&::-moz-range-thumb]:ring-primary/20 focus-visible:[&::-webkit-slider-thumb]:ring-4 focus-visible:[&::-webkit-slider-thumb]:ring-primary/20"
          max={beatmap.totalTime}
          min={0}
          onChange={(event) => {
            timeRef.current = Number(event.target.value)
            setDisplayTime(timeRef.current)
          }}
          step={1}
          style={{
            background: `linear-gradient(to right, var(--primary) ${(displayTime / Math.max(beatmap.totalTime, 1)) * 100}%, var(--muted) 0)`,
          }}
          type="range"
          value={Math.min(displayTime, beatmap.totalTime)}
        />
        <div className="flex items-center gap-2">
          <Button aria-label={playing ? labels.pause : labels.play} onClick={togglePlaying} size="icon-sm" type="button" variant="outline">
            {playing ? <Pause className="size-4" weight="fill" /> : <Play className="size-4" weight="fill" />}
          </Button>
          <span className="min-w-0 flex-1 font-mono text-[11px] tabular-nums text-muted-foreground">
            {formatTime(displayTime)} / {formatTime(beatmap.totalTime)}
          </span>
          <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  aria-label={labels.speed}
                  className="flex size-7 items-center justify-center rounded-md hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  type="button"
                >
                  <Speedometer className="size-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-52 gap-2 rounded-xl p-3" side="top" sideOffset={8}>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-muted-foreground">{labels.speed}</span>
                  <span className="font-mono font-semibold tabular-nums">{speed.toFixed(1)}x</span>
                </div>
                <input
                  aria-label={labels.speed}
                  aria-valuetext={`${speed.toFixed(1)}x`}
                  className="block h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted outline-none [&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary focus-visible:[&::-moz-range-thumb]:ring-4 focus-visible:[&::-moz-range-thumb]:ring-primary/20 focus-visible:[&::-webkit-slider-thumb]:ring-4 focus-visible:[&::-webkit-slider-thumb]:ring-primary/20"
                  max={MAX_SPEED}
                  min={MIN_SPEED}
                  onChange={(event) => setSpeed(Number(event.target.value))}
                  step={SPEED_STEP}
                  style={{
                    background: `linear-gradient(to right, var(--primary) ${((speed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED)) * 100}%, var(--muted) 0)`,
                  }}
                  type="range"
                  value={speed}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        {beatmap.notes.length === 0 ? <p className="text-center text-xs text-muted-foreground">{labels.empty}</p> : null}
      </div>
    </div>
  )
}

type ScrollPoint = { cumulative: number; speed: number; time: number }

type RenderNote = {
  column: number
  endPosition: number
  endTime: number | null
  startPosition: number
  startTime: number
}

type RenderModel = {
  notes: RenderNote[]
  prefixMaxEnd: number[]
}

function createScrollModel(beatmap: ManiaPreviewBeatmap) {
  const points: Array<{ speed: number; time: number }> = []
  for (const timingPoint of beatmap.timingPoints) {
    const pointSpeed = timingPoint.uninherited
      ? 1
      : timingPoint.beatLength < 0 ? 100 / -timingPoint.beatLength : 1
    const speed = Number.isFinite(pointSpeed) && pointSpeed > 0 ? pointSpeed : 1
    if (points.at(-1)?.time === timingPoint.time) points[points.length - 1] = { speed, time: timingPoint.time }
    else points.push({ speed, time: timingPoint.time })
  }
  if (points.length === 0 || points[0].time > 0) points.unshift({ speed: 1, time: 0 })

  let cumulative = 0
  return points.map((point, index): ScrollPoint => {
    if (index > 0) {
      const previous = points[index - 1]
      cumulative += previous.speed * (point.time - previous.time)
    }
    return { ...point, cumulative }
  })
}

function getWeightedTime(points: ScrollPoint[], time: number) {
  let low = 0
  let high = points.length - 1
  while (low < high) {
    const middle = Math.ceil((low + high) / 2)
    if (points[middle].time <= time) low = middle
    else high = middle - 1
  }
  const point = points[low]
  return point.cumulative + point.speed * (time - point.time)
}

function createRenderModel(beatmap: ManiaPreviewBeatmap, scrollPoints: ScrollPoint[]): RenderModel {
  const notes = beatmap.notes.map((note): RenderNote => ({
    ...note,
    endPosition: getWeightedTime(scrollPoints, note.endTime ?? note.startTime),
    startPosition: getWeightedTime(scrollPoints, note.startTime),
  }))
  const prefixMaxEnd: number[] = []
  let maximumEnd = Number.NEGATIVE_INFINITY
  for (const [index, note] of notes.entries()) {
    maximumEnd = Math.max(maximumEnd, note.endPosition)
    prefixMaxEnd[index] = maximumEnd
  }
  return { notes, prefixMaxEnd }
}

function lowerBound(values: number[], target: number) {
  let low = 0
  let high = values.length
  while (low < high) {
    const middle = Math.floor((low + high) / 2)
    if (values[middle] < target) low = middle + 1
    else high = middle
  }
  return low
}

function upperBoundStart(notes: RenderNote[], target: number) {
  let low = 0
  let high = notes.length
  while (low < high) {
    const middle = Math.floor((low + high) / 2)
    if (notes[middle].startPosition <= target) low = middle + 1
    else high = middle
  }
  return low
}

function drawBeatmap(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  beatmap: ManiaPreviewBeatmap,
  scrollPoints: ScrollPoint[],
  renderModel: RenderModel,
  currentTime: number,
  speed: number,
) {
  const dpr = window.devicePixelRatio || 1
  const pixelWidth = Math.round(CANVAS_WIDTH * dpr)
  const pixelHeight = Math.round(CANVAS_HEIGHT * dpr)
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth
    canvas.height = pixelHeight
  }
  context.setTransform(dpr, 0, 0, dpr, 0, 0)
  context.fillStyle = "#050507"
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  const columnWidth = CANVAS_WIDTH / beatmap.keyCount
  context.strokeStyle = "rgba(255,255,255,.1)"
  context.lineWidth = 1
  for (let column = 1; column < beatmap.keyCount; column += 1) {
    const x = Math.round(column * columnWidth) + 0.5
    context.beginPath()
    context.moveTo(x, 0)
    context.lineTo(x, CANVAS_HEIGHT)
    context.stroke()
  }

  const receptorY = CANVAS_HEIGHT - 30
  context.fillStyle = "rgba(255,255,255,.9)"
  context.fillRect(0, receptorY, CANVAS_WIDTH, 2)
  const pixelsPerMillisecond = speed * 0.15
  const currentWeightedTime = getWeightedTime(scrollPoints, currentTime)
  const noteWidth = Math.max(3, columnWidth * 0.82)
  const minimumEndPosition = currentWeightedTime - (CANVAS_HEIGHT + 16 - receptorY) / pixelsPerMillisecond
  const maximumStartPosition = currentWeightedTime + (receptorY + 16) / pixelsPerMillisecond
  const firstCandidate = lowerBound(renderModel.prefixMaxEnd, minimumEndPosition)
  const candidateEnd = upperBoundStart(renderModel.notes, maximumStartPosition)

  for (let index = firstCandidate; index < candidateEnd; index += 1) {
    const note = renderModel.notes[index]
    if (note.endPosition < minimumEndPosition) continue
    const headY = receptorY - (note.startPosition - currentWeightedTime) * pixelsPerMillisecond
    const tailY = receptorY - (note.endPosition - currentWeightedTime) * pixelsPerMillisecond
    if (headY < -16 || tailY > CANVAS_HEIGHT + 16) continue
    const x = note.column * columnWidth + (columnWidth - noteWidth) / 2

    if (note.endTime !== null) {
      const top = Math.max(-8, tailY)
      const bottom = Math.min(CANVAS_HEIGHT + 8, headY)
      if (bottom <= top) continue
      context.fillStyle = currentTime >= note.startTime && currentTime <= note.endTime ? "#f1f3f5" : "rgba(225,228,232,.82)"
      context.fillRect(x, top, noteWidth, bottom - top)
    } else {
      context.fillStyle = "#e1e4e8"
      context.fillRect(x, headY, noteWidth, 8)
    }
  }
}

function formatTime(milliseconds: number) {
  const seconds = Math.max(0, Math.round(milliseconds / 1_000))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
}
