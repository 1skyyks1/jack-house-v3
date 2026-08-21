import {
  ChartLineUp,
  CircleNotch,
  FileArrowUp,
  GithubLogo,
  MusicNotes,
  Pulse,
  Question,
  Sparkle,
  Timer,
  X,
} from "@phosphor-icons/react"
import type { TFunction } from "i18next"
import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  type PieLabelRenderProps,
  XAxis,
  YAxis,
} from "recharts"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { getDifficultyColor, getDifficultyTextColor } from "@/entities/pack"
import { useAuthStore } from "@/features/auth"
import {
  createLocalManiaBeatmapSource,
  downloadManiaAnalysisImage,
  getManiaBeatmapCover,
  getManiaBeatmapSource,
  LocalBeatmapError,
  MANIA_ANALYSER_ALGORITHMS,
  runManiaAnalysis,
  type ManiaAnalyserAlgorithm,
  type ManiaAnalysisResult,
  type ManiaAnalysisImageLabels,
  type ManiaBeatmapSource,
  type ManiaConversion,
  type ManiaEtternaSkill,
} from "@/features/mania-analyser"
import { getErrorMessage } from "@/shared/components"
import { ApiError } from "@/shared/api/errors"
import { cn } from "@/lib/utils"
import deleteCoverUrl from "@/assets/mappack/delete.jpg"

const chartConfig = {
  difficulty: {
    color: "var(--color-primary)",
    label: "Difficulty",
  },
} satisfies ChartConfig

const patternChartConfig = {
  amount: {
    color: "var(--chart-1)",
    label: "Pattern",
  },
} satisfies ChartConfig

const etternaChartConfig = {
  value: {
    color: "var(--primary)",
    label: "MSD",
  },
} satisfies ChartConfig

const patternChartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

type CompletedAnalysis = {
  elapsedMs: number
  options: {
    algorithm: ManiaAnalyserAlgorithm
    cvtFlag: ManiaConversion
    etternaVersion: "0.72.3"
    odFlag: number | null
    speedRate: number
  }
  result: ManiaAnalysisResult
  source: ManiaBeatmapSource
}

export function ManiaAnalyserPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const isLogged = useAuthStore((state) => state.isLogged)
  const openLoginDialog = useAuthStore((state) => state.openLoginDialog)
  const requestedBeatmapId = parseBeatmapId(searchParams.get("beatmapId") ?? "")
  const [beatmapInput, setBeatmapInput] = useState(() => requestedBeatmapId ? String(requestedBeatmapId) : "")
  const [algorithm, setAlgorithm] = useState<ManiaAnalyserAlgorithm>("Mixed")
  const [speedRate, setSpeedRate] = useState("1")
  const [odOverride, setOdOverride] = useState("")
  const [conversion, setConversion] = useState<ManiaConversion>("")
  const [isAnalysing, setIsAnalysing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [analysis, setAnalysis] = useState<CompletedAnalysis | null>(null)
  const [localFile, setLocalFile] = useState<File | null>(null)
  const [isDraggingLocalFile, setIsDraggingLocalFile] = useState(false)
  const localFileDragDepthRef = useRef(0)
  const localFileInputRef = useRef<HTMLInputElement>(null)
  const selectionFormRef = useRef<HTMLFormElement>(null)
  const autoAnalysisBeatmapIdRef = useRef<number | null>(null)
  const loginRequestedBeatmapIdRef = useRef<number | null>(null)
  const [isSelectionDocked, setIsSelectionDocked] = useState(false)

  useEffect(() => {
    if (
      !requestedBeatmapId
      || beatmapInput !== String(requestedBeatmapId)
      || autoAnalysisBeatmapIdRef.current === requestedBeatmapId
    ) return

    if (!isLogged) {
      if (loginRequestedBeatmapIdRef.current !== requestedBeatmapId) {
        loginRequestedBeatmapIdRef.current = requestedBeatmapId
        openLoginDialog(window.location.pathname + window.location.search)
      }
      return
    }

    autoAnalysisBeatmapIdRef.current = requestedBeatmapId
    selectionFormRef.current?.requestSubmit()
  }, [beatmapInput, isLogged, openLoginDialog, requestedBeatmapId])

  useEffect(() => {
    const syncDockedState = () => {
      setIsSelectionDocked((selectionFormRef.current?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY) <= 12)
    }

    syncDockedState()
    window.addEventListener("resize", syncDockedState)
    window.addEventListener("scroll", syncDockedState, { passive: true })

    return () => {
      window.removeEventListener("resize", syncDockedState)
      window.removeEventListener("scroll", syncDockedState)
    }
  }, [])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!isLogged) {
      openLoginDialog(window.location.pathname + window.location.search)
      return
    }

    const beatmapId = localFile ? null : parseBeatmapId(beatmapInput)
    if (!localFile && !beatmapId) {
      toast.error(t("maniaAnalyser.invalidBeatmapId"))
      return
    }

    const rate = clamp(Number(speedRate) || 1, 0.5, 2)
    const parsedOd = odOverride.trim() === "" ? null : clamp(Number(odOverride), 0, 10)
    const options = { algorithm, cvtFlag: conversion, etternaVersion: "0.72.3" as const, odFlag: parsedOd, speedRate: rate }
    setAnalysis(null)
    setIsAnalysing(true)

    try {
      const startedAt = performance.now()
      const source = localFile
        ? await createLocalManiaBeatmapSource(localFile, deleteCoverUrl)
        : await getManiaBeatmapSource(beatmapId as number)
      const result = await runManiaAnalysis(source.osuText, options)
      setAnalysis({ elapsedMs: performance.now() - startedAt, options, result, source })
      setSpeedRate(String(rate))
      if (result.actualAlgorithm !== algorithm) {
        toast.info(t("maniaAnalyser.fallback", { actual: result.actualAlgorithm, requested: algorithm }))
      }
    } catch (analyseError) {
      if (!(analyseError instanceof ApiError && analyseError.status === 401)) {
        toast.error(t("maniaAnalyser.errorTitle"), {
          description: getAnalysisErrorDescription(analyseError, t),
        })
      }
    } finally {
      setIsAnalysing(false)
    }
  }

  const selectLocalFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".osu")) {
      toast.error(t("maniaAnalyser.invalidLocalFile"))
      return
    }
    setLocalFile(file)
    setBeatmapInput("")
    setAnalysis(null)
  }

  const handleLocalFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (file) selectLocalFile(file)
  }

  const handleLocalFileDragEnter = (event: DragEvent<HTMLElement>) => {
    if (!hasDraggedFiles(event)) return
    event.preventDefault()
    localFileDragDepthRef.current += 1
    setIsDraggingLocalFile(true)
  }

  const handleLocalFileDragOver = (event: DragEvent<HTMLElement>) => {
    if (!hasDraggedFiles(event)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
  }

  const handleLocalFileDragLeave = (event: DragEvent<HTMLElement>) => {
    if (!hasDraggedFiles(event)) return
    event.preventDefault()
    localFileDragDepthRef.current = Math.max(0, localFileDragDepthRef.current - 1)
    if (localFileDragDepthRef.current === 0) setIsDraggingLocalFile(false)
  }

  const handleLocalFileDrop = (event: DragEvent<HTMLElement>) => {
    if (!hasDraggedFiles(event)) return
    event.preventDefault()
    localFileDragDepthRef.current = 0
    setIsDraggingLocalFile(false)
    const file = event.dataTransfer.files[0]
    if (file) selectLocalFile(file)
  }

  const clearLocalFile = () => {
    setLocalFile(null)
    setAnalysis(null)
  }

  const handleExport = async () => {
    if (!analysis) return

    setIsExporting(true)
    let coverObjectUrl: string | null = null
    const { result, source } = analysis
    const map = source.beatmap
    try {
      if (map.beatmapId > 0 && map.beatmapsetId) {
        try {
          coverObjectUrl = URL.createObjectURL(await getManiaBeatmapCover(map.beatmapsetId))
        } catch {
          // The image exporter will retry the original URL, then use the bundled fallback.
        }
      }
      const labels: ManiaAnalysisImageLabels = {
        bpm: t("maniaAnalyser.bpm"),
        difficultyGraph: t("maniaAnalyser.difficultyGraph"),
        duration: t("maniaAnalyser.duration"),
        estimatedDifficulty: t("maniaAnalyser.difficultyLabel"),
        generatedBy: t("maniaAnalyser.exportGeneratedBy"),
        lnRatio: t("maniaAnalyser.lnRatio"),
        mappedBy: t("maniaAnalyser.mappedByShort"),
        msd: "MSD",
        od: t("maniaAnalyser.odOverride"),
        patternSummary: t("maniaAnalyser.patternSummary"),
        rate: t("maniaAnalyser.speedRate"),
        reworkStar: t("maniaAnalyser.reworkStar"),
        lnToRice: t("maniaAnalyser.conversionHo"),
        riceToLn: t("maniaAnalyser.conversionIn"),
        skillLabels: Object.fromEntries(ETTERNA_SKILLS.map((skill) => [skill, t(`maniaAnalyser.etternaSkills.${skill}`)])) as Record<ManiaEtternaSkill, string>,
        unknown: t("maniaAnalyser.unknown"),
      }
      await downloadManiaAnalysisImage({
        difficultyColor: getDifficultyColor(result.star),
        difficultyTextColor: getDifficultyTextColor(result.star),
        fallbackCoverUrl: deleteCoverUrl,
        labels,
        options: analysis.options,
        result,
        source: coverObjectUrl ? {
          ...source,
          beatmap: { ...map, coverUrl: coverObjectUrl },
        } : source,
      })
      toast.success(t("maniaAnalyser.exportSuccess"))
    } catch (error) {
      toast.error(t("maniaAnalyser.exportFailed"), { description: getErrorMessage(error) })
    } finally {
      if (coverObjectUrl) URL.revokeObjectURL(coverObjectUrl)
      setIsExporting(false)
    }
  }

  return (
    <section className="space-y-6">
      <form className="space-y-4 py-2" onSubmit={handleSubmit} ref={selectionFormRef}>
        <input accept=".osu,text/plain" className="hidden" onChange={handleLocalFileChange} ref={localFileInputRef} type="file" />
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
          <Field label={t("maniaAnalyser.beatmapId")}>
            <div
              className={cn(
                "rounded-xl transition-[background-color,box-shadow]",
                isDraggingLocalFile && "bg-primary/5 ring-2 ring-primary ring-offset-2 ring-offset-background",
              )}
              onDragEnter={handleLocalFileDragEnter}
              onDragLeave={handleLocalFileDragLeave}
              onDragOver={handleLocalFileDragOver}
              onDrop={handleLocalFileDrop}
            >
              <div className="flex gap-2">
                <Input
                  autoComplete="off"
                  inputMode={localFile ? undefined : "numeric"}
                  onChange={(event) => setBeatmapInput(event.target.value)}
                  placeholder={t(isDraggingLocalFile ? "maniaAnalyser.dropLocalFileActive" : "maniaAnalyser.beatmapPlaceholder")}
                  readOnly={Boolean(localFile)}
                  value={localFile?.name ?? beatmapInput}
                />
                <Button className="shrink-0" onClick={() => localFileInputRef.current?.click()} type="button" variant="outline">
                  <FileArrowUp className="size-4" />
                  <span className="hidden md:inline">{localFile ? t("maniaAnalyser.changeLocalFile") : t("maniaAnalyser.chooseLocalFile")}</span>
                </Button>
                {localFile ? (
                  <Button aria-label={t("maniaAnalyser.clearLocalFile")} className="shrink-0" onClick={clearLocalFile} size="icon" type="button" variant="ghost">
                    <X className="size-4" />
                  </Button>
                ) : null}
              </div>
            </div>
          </Field>
          <div className="flex w-full items-end sm:w-36">
            <Button className={cn("w-full", analysis && "min-w-0 flex-1 rounded-r-none px-2")} disabled={isAnalysing || isExporting} type="submit">
              {isAnalysing ? <CircleNotch className="size-4 animate-spin" /> : analysis ? null : <Sparkle className="size-4" weight="fill" />}
              {isAnalysing ? t("maniaAnalyser.analysing") : analysis ? t("maniaAnalyser.analyseShort") : t("maniaAnalyser.analyse")}
            </Button>
            {analysis ? (
              <Button aria-label={t("maniaAnalyser.exportImage")} className="min-w-0 flex-1 rounded-l-none border-l-0 px-2" disabled={isExporting} onClick={handleExport} type="button" variant="outline">
                {isExporting ? <CircleNotch className="size-4 animate-spin" /> : t("maniaAnalyser.exportImageShort")}
              </Button>
            ) : null}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-[minmax(12rem,1.4fr)_7rem_7rem_minmax(10rem,1fr)]">
          <Field label={t("maniaAnalyser.algorithm")}>
            <Select onValueChange={(value) => setAlgorithm(value as ManiaAnalyserAlgorithm)} value={algorithm}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MANIA_ANALYSER_ALGORITHMS.map((value) => (
                  <SelectItem key={value} value={value}>{t(`maniaAnalyser.algorithms.${value}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("maniaAnalyser.speedRate")}>
            <Input max="2" min="0.5" onChange={(event) => setSpeedRate(event.target.value)} step="0.05" type="number" value={speedRate} />
          </Field>
          <Field label={t("maniaAnalyser.odOverride")}>
            <Input max="10" min="0" onChange={(event) => setOdOverride(event.target.value)} placeholder={t("maniaAnalyser.odPlaceholder")} step="0.1" type="number" value={odOverride} />
          </Field>
          <Field label={t("maniaAnalyser.conversion")}>
            <Select onValueChange={(value) => setConversion(value === "none" ? "" : value as ManiaConversion)} value={conversion || "none"}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("maniaAnalyser.conversionNone")}</SelectItem>
                <SelectItem value="HO">{t("maniaAnalyser.conversionHo")}</SelectItem>
                <SelectItem value="IN">{t("maniaAnalyser.conversionIn")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </form>
      <div
        aria-hidden={!isSelectionDocked}
        className={cn(
          "pointer-events-none fixed inset-x-0 top-16 z-30 !mt-0 hidden -translate-y-3 opacity-0 transition-[opacity,transform] duration-200 motion-reduce:transition-none lg:block",
          isSelectionDocked && "pointer-events-auto translate-y-0 opacity-100",
        )}
        inert={!isSelectionDocked}
      >
        <div className="w-full bg-background/92 shadow-sm backdrop-blur-2xl supports-backdrop-filter:bg-background/82">
          <form
            className="mx-auto grid h-14 w-full max-w-7xl grid-cols-[minmax(12rem,1.8fr)_minmax(11rem,1fr)_7rem_7rem_minmax(9rem,1fr)_auto] items-center gap-2 px-6"
            onSubmit={handleSubmit}
          >
            <Input
              aria-label={t("maniaAnalyser.beatmapId")}
              autoComplete="off"
              className={cn("bg-background/70", isDraggingLocalFile && "bg-primary/5 ring-2 ring-primary")}
              inputMode={localFile ? undefined : "numeric"}
              onChange={(event) => setBeatmapInput(event.target.value)}
              onDragEnter={handleLocalFileDragEnter}
              onDragLeave={handleLocalFileDragLeave}
              onDragOver={handleLocalFileDragOver}
              onDrop={handleLocalFileDrop}
              placeholder={t(isDraggingLocalFile ? "maniaAnalyser.dropLocalFileActive" : "maniaAnalyser.beatmapPlaceholder")}
              readOnly={Boolean(localFile)}
              value={localFile?.name ?? beatmapInput}
            />
            <Select onValueChange={(value) => setAlgorithm(value as ManiaAnalyserAlgorithm)} value={algorithm}>
              <SelectTrigger aria-label={t("maniaAnalyser.algorithm")} className="w-full bg-background/70"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MANIA_ANALYSER_ALGORITHMS.map((value) => (
                  <SelectItem key={value} value={value}>{t(`maniaAnalyser.algorithms.${value}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex h-9 min-w-0 items-center rounded-xl border border-input bg-background/70 px-2.5 shadow-xs">
              <span className="shrink-0 text-[11px] text-muted-foreground">{t("maniaAnalyser.speedRate")}</span>
              <Input
                aria-label={t("maniaAnalyser.speedRate")}
                className="h-7 min-w-0 border-0 bg-transparent px-1.5 shadow-none focus-visible:ring-0"
                max="2"
                min="0.5"
                onChange={(event) => setSpeedRate(event.target.value)}
                step="0.05"
                type="number"
                value={speedRate}
              />
            </div>
            <div className="flex h-9 min-w-0 items-center rounded-xl border border-input bg-background/70 px-2.5 shadow-xs">
              <span className="shrink-0 text-[11px] text-muted-foreground">OD</span>
              <Input
                aria-label={t("maniaAnalyser.odOverride")}
                className="h-7 min-w-0 border-0 bg-transparent px-1.5 shadow-none focus-visible:ring-0"
                max="10"
                min="0"
                onChange={(event) => setOdOverride(event.target.value)}
                placeholder="—"
                step="0.1"
                type="number"
                value={odOverride}
              />
            </div>
            <Select onValueChange={(value) => setConversion(value === "none" ? "" : value as ManiaConversion)} value={conversion || "none"}>
              <SelectTrigger aria-label={t("maniaAnalyser.conversion")} className="w-full bg-background/70"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("maniaAnalyser.conversionNone")}</SelectItem>
                <SelectItem value="HO">{t("maniaAnalyser.conversionHo")}</SelectItem>
                <SelectItem value="IN">{t("maniaAnalyser.conversionIn")}</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex w-32 items-center">
              <Button className={cn("w-full", analysis && "min-w-0 flex-1 rounded-r-none px-2")} disabled={isAnalysing || isExporting} type="submit">
                {isAnalysing ? <CircleNotch className="size-4 animate-spin" /> : analysis ? null : <Sparkle className="size-4" weight="fill" />}
                {isAnalysing ? t("maniaAnalyser.analysing") : analysis ? t("maniaAnalyser.analyseShort") : t("maniaAnalyser.analyse")}
              </Button>
              {analysis ? (
                <Button aria-label={t("maniaAnalyser.exportImage")} className="min-w-0 flex-1 rounded-l-none border-l-0 px-2" disabled={isExporting} onClick={handleExport} type="button" variant="outline">
                  {isExporting ? <CircleNotch className="size-4 animate-spin" /> : t("maniaAnalyser.exportImageShort")}
                </Button>
              ) : null}
            </div>
          </form>
        </div>
      </div>

      {isAnalysing ? <AnalysisSkeleton /> : null}
      {analysis ? <AnalysisResultView analysis={analysis} /> : null}
      {analysis ? <AnalyserIdentity /> : null}
    </section>
  )
}

function AnalysisResultView({ analysis }: { analysis: CompletedAnalysis }) {
  const { t } = useTranslation()
  const { result, source } = analysis
  const map = source.beatmap
  const overallMsd = result.etterna.values.Overall
  const difficultyColor = getDifficultyColor(result.star)
  const difficultyTextColor = getDifficultyTextColor(result.star)
  const estimatedDifficulty = splitEstimatedDifficulty(result.estDiff)
  const graphData = useMemo(() => result.graph.map((point) => ({
    difficulty: Number(point.difficulty.toFixed(2)),
    time: point.time / 1000,
  })), [result.graph])

  return (
    <div className="space-y-10">
      <section className="relative min-h-[19rem] overflow-hidden rounded-xl bg-zinc-950 text-white shadow-sm">
        {map.coverUrl ? <img alt="" className="absolute inset-0 size-full object-cover" src={map.coverUrl} /> : null}
        <div className="absolute inset-0 bg-black/58" />
        <div className="relative grid min-h-[19rem] gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex min-w-0 flex-col">
            <div className="mt-auto min-w-0 pt-12">
              <p className="text-sm text-white/62">{map.artist || t("maniaAnalyser.unknown")}</p>
              <h2 className="mt-1 max-w-3xl font-heading text-2xl font-semibold leading-tight sm:text-3xl">{map.title || t("maniaAnalyser.unknown")}</h2>
              <p className="mt-1 text-sm text-white/68">{map.version || t("maniaAnalyser.unknown")}</p>
              <p className="mt-3 text-xs text-white/52">{t("maniaAnalyser.mappedBy", { name: map.creator || t("maniaAnalyser.unknown") })}</p>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-6">
            <div className="text-left lg:text-right">
              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <div className="flex items-center gap-2 rounded-full px-3.5 py-2" style={{ backgroundColor: difficultyColor, color: difficultyTextColor }}>
                  <span className="text-xs font-bold uppercase tracking-[0.1em] opacity-65">MSD</span>
                  <span className="font-heading text-xl font-bold tabular-nums">{overallMsd.toFixed(2)}</span>
                </div>
              </div>
              <p className="mt-4 text-sm font-medium tracking-wide text-white/62">{t("maniaAnalyser.difficultyLabel")}</p>
              <p className="mt-1 font-heading text-[clamp(1rem,5vw,1.5rem)] font-semibold leading-none">
                <span className="block whitespace-nowrap">{estimatedDifficulty.primary}</span>
                {estimatedDifficulty.secondary ? <span className="mt-1 block whitespace-nowrap text-[0.9em] text-white/88">{estimatedDifficulty.secondary}</span> : null}
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-1.5">
              <Metric icon={Pulse} label={t("maniaAnalyser.lnRatio")} value={`${(result.lnRatio * 100).toFixed(1)}%`} />
              <Metric icon={Sparkle} label={t("maniaAnalyser.reworkStar")} value={result.star.toFixed(2)} />
              <Metric icon={MusicNotes} label={t("maniaAnalyser.bpm")} value={map.bpm ? String(Math.round(map.bpm * analysis.options.speedRate)) : "—"} />
              <Metric icon={Timer} label={t("maniaAnalyser.duration")} value={formatDuration(map.totalLength, analysis.options.speedRate)} />
            </dl>
          </div>
        </div>
      </section>

      <AnalysisSummaries result={result} />

      <section>
        <div className="flex items-center gap-2">
          <ChartLineUp className="size-5 text-primary" weight="bold" />
          <h2 className="font-heading text-xl font-semibold">{t("maniaAnalyser.difficultyGraph")}</h2>
          <HelpTooltip label={t("maniaAnalyser.difficultyGraphDescription")} />
        </div>
        {graphData.length > 0 ? (
          <ChartContainer className="mt-5 h-64 w-full aspect-auto" config={chartConfig}>
            <AreaChart data={graphData} margin={{ bottom: 0, left: -18, right: 10, top: 10 }}>
              <defs>
                <linearGradient id="maniaDifficultyFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-difficulty)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--color-difficulty)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis axisLine={false} dataKey="time" minTickGap={32} tickFormatter={formatChartTime} tickLine={false} type="number" domain={["dataMin", "dataMax"]} />
              <YAxis axisLine={false} tickLine={false} width={42} />
              <ChartTooltip content={<ChartTooltipContent hideLabel formatter={(value, _name, item) => (
                <div className="flex min-w-36 items-center justify-between gap-4">
                  <span className="text-muted-foreground">{formatChartTime(Number(item.payload.time))}</span>
                  <span className="font-mono font-medium tabular-nums">{Number(value).toFixed(2)}</span>
                </div>
              )} />} />
              <Area dataKey="difficulty" fill="url(#maniaDifficultyFill)" stroke="var(--color-difficulty)" strokeWidth={2} type="monotone" />
            </AreaChart>
          </ChartContainer>
        ) : <p className="mt-5 py-10 text-center text-sm text-muted-foreground">{t("maniaAnalyser.noGraph")}</p>}
      </section>
    </div>
  )
}

function AnalyserIdentity() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4 pb-2 pt-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-medium text-primary">{t("maniaAnalyser.eyebrow")}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">{t("maniaAnalyser.title")}</h1>
          <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" variant="outline">{t("maniaAnalyser.beta")}</Badge>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                aria-label={t("maniaAnalyser.aboutTitle")}
                className="shrink-0 cursor-help text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                tabIndex={0}
              >
                <Question className="size-5" weight="bold" />
              </span>
            </TooltipTrigger>
              <TooltipContent className="block max-w-sm space-y-1.5 py-2.5 leading-relaxed" side="top" sideOffset={8}>
                <p className="font-medium">{t("maniaAnalyser.aboutTitle")}</p>
                <p>{t("maniaAnalyser.description")}</p>
                <p>{t("maniaAnalyser.engineNote")}</p>
              </TooltipContent>
          </Tooltip>
        </div>
      </div>
      <a className="mb-1 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline" href="https://github.com/LeoBlackMT/osumania_map_analyser" rel="noreferrer" target="_blank">
        <GithubLogo className="size-4" weight="fill" />
        {t("maniaAnalyser.sourceShort")}
      </a>
    </div>
  )
}

const ETTERNA_SKILLS: ManiaEtternaSkill[] = [
  "Stream",
  "Jumpstream",
  "Handstream",
  "Stamina",
  "JackSpeed",
  "Chordjack",
  "Technical",
]

function AnalysisSummaries({ result }: { result: ManiaAnalysisResult }) {
  const { t } = useTranslation()
  const isNarrowScreen = useMediaQuery("(max-width: 639px)")
  const pattern = result.pattern
  const distribution = useMemo(() => buildPatternDistribution(pattern?.topClusters ?? []), [pattern])
  const chartData = useMemo(() => ETTERNA_SKILLS.map((skill) => ({
    label: t(`maniaAnalyser.etternaSkills.${skill}`),
    value: Number(result.etterna.values[skill].toFixed(2)),
  })), [result.etterna.values, t])
  const chartMaximum = useMemo(
    () => Math.max(1, Math.ceil(Math.max(...chartData.map((item) => item.value)) * 1.12)),
    [chartData],
  )
  return (
    <section className="grid gap-6 lg:grid-cols-2 lg:gap-4">
      <article className="min-w-0 overflow-hidden">
        <div className="flex min-h-7 min-w-0 flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Pulse className="size-5 text-primary" weight="bold" />
            <h2 className="font-heading text-xl font-semibold">{t("maniaAnalyser.etternaMsd")}</h2>
            <HelpTooltip label={t("maniaAnalyser.etternaMsdDescription")} />
          </div>
          {result.isVibro ? <Badge className="border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300" variant="outline">Vibro</Badge> : null}
        </div>

        <div className="mt-1 h-[18rem] overflow-hidden sm:h-[23rem]">
          <ChartContainer className="mx-auto h-[18rem] w-full max-w-2xl aspect-auto sm:h-[23rem]" config={etternaChartConfig} initialDimension={isNarrowScreen ? { height: 288, width: 320 } : { height: 368, width: 560 }}>
              <RadarChart data={chartData} margin={isNarrowScreen ? { bottom: 6, left: 16, right: 16, top: 8 } : { bottom: 8, left: 24, right: 24, top: 12 }} outerRadius={isNarrowScreen ? "78%" : "90%"}>
                <ChartTooltip content={<ChartTooltipContent hideIndicator hideLabel formatter={(value, _name, item) => (
                  <div className="flex min-w-36 items-center justify-between gap-4">
                    <span className="text-muted-foreground">{String(item.payload.label)}</span>
                    <span className="font-mono font-medium tabular-nums">{Number(value).toFixed(2)}</span>
                  </div>
                )} />} />
                <PolarGrid gridType="polygon" />
                <PolarAngleAxis dataKey="label" tick={(props) => <EtternaAxisTick {...props} data={chartData} />} />
                <PolarRadiusAxis axisLine={false} domain={[0, chartMaximum]} tick={false} />
                <Radar dataKey="value" dot={{ fill: "var(--color-value)", r: 3 }} fill="var(--color-value)" fillOpacity={0.2} stroke="var(--color-value)" strokeWidth={2} />
              </RadarChart>
          </ChartContainer>
        </div>
      </article>

      <article className="min-w-0 overflow-hidden">
        <div className="flex min-h-7 min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Pulse className="size-5 text-primary" weight="bold" />
            <h2 className="font-heading text-xl font-semibold">{t("maniaAnalyser.patternSummary")}</h2>
            <HelpTooltip label={t("maniaAnalyser.patternSummaryDescription")} />
          </div>
          {pattern && pattern.svAmount > 0 ? <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" variant="outline">{t("maniaAnalyser.svDetected")}</Badge> : null}
        </div>

        <div className="mt-1 h-[18rem] overflow-hidden sm:h-[23rem]">
          {distribution.length ? (
              <div className="relative mx-auto h-[18rem] w-full max-w-xl sm:h-[23rem]">
                <ChartContainer className="size-full aspect-auto" config={patternChartConfig} initialDimension={isNarrowScreen ? { height: 288, width: 320 } : { height: 368, width: 520 }}>
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideIndicator hideLabel formatter={(_value, _name, item) => (
                      <div className="flex min-w-40 items-center justify-between gap-4">
                        <span className="text-muted-foreground">{String(item.payload.name)}</span>
                        <span className="font-mono font-medium tabular-nums">{Number(item.payload.percent).toFixed(1)}%</span>
                      </div>
                    )} />} />
                    <Pie
                      data={distribution}
                      dataKey="amount"
                      innerRadius={isNarrowScreen ? 72 : 98}
                      label={PatternPieLabel}
                      labelLine={{ stroke: "var(--border)", strokeWidth: 1 }}
                      nameKey="name"
                      outerRadius={isNarrowScreen ? 105 : 140}
                      paddingAngle={0}
                      stroke="transparent"
                    >
                      {distribution.map((item) => <Cell fill={item.fill} key={item.name} />)}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{pattern?.modeTag}</span>
                  <span className="mt-1 font-heading text-lg font-semibold">{pattern?.category}</span>
                </div>
              </div>
          ) : <p className="py-10 text-center text-sm text-muted-foreground">{t("maniaAnalyser.noPatterns")}</p>}
        </div>
      </article>
    </section>
  )
}

type RadarAxisTickProps = {
  cx?: number | string
  cy?: number | string
  payload?: { index?: number; value?: string }
  x?: number | string
  y?: number | string
}

function PatternPieLabel({ cx = 0, cy = 0, midAngle = 0, name, outerRadius = 0 }: PieLabelRenderProps) {
  const centerX = Number(cx)
  const radius = Number(outerRadius) + 20
  const x = centerX + radius * Math.cos(-Number(midAngle) * Math.PI / 180)
  const y = Number(cy) + radius * Math.sin(-Number(midAngle) * Math.PI / 180)

  return (
    <text className="fill-muted-foreground text-[13px] font-medium" dominantBaseline="central" textAnchor={x > centerX ? "start" : "end"} x={x} y={y}>
      {String(name ?? "")}
    </text>
  )
}

function EtternaAxisTick({ cx = 0, cy = 0, data, payload, x = 0, y = 0 }: RadarAxisTickProps & { data: Array<{ label: string; value: number }> }) {
  const itemIndex = payload?.index ?? -1
  const item = data[itemIndex]
  const numericX = Number(x)
  const numericY = Number(y)
  const numericCenterX = Number(cx)
  const numericCenterY = Number(cy)
  const isSideLabel = itemIndex === 2 || itemIndex === 5
  const labelRadiusFactor = itemIndex === 0 ? 1.06 : isSideLabel ? 0.975 : 1.015
  const tickX = numericCenterX + (numericX - numericCenterX) * labelRadiusFactor
  const tickY = numericCenterY + (numericY - numericCenterY) * labelRadiusFactor
  const textAnchor = tickX < numericCenterX - 6 ? "end" : tickX > numericCenterX + 6 ? "start" : "middle"

  return (
    <text className="fill-muted-foreground text-[13px]" textAnchor={textAnchor} x={tickX} y={tickY}>
      <tspan x={tickX}>{payload?.value}</tspan>
      {item ? <tspan className="fill-foreground font-mono font-semibold tabular-nums" dy="14" x={tickX}>{item.value.toFixed(2)}</tspan> : null}
    </text>
  )
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    const updateMatches = () => setMatches(mediaQuery.matches)
    mediaQuery.addEventListener("change", updateMatches)
    updateMatches()
    return () => mediaQuery.removeEventListener("change", updateMatches)
  }, [query])

  return matches
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function HelpTooltip({ label }: { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span aria-label={label} className="cursor-help text-muted-foreground transition-colors hover:text-foreground" tabIndex={0}>
          <Question className="size-4" weight="bold" />
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs leading-relaxed" side="bottom" sideOffset={6}>{label}</TooltipContent>
    </Tooltip>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof Pulse; label: string; value: string }) {
  return (
    <div className="rounded bg-black/45 px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <dt className="inline-flex min-w-0 items-center gap-1.5 truncate text-xs text-white/72">
          <Icon className="size-3.5 shrink-0" weight="bold" />
          {label}
        </dt>
        <dd className="shrink-0 text-xs font-semibold tabular-nums">{value}</dd>
      </div>
    </div>
  )
}

function AnalysisSkeleton() {
  return (
    <div aria-busy="true">
      <Skeleton className="h-[19rem] rounded-xl" />
    </div>
  )
}

function parseBeatmapId(value: string) {
  const normalized = value.trim()
  if (/^\d+$/.test(normalized)) return Number(normalized)
  const hashMatch = normalized.match(/#(?:mania|\w+)\/(\d+)/i)
  if (hashMatch) return Number(hashMatch[1])
  const pathMatch = normalized.match(/\/(?:beatmaps|b)\/(\d+)/i)
  return pathMatch ? Number(pathMatch[1]) : null
}

function hasDraggedFiles(event: DragEvent<HTMLElement>) {
  return Array.from(event.dataTransfer.types).includes("Files")
}

function getAnalysisErrorDescription(error: unknown, t: TFunction) {
  if (error instanceof LocalBeatmapError) {
    return error.code === "file-too-large"
      ? t("maniaAnalyser.localFileTooLarge")
      : t("maniaAnalyser.invalidLocalFile")
  }
  if (error instanceof ApiError) {
    if (error.status === 404) return t("maniaAnalyser.beatmapNotFound")
    if (error.status === 413) return t("maniaAnalyser.beatmapTooLarge")
    if (error.status === 422) return error.message || t("maniaAnalyser.notMania")
    if (error.status === 429) return t("maniaAnalyser.rateLimited")
    if (error.status === 503) return t("maniaAnalyser.serviceUnavailable")
    if (error.status === 504) return t("maniaAnalyser.upstreamTimeout")
  }
  return getErrorMessage(error)
}

type PatternCluster = NonNullable<ManiaAnalysisResult["pattern"]>["topClusters"][number]

function buildPatternDistribution(clusters: PatternCluster[]) {
  const grouped = new Map<string, { amount: number; bpmTotal: number; name: string; pattern: string }>()
  for (const cluster of clusters) {
    if (!Number.isFinite(cluster.amount) || cluster.amount <= 0) continue
    const current = grouped.get(cluster.name)
    if (current) {
      current.amount += cluster.amount
      current.bpmTotal += cluster.bpm * cluster.amount
    } else {
      grouped.set(cluster.name, {
        amount: cluster.amount,
        bpmTotal: cluster.bpm * cluster.amount,
        name: cluster.name,
        pattern: cluster.pattern,
      })
    }
  }

  const items = [...grouped.values()].sort((a, b) => b.amount - a.amount)
  const total = items.reduce((sum, item) => sum + item.amount, 0)
  return items.map((item, index) => ({
    amount: item.amount,
    bpm: item.amount > 0 ? item.bpmTotal / item.amount : 0,
    fill: patternChartColors[index % patternChartColors.length],
    name: item.name,
    pattern: item.pattern,
    percent: total > 0 ? (item.amount / total) * 100 : 0,
  }))
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, value))
}

function formatDuration(seconds: number | null, rate: number) {
  if (!seconds) return "—"
  const adjusted = Math.round(seconds / rate)
  return `${Math.floor(adjusted / 60)}:${String(adjusted % 60).padStart(2, "0")}`
}

function formatChartTime(seconds: number) {
  const rounded = Math.max(0, Math.round(seconds))
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}`
}

function splitEstimatedDifficulty(value: string) {
  const [primary, ...secondaryParts] = value.split(/\s*\|\|\s*/)
  return {
    primary,
    secondary: secondaryParts.join(" ").trim() || null,
  }
}
