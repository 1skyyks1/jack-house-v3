import {
  CheckSquare,
  DownloadSimple,
  FolderOpen,
  GithubLogo,
  MagnifyingGlass,
  Package,
  Question,
  X,
} from "@phosphor-icons/react"
import { useMemo, useRef, useState, type ChangeEvent } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import deleteAudioUrl from "@/assets/mappack/delete.mp3?url"
import deleteBackgroundUrl from "@/assets/mappack/delete.jpg?url"
import deleteTemplateUrl from "@/assets/mappack/delete.osu?url"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  buildMappack,
  createDefaultEdit,
  downloadBlob,
  formatBytes,
  scanBeatmaps,
  type BeatmapEdit,
  type LocalBeatmap,
  type PackBuildResult,
} from "@/features/mappack-creator/model/mappack"
import { ToolsBreadcrumb } from "../_shared/ToolsBreadcrumb"

const pageSize = 50

type ProgressState = {
  current: number
  label: string
  total: number
}

export function MappackCreatorPage() {
  const { t } = useTranslation()
  const folderInputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [beatmaps, setBeatmaps] = useState<LocalBeatmap[]>([])
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [edits, setEdits] = useState<Record<string, BeatmapEdit>>({})
  const [keyword, setKeyword] = useState("")
  const [page, setPage] = useState(0)
  const [packTitle, setPackTitle] = useState("")
  const [packArtist, setPackArtist] = useState("")
  const [packCreator, setPackCreator] = useState("")
  const [includeDelete, setIncludeDelete] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [isBuilding, setIsBuilding] = useState(false)
  const [progress, setProgress] = useState<ProgressState | null>(null)
  const [result, setResult] = useState<PackBuildResult | null>(null)

  const selectedBeatmaps = useMemo(
    () => beatmaps.filter((beatmap) => selectedKeys.has(beatmap.key)),
    [beatmaps, selectedKeys],
  )
  const filteredBeatmaps = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()
    if (!normalizedKeyword) return beatmaps
    return beatmaps.filter((beatmap) => [
      beatmap.relativePath,
      beatmap.metadata.artist,
      beatmap.metadata.title,
      beatmap.metadata.creator,
      beatmap.metadata.version,
    ].some((value) => value.toLowerCase().includes(normalizedKeyword)))
  }, [beatmaps, keyword])
  const totalPages = Math.ceil(filteredBeatmaps.length / pageSize)
  const visibleBeatmaps = filteredBeatmaps.slice(page * pageSize, (page + 1) * pageSize)
  const folderName = getFolderName(files)
  const progressPercent = progress?.total ? Math.round((progress.current / progress.total) * 100) : 0

  const handleFolderChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? [])
    if (nextFiles.length === 0) return

    setResult(null)
    setFiles(nextFiles)
    setBeatmaps([])
    setSelectedKeys(new Set())
    setEdits({})
    setKeyword("")
    setPage(0)
    setIsScanning(true)
    setProgress({ current: 0, label: t("mappackCreator.scanning"), total: 1 })

    try {
      const scanned = await scanBeatmaps(nextFiles, (current, total) => {
        setProgress({ current, label: t("mappackCreator.scanProgress", { current, total }), total })
      })
      const nextEdits = Object.fromEntries(scanned.map((beatmap) => [beatmap.key, createDefaultEdit(beatmap.metadata)]))
      setBeatmaps(scanned)
      setEdits(nextEdits)
      if (scanned.length === 0) toast.error(t("mappackCreator.noBeatmaps"))
    } catch (scanError) {
      toast.error(t("mappackCreator.errorTitle"), {
        description: getMessage(scanError, t("mappackCreator.scanFailed")),
      })
    } finally {
      setIsScanning(false)
      setProgress(null)
      event.target.value = ""
    }
  }

  const toggleBeatmap = (key: string) => {
    setSelectedKeys((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
    setResult(null)
  }

  const selectVisible = () => {
    setSelectedKeys((current) => new Set([...current, ...visibleBeatmaps.map((beatmap) => beatmap.key)]))
  }

  const updateEdit = (key: string, field: keyof BeatmapEdit, value: string | number) => {
    setEdits((current) => ({
      ...current,
      [key]: {
        ...(current[key] ?? createDefaultEdit(beatmaps.find((beatmap) => beatmap.key === key)?.metadata ?? emptyMetadata)),
        [field]: value,
      },
    }))
  }

  const handleBuild = async () => {
    if (!packTitle.trim() || !packArtist.trim() || !packCreator.trim()) {
      toast.error(t("mappackCreator.requiredFields"))
      return
    }
    if (selectedBeatmaps.length === 0) {
      toast.error(t("mappackCreator.selectAtLeastOne"))
      return
    }

    setResult(null)
    setIsBuilding(true)
    setProgress({ current: 0, label: t("mappackCreator.preparing"), total: selectedBeatmaps.length })

    try {
      const deleteAssets = includeDelete ? await loadDeleteAssets() : undefined
      const nextResult = await buildMappack({
        artist: packArtist,
        beatmaps: selectedBeatmaps,
        creator: packCreator,
        deleteAssets,
        edits,
        files,
        onProgress: (current, total, label) => setProgress({ current, label, total }),
        title: packTitle,
      })
      downloadBlob(nextResult.blob, nextResult.filename)
      setResult(nextResult)
      toast.success(t("mappackCreator.downloadStarted"))
    } catch (buildError) {
      toast.error(t("mappackCreator.errorTitle"), {
        description: getMessage(buildError, t("mappackCreator.buildFailed")),
      })
    } finally {
      setIsBuilding(false)
      setProgress(null)
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToolsBreadcrumb current={t("mappackCreator.title")} />
        <a className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline" href="https://github.com/1skyyks1/osu-mappack-creator-v2" rel="noreferrer" target="_blank">
          <GithubLogo className="size-4" weight="fill" />
          {t("mappackCreator.sourceLink")}
        </a>
      </div>
      <input
        {...({ directory: "", webkitdirectory: "" } as Record<string, string>)}
        className="hidden"
        multiple
        onChange={handleFolderChange}
        ref={folderInputRef}
        type="file"
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">{t("mappackCreator.eyebrow")}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("mappackCreator.title")}
            </h1>
            <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" variant="outline">
              {t("mappackCreator.beta")}
            </Badge>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  aria-label={t("mappackCreator.privacyTitle")}
                  className="shrink-0 cursor-help text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  tabIndex={0}
                >
                  <Question className="size-5" weight="bold" />
                </span>
              </TooltipTrigger>
              <TooltipContent className="block max-w-sm space-y-1.5 py-2.5 leading-relaxed" side="bottom" sideOffset={8}>
                <p className="font-medium">{t("mappackCreator.privacyTitle")}</p>
                <p>{t("mappackCreator.description")}</p>
                <p>{t("mappackCreator.privacyDescription")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        <Button disabled={isScanning || isBuilding} onClick={() => folderInputRef.current?.click()} type="button">
          <FolderOpen className="size-4" weight="bold" />
          {folderName ? t("mappackCreator.changeFolder") : t("mappackCreator.selectFolder")}
        </Button>
      </div>

      {progress ? <ProgressPanel percent={progressPercent} label={progress.label} /> : null}
      {result ? <ResultPanel result={result} /> : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-6">
        <div className="min-w-0 space-y-8">
          <div>
            {folderName ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {t("mappackCreator.librarySummary", { count: beatmaps.length, folder: folderName })}
                </p>
                {beatmaps.length > 0 ? (
                  <div className="flex gap-2">
                    <Button onClick={selectVisible} size="sm" type="button" variant="outline">
                      <CheckSquare className="size-4" />
                      {t("mappackCreator.selectPage")}
                    </Button>
                    <Button onClick={() => setSelectedKeys(new Set())} size="sm" type="button" variant="ghost">
                      {t("mappackCreator.clear")}
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {beatmaps.length > 0 ? (
              <>
                <div className="mt-4">
                  <div className="relative">
                    <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      onChange={(event) => {
                        setKeyword(event.target.value)
                        setPage(0)
                      }}
                      placeholder={t("mappackCreator.searchPlaceholder")}
                      value={keyword}
                    />
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  {visibleBeatmaps.map((beatmap) => (
                    <BeatmapRow
                      beatmap={beatmap}
                      checked={selectedKeys.has(beatmap.key)}
                      key={beatmap.key}
                      onToggle={() => toggleBeatmap(beatmap.key)}
                    />
                  ))}
                  {visibleBeatmaps.length === 0 ? (
                    <p className="p-8 text-center text-sm text-muted-foreground">{t("mappackCreator.noSearchResults")}</p>
                  ) : null}
                </div>
                {totalPages > 1 ? (
                  <div className="mt-4 flex items-center justify-between">
                    <Button disabled={page === 0} onClick={() => setPage((value) => value - 1)} size="sm" type="button" variant="outline">
                      {t("mappackCreator.previous")}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {t("common.pageStatus", { page: page + 1, total: totalPages })}
                    </span>
                    <Button disabled={page >= totalPages - 1} onClick={() => setPage((value) => value + 1)} size="sm" type="button" variant="outline">
                      {t("mappackCreator.next")}
                    </Button>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="grid min-h-64 place-items-center py-8 text-center">
                <div>
                  <FolderOpen className="mx-auto size-10 text-muted-foreground" />
                  <p className="mt-3 font-medium">{t("mappackCreator.emptyTitle")}</p>
                </div>
              </div>
            )}
          </div>

          {selectedBeatmaps.length > 0 ? (
            <div className="border-t pt-8">
              <div>
                <h2 className="font-heading text-xl font-semibold">{t("mappackCreator.beatmapSettings")}</h2>
                <p className="text-sm text-muted-foreground">{t("mappackCreator.beatmapSettingsDescription")}</p>
              </div>
              <div className="mt-5 space-y-5">
                {selectedBeatmaps.map((beatmap) => {
                  const edit = edits[beatmap.key] ?? createDefaultEdit(beatmap.metadata)
                  return (
                    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_5.5rem_5.5rem_auto]" key={beatmap.key}>
                      <div className="min-w-0">
                        <Label htmlFor={`version-${beatmap.key}`}>{t("mappackCreator.version")}</Label>
                        <Input
                          className="mt-1"
                          id={`version-${beatmap.key}`}
                          onChange={(event) => updateEdit(beatmap.key, "version", event.target.value)}
                          value={edit.version}
                        />
                        <p className="mt-1 truncate text-xs text-muted-foreground" title={beatmap.relativePath}>{beatmap.relativePath}</p>
                      </div>
                      <NumberField label="HP" onChange={(value) => updateEdit(beatmap.key, "hpDrainRate", value)} value={edit.hpDrainRate} />
                      <NumberField label="OD" onChange={(value) => updateEdit(beatmap.key, "overallDifficulty", value)} value={edit.overallDifficulty} />
                      <Button className="self-end" onClick={() => toggleBeatmap(beatmap.key)} size="icon" type="button" variant="ghost">
                        <X className="size-4" />
                        <span className="sr-only">{t("mappackCreator.remove")}</span>
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>

        <aside className="h-fit space-y-4 border-t pt-6 lg:sticky lg:top-20 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div>
            <div className="flex items-center gap-2">
              <Package className="size-5 text-primary" weight="bold" />
              <h2 className="font-heading text-xl font-semibold">{t("mappackCreator.packSettings")}</h2>
            </div>
          </div>

          <TextField label={t("mappackCreator.packTitle")} onChange={setPackTitle} value={packTitle} />
          <TextField label={t("mappackCreator.packArtist")} onChange={setPackArtist} value={packArtist} />
          <TextField label={t("mappackCreator.packCreator")} onChange={setPackCreator} value={packCreator} />

          <label className="flex cursor-pointer items-center gap-3 py-1">
            <Checkbox checked={includeDelete} onCheckedChange={(checked) => setIncludeDelete(checked === true)} />
            <span className="text-sm font-medium">{t("mappackCreator.includeDelete")}</span>
          </label>

          <Button className="w-full" disabled={isScanning || isBuilding} onClick={handleBuild} type="button">
            <DownloadSimple className="size-4" weight="bold" />
            {isBuilding ? t("mappackCreator.building") : t("mappackCreator.build")}
          </Button>
        </aside>
      </div>
    </section>
  )
}

function BeatmapRow({ beatmap, checked, onToggle }: { beatmap: LocalBeatmap; checked: boolean; onToggle: () => void }) {
  return (
    <label className="-mx-2 flex cursor-pointer items-start gap-3 px-2 py-3 transition hover:bg-muted/45">
      <Checkbox checked={checked} onCheckedChange={onToggle} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          {beatmap.metadata.artist || "Unknown"} — {beatmap.metadata.title || beatmap.file.name}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          [{beatmap.metadata.version || "Unnamed"}] · {beatmap.metadata.creator || "Unknown"}
        </span>
        <span className="mt-1 block truncate text-xs text-muted-foreground/75" title={beatmap.relativePath}>{beatmap.relativePath}</span>
      </span>
      <span className="shrink-0 text-xs text-muted-foreground">{formatBytes(beatmap.file.size)}</span>
    </label>
  )
}

function TextField({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  const id = `mappack-${label}`
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input className="mt-1" id={id} onChange={(event) => onChange(event.target.value)} value={value} />
    </div>
  )
}

function NumberField({ label, onChange, value }: { label: string; onChange: (value: number) => void; value: number }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input className="mt-1" max="10" min="0" onChange={(event) => onChange(Number(event.target.value))} step="0.1" type="number" value={value} />
    </div>
  )
}

function ProgressPanel({ label, percent }: { label: string; percent: number }) {
  return (
    <div className="border-t pt-3">
      <div className="mb-2 flex items-center justify-between gap-4 text-sm">
        <span className="truncate">{label}</span>
        <span className="font-medium">{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

function ResultPanel({ result }: { result: PackBuildResult }) {
  const { t } = useTranslation()
  return (
    <Alert>
      <DownloadSimple />
      <AlertTitle>{t("mappackCreator.completeTitle")}</AlertTitle>
      <AlertDescription>
        {t("mappackCreator.completeDescription", { name: result.filename })}
        {result.missingAssets.length > 0 ? (
          <span className="mt-1 block text-amber-700 dark:text-amber-400">
            {t("mappackCreator.missingAssets", { count: result.missingAssets.length })}
          </span>
        ) : null}
      </AlertDescription>
    </Alert>
  )
}

async function loadDeleteAssets() {
  const [audioResponse, backgroundResponse, templateResponse] = await Promise.all([
    fetch(deleteAudioUrl),
    fetch(deleteBackgroundUrl),
    fetch(deleteTemplateUrl),
  ])
  if (!audioResponse.ok || !backgroundResponse.ok || !templateResponse.ok) {
    throw new Error("Failed to load bundled delete files.")
  }
  return {
    audio: new Uint8Array(await audioResponse.arrayBuffer()),
    background: new Uint8Array(await backgroundResponse.arrayBuffer()),
    template: await templateResponse.text(),
  }
}

function getFolderName(files: File[]) {
  const path = files[0]?.webkitRelativePath
  return path ? path.split("/")[0] : ""
}

function getMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

const emptyMetadata = {
  artist: "",
  audioFilename: "",
  backgroundFilename: "",
  creator: "",
  hpDrainRate: 5,
  overallDifficulty: 5,
  title: "",
  version: "",
}
