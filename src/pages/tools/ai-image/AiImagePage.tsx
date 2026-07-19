import {
  ArrowCounterClockwise,
  CircleNotch,
  ClockCountdown,
  DownloadSimple,
  Eye,
  FileArrowUp,
  ImagesSquare,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  Sparkle,
  WarningCircle,
  X,
} from "@phosphor-icons/react"
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent, type WheelEvent } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  getAiImageConfig,
  getAiImageResult,
  listAiImageJobs,
  submitAiImage,
  type AiImageConfig,
  type AiImageJob,
  type AiImageJobStatus,
  type AiImageRequestType,
} from "@/features/ai-image"
import { ApiError } from "@/shared/api/errors"
import { ToolsBreadcrumb } from "../_shared/ToolsBreadcrumb"

const ACTIVE_STATUSES = new Set<AiImageJobStatus>(["submitting", "pending", "running"])

export function AiImagePage() {
  const { i18n, t } = useTranslation()
  const refreshInFlightRef = useRef(false)
  const [requestKey, setRequestKey] = useState(createRequestKey)
  const [config, setConfig] = useState<AiImageConfig | null>(null)
  const [jobs, setJobs] = useState<AiImageJob[]>([])
  const [requestType, setRequestType] = useState<AiImageRequestType>("generation")
  const [prompt, setPrompt] = useState("")
  const [size, setSize] = useState("")
  const [images, setImages] = useState<File[]>([])
  const [mask, setMask] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const activeJob = useMemo(
    () => {
      const activeFromHistory = jobs.find((job) => ACTIVE_STATUSES.has(job.status))
      if (activeFromHistory) return activeFromHistory
      if (config?.activeJob && jobs.some((job) => job.id === config.activeJob?.id)) return null
      return config?.activeJob ?? null
    },
    [config?.activeJob, jobs],
  )

  const refresh = useCallback(async (silent = false) => {
    if (refreshInFlightRef.current) return
    refreshInFlightRef.current = true
    try {
      const [nextConfig, history] = await Promise.all([
        getAiImageConfig(),
        listAiImageJobs(1, 30),
      ])
      setConfig(nextConfig)
      setJobs(history.data)
      setSize((current) => current || nextConfig.allowedSizes[0] || "1024x1024")
    } catch (error) {
      if (!silent) toast.error(getErrorMessage(error, t("aiImage.loadFailed")))
    } finally {
      refreshInFlightRef.current = false
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0)
    return () => window.clearTimeout(timer)
  }, [refresh])

  useEffect(() => {
    if (!activeJob) return
    const timer = window.setInterval(() => void refresh(true), 3000)
    return () => window.clearInterval(timer)
  }, [activeJob, refresh])

  const changeRequestType = (value: string) => {
    const nextType = value as AiImageRequestType
    setRequestType(nextType)
    if (nextType === "generation") {
      setImages([])
      setMask(null)
    }
  }

  const handleImages = (files: FileList | null) => {
    if (!files) return
    const maxReferences = config?.maxReferences ?? 10
    const next = Array.from(files).slice(0, maxReferences)
    if (files.length > maxReferences) toast.error(t("aiImage.tooManyReferences", { count: maxReferences }))
    setImages(next)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!prompt.trim()) {
      toast.error(t("aiImage.promptRequired"))
      return
    }
    if (requestType === "edit" && images.length === 0) {
      toast.error(t("aiImage.referencesRequired"))
      return
    }

    setIsSubmitting(true)
    try {
      await submitAiImage({
        idempotencyKey: requestKey,
        requestType,
        prompt: prompt.trim(),
        size: size || config?.allowedSizes[0] || "1024x1024",
        images,
        mask,
      })
      setRequestKey(createRequestKey())
      setImages([])
      setMask(null)
      toast.success(t("aiImage.submitted"))
      await refresh(true)
    } catch (error) {
      if (!(error instanceof ApiError) || error.kind !== "network") setRequestKey(createRequestKey())
      toast.error(t("aiImage.submitFailed"), { description: getErrorMessage(error, t("common.requestFailed")) })
      await refresh(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const quotaExhausted = config?.quota.remaining === 0
  const submitDisabled = isSubmitting || Boolean(activeJob) || quotaExhausted || isLoading

  return (
    <section className="space-y-6">
      <ToolsBreadcrumb current={t("aiImage.title")} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <Card>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label>{t("aiImage.mode")}</Label>
                <Tabs onValueChange={changeRequestType} value={requestType}>
                  <TabsList className="grid w-full grid-cols-2 sm:w-96">
                    <TabsTrigger value="generation"><Sparkle />{t("aiImage.textMode")}</TabsTrigger>
                    <TabsTrigger value="edit"><ImagesSquare />{t("aiImage.referenceMode")}</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-image-prompt">{t("aiImage.prompt")}</Label>
                <Textarea
                  className="min-h-36 resize-y"
                  disabled={submitDisabled}
                  id="ai-image-prompt"
                  maxLength={config?.maxPromptLength ?? 8000}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder={requestType === "edit" ? t("aiImage.editPromptPlaceholder") : t("aiImage.promptPlaceholder")}
                  value={prompt}
                />
                <p className="text-right text-xs text-muted-foreground">{prompt.length}/{config?.maxPromptLength ?? 8000}</p>
              </div>

              {requestType === "edit" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FilePicker
                    accept="image/jpeg,image/png,image/webp"
                    files={images}
                    label={t("aiImage.references")}
                    multiple
                    onChange={handleImages}
                    onRemove={(index) => setImages((current) => current.filter((_file, itemIndex) => itemIndex !== index))}
                    optional={false}
                  />
                  <FilePicker
                    accept="image/png,image/webp"
                    files={mask ? [mask] : []}
                    label={t("aiImage.mask")}
                    onChange={(files) => setMask(files?.[0] ?? null)}
                    onRemove={() => setMask(null)}
                    optional
                  />
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-[14rem_1fr] sm:items-end">
                <div className="space-y-2">
                  <Label>{t("aiImage.size")}</Label>
                  <Select disabled={submitDisabled} onValueChange={setSize} value={size}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(config?.allowedSizes ?? ["1024x1024"]).map((item) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full sm:justify-self-end sm:w-auto" disabled={submitDisabled} size="lg" type="submit">
                  {isSubmitting || activeJob ? <CircleNotch className="animate-spin" /> : <Sparkle weight="fill" />}
                  {activeJob ? t("aiImage.inProgress") : isSubmitting ? t("aiImage.submitting") : t("aiImage.generate")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <Card size="sm">
            <CardHeader>
              <CardTitle>{t("aiImage.quotaTitle")}</CardTitle>
              <CardDescription>{t("aiImage.quotaDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-4">
                <span className="text-muted-foreground">{t("aiImage.usedToday")}</span>
                <strong className="font-heading text-2xl">
                  {config?.quota.used ?? "–"}/{config?.quota.limit ?? "∞"}
                </strong>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <ClockCountdown />
            <AlertTitle>{t("aiImage.temporaryTitle")}</AlertTitle>
            <AlertDescription>{t("aiImage.temporaryDescription")}</AlertDescription>
          </Alert>

          {quotaExhausted ? (
            <Alert variant="destructive">
              <WarningCircle />
              <AlertTitle>{t("aiImage.quotaExhausted")}</AlertTitle>
              <AlertDescription>{t("aiImage.quotaReset")}</AlertDescription>
            </Alert>
          ) : null}
        </aside>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-heading text-2xl font-semibold">{t("aiImage.historyTitle")}</h2>
          <Button disabled={isLoading} onClick={() => void refresh()} size="sm" variant="outline">
            {isLoading ? <CircleNotch className="animate-spin" /> : null}
            {t("aiImage.refresh")}
          </Button>
        </div>

        {jobs.length === 0 && !isLoading ? (
          <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">{t("aiImage.empty")}</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job) => <JobCard key={job.id} job={job} locale={i18n.language} />)}
          </div>
        )}
      </section>
    </section>
  )
}

type FilePickerProps = {
  accept: string
  files: File[]
  label: string
  multiple?: boolean
  onChange: (files: FileList | null) => void
  onRemove: (index: number) => void
  optional: boolean
}

function FilePicker({ accept, files, label, multiple, onChange, onRemove, optional }: FilePickerProps) {
  const { t } = useTranslation()
  return (
    <div className="space-y-2">
      <Label>{label}{optional ? <span className="ml-1 text-muted-foreground">{t("aiImage.optional")}</span> : null}</Label>
      <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/20 p-4 text-center text-sm text-muted-foreground hover:bg-muted/40">
        <FileArrowUp className="size-5 text-primary" />
        <span>{multiple ? t("aiImage.chooseReferences") : t("aiImage.chooseMask")}</span>
        <Input
          accept={accept}
          className="sr-only"
          multiple={multiple}
          onChange={(event) => {
            onChange(event.target.files)
            event.target.value = ""
          }}
          type="file"
        />
      </label>
      {files.length ? (
        <ul className="space-y-1">
          {files.map((file, index) => (
            <li className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs" key={`${file.name}-${file.lastModified}-${index}`}>
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <span className="text-muted-foreground">{formatBytes(file.size)}</span>
              <Button aria-label={t("aiImage.removeFile")} onClick={() => onRemove(index)} size="icon-xs" type="button" variant="ghost"><X /></Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function JobCard({ job, locale }: { job: AiImageJob; locale: string }) {
  const { t } = useTranslation()
  const expired = job.resultExpired
  const active = ACTIVE_STATUSES.has(job.status)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const resultUrl = job.resultUrls[0] ?? null

  const saveImage = async () => {
    if (!resultUrl) return
    setIsSaving(true)
    try {
      const result = await getAiImageResult(job.id)
      downloadBlob(result, `jack-house-image-${job.id}.${extensionForBlob(result)}`)
    } catch (error) {
      toast.error(getErrorMessage(error, t("aiImage.saveFailed")))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className={resultUrl ? "pt-0" : undefined} size="sm">
      {resultUrl ? (
        <button className="block w-full" onClick={() => setPreviewOpen(true)} type="button">
          <img
            alt={job.prompt}
            className="aspect-square w-full bg-muted object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
            src={resultUrl}
          />
        </button>
      ) : null}
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StatusBadge status={job.status} />
          <span className="text-xs text-muted-foreground">{formatDateTime(job.createdAt, locale)}</span>
        </div>
        <CardTitle className="line-clamp-2 leading-snug">{job.prompt}</CardTitle>
        <CardDescription>{job.size} · {job.requestType === "edit" ? t("aiImage.referenceMode") : t("aiImage.textMode")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {active ? (
          <div className="flex items-center gap-2 text-sm text-primary"><CircleNotch className="animate-spin" />{t("aiImage.waitingForResult")}</div>
        ) : null}
        {job.status === "failed" ? (
          <p className="text-sm text-destructive">{t("aiImage.failedFallback")}</p>
        ) : null}
        {job.status === "done" && !resultUrl ? (
          <p className="text-sm text-muted-foreground">{expired ? t("aiImage.resultExpired") : t("aiImage.resultUnavailable")}</p>
        ) : null}
        {resultUrl && !expired ? (
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => setPreviewOpen(true)} variant="outline">
              <Eye />{t("aiImage.preview")}
            </Button>
            <Button disabled={isSaving} onClick={() => void saveImage()} variant="outline">
              {isSaving ? <CircleNotch className="animate-spin" /> : <DownloadSimple />}
              {t("aiImage.save")}
            </Button>
          </div>
        ) : null}
      </CardContent>

      <Dialog onOpenChange={setPreviewOpen} open={previewOpen}>
        <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{t("aiImage.previewTitle")}</DialogTitle>
            <DialogDescription>{t("aiImage.viewerHint")}</DialogDescription>
          </DialogHeader>
          {resultUrl ? (
            <ImageLightbox alt={job.prompt} src={resultUrl} />
          ) : null}
          <DialogFooter>
            <Button disabled={isSaving} onClick={() => void saveImage()}>
              {isSaving ? <CircleNotch className="animate-spin" /> : <DownloadSimple />}
              {t("aiImage.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function ImageLightbox({ alt, src }: { alt: string; src: string }) {
  const { t } = useTranslation()
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<{
    offsetX: number
    offsetY: number
    pointerId: number
    startX: number
    startY: number
  } | null>(null)

  const updateZoom = (nextZoom: number) => {
    const value = Math.min(5, Math.max(1, Number(nextZoom.toFixed(2))))
    setZoom(value)
    if (value === 1) setOffset({ x: 0, y: 0 })
  }

  const resetView = () => {
    setZoom(1)
    setOffset({ x: 0, y: 0 })
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (zoom <= 1) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      offsetX: offset.x,
      offsetY: offset.y,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    }
    setIsDragging(true)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    setOffset({
      x: drag.offsetX + event.clientX - drag.startX,
      y: drag.offsetY + event.clientY - drag.startY,
    })
  }

  const stopDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return
    dragRef.current = null
    setIsDragging(false)
  }

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    updateZoom(zoom + (event.deltaY < 0 ? 0.25 : -0.25))
  }

  return (
    <div
      className={`relative flex h-[65vh] max-h-[48rem] min-h-80 select-none items-center justify-center overflow-hidden rounded-2xl bg-black/95 ${zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in"}`}
      onDoubleClick={() => updateZoom(zoom > 1 ? 1 : 2)}
      onPointerCancel={stopDragging}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      onWheel={handleWheel}
      style={{ touchAction: "none" }}
    >
      <img
        alt={alt}
        className="max-h-full max-w-full object-contain will-change-transform"
        draggable={false}
        referrerPolicy="no-referrer"
        src={src}
        style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
      />

      <div
        className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-white/15 bg-black/65 p-1 text-white shadow-xl backdrop-blur-sm"
        onDoubleClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <Button
          aria-label={t("aiImage.zoomOut")}
          className="text-white hover:bg-white/15 hover:text-white"
          disabled={zoom <= 1}
          onClick={(event) => {
            event.stopPropagation()
            updateZoom(zoom - 0.25)
          }}
          size="icon-sm"
          variant="ghost"
        >
          <MagnifyingGlassMinus />
        </Button>
        <span className="w-14 text-center text-xs tabular-nums">{Math.round(zoom * 100)}%</span>
        <Button
          aria-label={t("aiImage.zoomIn")}
          className="text-white hover:bg-white/15 hover:text-white"
          disabled={zoom >= 5}
          onClick={(event) => {
            event.stopPropagation()
            updateZoom(zoom + 0.25)
          }}
          size="icon-sm"
          variant="ghost"
        >
          <MagnifyingGlassPlus />
        </Button>
        <Button
          aria-label={t("aiImage.resetView")}
          className="text-white hover:bg-white/15 hover:text-white"
          disabled={zoom === 1 && offset.x === 0 && offset.y === 0}
          onClick={(event) => {
            event.stopPropagation()
            resetView()
          }}
          size="icon-sm"
          variant="ghost"
        >
          <ArrowCounterClockwise />
        </Button>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: AiImageJobStatus }) {
  const { t } = useTranslation()
  const variant = status === "failed" ? "destructive" : status === "done" ? "default" : "secondary"
  return <Badge variant={variant}>{t(`aiImage.status.${status}`)}</Badge>
}

function createRequestKey() {
  return crypto.randomUUID().replaceAll("-", "")
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

function formatBytes(value: number) {
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`
  return `${(value / 1024 / 1024).toFixed(1)} MB`
}

function formatDateTime(value: string | null, locale: string) {
  if (!value) return "–"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "–"
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

function extensionForBlob(blob: Blob) {
  return ({
    "image/gif": "gif",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  } as Record<string, string>)[blob.type] ?? "img"
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
