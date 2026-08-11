import {
  ChartLineUp,
  Clock,
  Columns,
  DownloadSimple,
  Gauge,
  MusicNote,
  PencilSimple,
  PlayCircle,
  ShareNetwork,
  Sparkle,
  SquaresFour,
  Star,
  Tag,
  Trash,
  Warning,
} from "@phosphor-icons/react"
import { useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import osuDirectIcon from "@/assets/pic/osuDirect.svg"
import sayobotIcon from "@/assets/pic/sayobot.ico"
import osuLogoIcon from "@/assets/pic/osu/osuLogo.png"
import {
  getDifficultyColor,
  getDifficultyTextColor,
  getPackCoverUrl,
  getPackExternalLinks,
  getPackRankStatus,
  getPackTagLabel,
  getPackTypeLabel,
  getVisiblePackTagGroups,
  toFiniteNumber,
  useDeletePackMutation,
  useCreatePackFeedbackMutation,
  usePackTagsQuery,
  useRefreshOsuPackMutation,
  useUpdatePackTagsMutation,
  type PackDetail,
  type PackFeedbackSubmissionCategory,
  type PackMap,
} from "@/entities/pack"
import { useAuthStore } from "@/features/auth"
import { RichTextRenderer } from "@/features/rich-text/renderer"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { AppAlert, InlineSkeleton, MutationErrorAlert } from "@/shared/components"
import { formatDate } from "@/shared/lib/date"

const packDownloadIcons: Record<string, string> = {
  "osu!": osuLogoIcon,
  "osu.direct": osuDirectIcon,
  Sayobot: sayobotIcon,
}

type PackMaintenancePanelProps = {
  pack: PackDetail
}

type PackInfoPanelProps = {
  canMaintain: boolean
  pack: PackDetail
}

export function PackInfoPanel({ canMaintain, pack }: PackInfoPanelProps) {
  const { t } = useTranslation()
  const sharePack = async () => {
    const shareTitle = `${pack.artist_unicode || pack.artist || ""} - ${pack.title_unicode || pack.title}`.trim()
    const shareText = `${shareTitle}\n${window.location.href}`

    try {
      await navigator.clipboard.writeText(shareText)
      toast.success(t("pack.detail.shareSuccess"))
    } catch {
      toast.error(t("pack.detail.shareFailed"))
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-col rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-heading text-xl font-semibold">{t("pack.detail.infoTitle")}</h2>
        <div className="flex items-center gap-2">
          {canMaintain ? <PackMaintenanceDialog pack={pack} /> : null}
          <PackFeedbackDialog pack={pack} />
          <Button aria-label={t("pack.detail.shareAriaLabel")} onClick={sharePack} size="icon-sm" type="button" variant="outline">
            <ShareNetwork className="size-4" weight="bold" />
          </Button>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 text-sm">
        <PackInfoRow label={t("pack.detail.artist")} value={pack.artist || "-"} />
        <PackInfoRow label={t("pack.detail.title")} value={pack.title} />
        <PackInfoRow label={t("pack.detail.creator")} value={pack.creator} />
        <PackInfoRow label={t("pack.detail.submitted")} value={formatDate(pack.submitted_date)} />
        <PackInfoRow label={t("pack.detail.updated")} value={formatDate(pack.last_updated)} />
        <PackInfoRow
          label={t("pack.detail.contributor")}
          value={pack.user ? <ContributorLink user={pack.user} /> : "-"}
        />
      </dl>
    </section>
  )
}

const feedbackCategories: PackFeedbackSubmissionCategory[] = ["incorrect_tag", "duplicate", "copyright_or_violation", "other"]

function PackFeedbackDialog({ pack }: { pack: PackDetail }) {
  const { t } = useTranslation()
  const isLogged = useAuthStore((state) => state.isLogged)
  const openLoginDialog = useAuthStore((state) => state.openLoginDialog)
  const mutation = useCreatePackFeedbackMutation()
  const [isOpen, setIsOpen] = useState(false)
  const [category, setCategory] = useState<PackFeedbackSubmissionCategory>("incorrect_tag")
  const [content, setContent] = useState("")
  const [validationError, setValidationError] = useState("")

  const openFeedback = () => {
    if (!isLogged) {
      openLoginDialog(window.location.pathname + window.location.search)
      return
    }
    setIsOpen(true)
  }

  const submitFeedback = () => {
    const normalizedContent = content.trim()
    if (normalizedContent.length < 5 || normalizedContent.length > 2000) {
      setValidationError(t("pack.feedback.validation.contentLength"))
      return
    }

    setValidationError("")
    mutation.mutate(
      { category, content: normalizedContent, packId: pack.pack_id },
      {
        onSuccess: () => {
          toast.success(t("pack.feedback.success"))
          setIsOpen(false)
          setCategory("incorrect_tag")
          setContent("")
        },
      },
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) setValidationError("")
    }}>
      <Button
        aria-label={t("pack.feedback.ariaLabel")}
        className="text-amber-600 hover:text-amber-700 dark:text-amber-400"
        onClick={openFeedback}
        size="icon-sm"
        title={t("pack.feedback.ariaLabel")}
        type="button"
        variant="outline"
      >
        <Warning className="size-4" weight="bold" />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("pack.feedback.title")}</DialogTitle>
          <DialogDescription>{t("pack.feedback.description", { title: pack.title_unicode || pack.title })}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="pack-feedback-category">{t("pack.feedback.categoryLabel")}</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as PackFeedbackSubmissionCategory)}>
              <SelectTrigger className="w-full" id="pack-feedback-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {feedbackCategories.map((item) => (
                  <SelectItem key={item} value={item}>{t(`pack.feedback.categories.${item}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="pack-feedback-content">{t("pack.feedback.contentLabel")}</Label>
              <span className="text-xs text-muted-foreground">{content.length}/2000</span>
            </div>
            <Textarea
              aria-invalid={Boolean(validationError)}
              className="min-h-32"
              id="pack-feedback-content"
              maxLength={2000}
              onChange={(event) => setContent(event.target.value)}
              placeholder={t("pack.feedback.contentPlaceholder")}
              value={content}
            />
            {validationError ? <p className="text-sm text-destructive">{validationError}</p> : null}
            {mutation.error ? <MutationErrorAlert error={mutation.error} /> : null}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button disabled={mutation.isPending} type="button" variant="outline">{t("pack.feedback.cancel")}</Button>
          </DialogClose>
          <Button disabled={mutation.isPending} onClick={submitFeedback} type="button">
            {mutation.isPending ? t("pack.feedback.submitting") : t("pack.feedback.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PackMaintenanceDialog({ pack }: PackMaintenancePanelProps) {
  const { t } = useTranslation()
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button aria-label={t("pack.detail.maintainAriaLabel")} size="icon-sm" type="button" variant="outline">
          <Sparkle className="size-4" weight="bold" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("pack.detail.maintenanceTitle")}</DialogTitle>
          <DialogDescription>{t("pack.detail.maintenanceDescription")}</DialogDescription>
        </DialogHeader>
        <PackMaintenancePanel key={`${pack.pack_id}:${pack.updated_time}`} pack={pack} />
      </DialogContent>
    </Dialog>
  )
}

function PackInfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-words text-right font-medium">{value}</dd>
    </div>
  )
}

function ContributorLink({ user }: { user: NonNullable<PackDetail["user"]> }) {
  return (
    <Link className="inline-flex items-center justify-end gap-2 text-primary hover:underline" to={`/user/${user.user_id}`}>
      <Avatar size="sm">
        {user.avatar ? <AvatarImage alt={user.user_name} src={user.avatar} /> : null}
        <AvatarFallback>{getAvatarFallback(user.user_name)}</AvatarFallback>
      </Avatar>
      <span>{user.user_name}</span>
    </Link>
  )
}

function getAvatarFallback(name: string | null | undefined) {
  const normalizedName = name?.trim()
  return normalizedName ? normalizedName.slice(0, 2).toUpperCase() : "JH"
}

function PackMaintenancePanel({ pack }: PackMaintenancePanelProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const tagsQuery = usePackTagsQuery()
  const deleteMutation = useDeletePackMutation()
  const refreshMutation = useRefreshOsuPackMutation()
  const updateTagsMutation = useUpdatePackTagsMutation()
  const [isEditingTags, setIsEditingTags] = useState(false)
  const [selectedTags, setSelectedTags] = useState<number[]>(() => pack.tags?.map((tag) => tag.tag_id) ?? [])
  const selectedTagSet = new Set(selectedTags)
  const isUpdating = deleteMutation.isPending || refreshMutation.isPending || updateTagsMutation.isPending
  const isRefreshDisabled = !pack.osu_bid || isUpdatedToday(pack.updated_time) || isUpdating

  const toggleTag = (tagId: number) => {
    setSelectedTags((tagIds) => (tagIds.includes(tagId) ? tagIds.filter((id) => id !== tagId) : [...tagIds, tagId]))
  }

  const resetTags = () => {
    setSelectedTags(pack.tags?.map((tag) => tag.tag_id) ?? [])
    setIsEditingTags(false)
  }

  const refreshPack = () => {
    if (!pack.osu_bid) {
      toast.error(t("pack.detail.refreshUnavailable"))
      return
    }

    if (isUpdatedToday(pack.updated_time)) {
      toast.warning(t("pack.detail.refreshOncePerDay"))
      return
    }

    refreshMutation.mutate(
      {
        beatmapsetId: pack.osu_bid,
        packId: pack.pack_id,
      },
      {
        onSuccess: () => toast.success(t("pack.detail.refreshSuccess")),
      },
    )
  }

  const saveTags = () => {
    updateTagsMutation.mutate(
      {
        packId: pack.pack_id,
        tags: selectedTags,
      },
      {
        onSuccess: () => {
          toast.success(t("pack.detail.tagsUpdated"))
          setIsEditingTags(false)
        },
      },
    )
  }

  const deleteCurrentPack = () => {
    deleteMutation.mutate(pack.pack_id, {
      onSuccess: () => {
        toast.success(t("pack.detail.deleteSuccess"))
        navigate("/pack")
      },
    })
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <Button
          disabled={isRefreshDisabled}
          onClick={refreshPack}
          type="button"
          variant="outline"
        >
          <Sparkle className="size-4" weight="bold" />
          {refreshMutation.isPending ? t("pack.detail.refreshing") : t("pack.detail.refresh")}
        </Button>
        {pack.osu_bid ? null : <p className="text-xs text-muted-foreground">{t("pack.detail.manualPackNoRefresh")}</p>}
        {isUpdatedToday(pack.updated_time) ? <p className="text-xs text-muted-foreground">{t("pack.detail.refreshedToday")}</p> : null}
        {refreshMutation.error ? <MutationErrorAlert error={refreshMutation.error} /> : null}
      </div>

      <div className="border-t pt-5">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-sm font-medium">
            <Tag className="size-4" weight="bold" />
            {t("pack.list.tags")}
          </div>
          <Button
            className="h-7 px-2 text-xs text-muted-foreground"
            disabled={isUpdating}
            onClick={() => setIsEditingTags((value) => !value)}
            size="sm"
            type="button"
            variant="ghost"
          >
            <PencilSimple className="size-3.5" weight="bold" />
            {isEditingTags ? t("pack.detail.closeTags") : t("pack.detail.editTags")}
          </Button>
        </div>

        {isEditingTags ? (
          <div className="mt-4 space-y-4">
            {tagsQuery.isLoading ? <InlineSkeleton count={6} /> : null}
            {tagsQuery.isError ? <AppAlert tone="destructive">{t("pack.list.tagsUnavailable")}</AppAlert> : null}
            {getVisiblePackTagGroups(tagsQuery.data ?? [], pack.type).map((group) => (
              <div key={group.label}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {group.tags.map((tag) => (
                    <Button
                      className={cn(
                        "h-7 px-2 text-xs",
                        !selectedTagSet.has(tag.tag_id) && "text-muted-foreground",
                      )}
                      disabled={isUpdating}
                      key={tag.tag_id}
                      onClick={() => toggleTag(tag.tag_id)}
                      size="sm"
                      type="button"
                      variant={selectedTagSet.has(tag.tag_id) ? "default" : "outline"}
                    >
                      {getPackTagLabel(tag)}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
            {pack.type === 1 ? <p className="text-sm text-muted-foreground">{t("pack.new.collectionNoTags")}</p> : null}
            {updateTagsMutation.error ? <MutationErrorAlert error={updateTagsMutation.error} /> : null}
            <div className="grid grid-cols-2 gap-2">
              <Button
                disabled={isUpdating || tagsQuery.isLoading || tagsQuery.isError}
                onClick={saveTags}
                type="button"
              >
                {updateTagsMutation.isPending ? t("pack.detail.savingTags") : t("pack.detail.saveTags")}
              </Button>
              <Button
                disabled={isUpdating}
                onClick={resetTags}
                type="button"
                variant="outline"
              >
                {t("user.edit.cancel")}
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">{pack.tags?.length ? t("pack.detail.activeTags", { count: pack.tags.length }) : t("pack.detail.noTagsAssigned")}</p>
        )}
      </div>

      <div className="border-t pt-5">
        <div className="flex flex-col gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-medium text-destructive">{t("pack.detail.deletePack")}</div>
            <p className="mt-1 text-xs text-muted-foreground">{t("pack.detail.deleteHint")}</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={isUpdating} type="button" variant="destructive">
                <Trash className="size-4" weight="bold" />
                {t("pack.detail.deletePack")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("pack.detail.deleteTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("pack.detail.deleteDescription", { title: pack.title_unicode || pack.title })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteMutation.isPending}>{t("user.edit.cancel")}</AlertDialogCancel>
                <AlertDialogAction disabled={deleteMutation.isPending} onClick={deleteCurrentPack} variant="destructive">
                  {deleteMutation.isPending ? t("pack.detail.deleting") : t("pack.detail.deleteConfirm")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        {deleteMutation.error ? <MutationErrorAlert className="mt-3" error={deleteMutation.error} /> : null}
      </div>
    </div>
  )
}

type PackShowcaseProps = {
  pack: PackDetail
  maps: PackMap[]
  onSelectMap: (mapId: number) => void
  selectedMap: PackMap | null
  selectedMapId: number | null
}

export function PackShowcase({ maps, onSelectMap, pack, selectedMap, selectedMapId }: PackShowcaseProps) {
  const { t } = useTranslation()
  const coverUrl = getPackCoverUrl(pack)
  const status = getPackRankStatus(pack.status)
  const title = pack.title_unicode || pack.title
  const artist = pack.artist_unicode || pack.artist
  const selectedRating = selectedMap ? formatDecimal(selectedMap.rating, 2) : "-"
  const externalLinks = getPackExternalLinks(pack.osu_bid)
  const osuLink = externalLinks.find((link) => link.label === "osu!")
  const downloadLinks = externalLinks.filter((link) => link.label === "osu.direct" || link.label === "Sayobot")
  const otherLink = pack.other_url ? { label: "Other", url: pack.other_url } : null
  const hasDownloadLinks = externalLinks.length > 0 || Boolean(otherLink)

  return (
    <article className="relative overflow-hidden rounded-lg bg-card text-white shadow-sm">
      {coverUrl ? <img alt="" className="absolute inset-0 size-full object-cover" src={coverUrl} /> : <div className="absolute inset-0 bg-muted" />}
      <div className="absolute inset-0 bg-black/58" />
      <div className="relative z-10 grid min-h-[24rem] gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:p-7">
        <div className="grid min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-6">
          <div className="space-y-4">
            {maps.length > 0 ? (
              <div>
                <div className="flex w-fit max-w-full flex-wrap gap-1 rounded bg-black/35 p-1 shadow-sm">
                  {maps.map((map) => {
                    const isActive = selectedMapId === map.map_id
                    return (
                      <Button
                        aria-label={t("pack.detail.selectedDifficulty", { name: map.version })}
                        className={cn(
                          "rounded bg-transparent p-0 text-white hover:bg-white/12 hover:text-white",
                          isActive && "ring-1 ring-white/60",
                        )}
                        key={map.map_id}
                        onClick={() => onSelectMap(map.map_id)}
                        size="icon-sm"
                        type="button"
                        variant="ghost"
                      >
                        <DifficultyGlyph color={getDifficultyColor(map.rating)} />
                      </Button>
                    )
                  })}
                </div>
                <div className="mt-2 min-h-5 text-sm text-white/88">
                  {selectedMap ? (
                    <>
                      {selectedMap.version}
                      <span
                        className="ml-2 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold leading-none"
                        style={{
                          backgroundColor: getDifficultyColor(selectedMap.rating),
                          color: getDifficultyTextColor(selectedMap.rating),
                        }}
                      >
                        <span aria-hidden="true">★</span>
                        <span>{selectedRating}</span>
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex min-w-0 items-end pb-5 lg:pb-7">
            <div className="min-w-0">
              <h1 className="break-words font-heading text-3xl font-semibold leading-tight sm:text-4xl">{title}</h1>
              {artist ? <p className="mt-2 break-words text-xl font-semibold text-white/88">{artist}</p> : null}
              <div className="mt-5 space-y-1 text-sm text-white/78">
                <p>
                  {t("pack.detail.byCreator", { name: pack.creator })}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
            <span className="rounded bg-black/45 px-2 py-1 text-xs font-semibold">{getPackTypeLabel(pack.type)}</span>
            {pack.tags?.map((tag) => (
              <span className="rounded bg-black/45 px-2 py-1 text-xs font-semibold text-white/86" key={tag.tag_id}>
                {getPackTagLabel(tag)}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-between gap-5">
          {selectedMap ? (
            <SelectedMapPanel map={selectedMap} />
          ) : (
            <div className="rounded bg-black/45 p-4 text-sm text-white/78">{t("pack.detail.noBeatmapMetadata")}</div>
          )}
          <div className="space-y-2">
            {osuLink || selectedMap ? (
              <div className="flex items-center gap-2">
                {osuLink ? (
                  <Button
                    asChild
                    className="shrink-0 rounded-full border-white/18 bg-white/12 text-white shadow-sm hover:border-white/28 hover:bg-white/20 hover:text-white focus-visible:text-white"
                    size="icon"
                    variant="outline"
                  >
                    <a aria-label={osuLink.label} href={osuLink.url} rel="noopener noreferrer" target="_blank" title={osuLink.label}>
                      <img alt="" className="size-6 object-contain" src={osuLogoIcon} />
                    </a>
                  </Button>
                ) : null}
                {selectedMap?.beatmap_id ? (
                  <Button
                    asChild
                    className="min-w-0 flex-1 border-primary/45 bg-primary/90 text-primary-foreground shadow-sm hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:text-primary-foreground"
                    variant="outline"
                  >
                    <Link to={`/tool/oma?beatmapId=${selectedMap.beatmap_id}`}>
                      <ChartLineUp className="size-4" weight="bold" />
                      {t("pack.detail.analyseWithOma")}
                    </Link>
                  </Button>
                ) : selectedMap ? (
                  <Button className="min-w-0 flex-1" disabled title={t("pack.detail.omaUnavailableHint")} type="button" variant="outline">
                    <ChartLineUp className="size-4" weight="bold" />
                    {t("pack.detail.analyseWithOma")}
                  </Button>
                ) : null}
              </div>
            ) : null}
            {downloadLinks.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {downloadLinks.map((link) => (
                  <Button
                    asChild
                    className="border-white/18 bg-white/12 text-white shadow-sm hover:border-white/28 hover:bg-white/20 hover:text-white focus-visible:text-white"
                    key={link.label}
                    variant="outline"
                  >
                    <a href={link.url} rel="noopener noreferrer" target="_blank">
                      <PackDownloadIcon label={link.label} />
                      {link.label}
                    </a>
                  </Button>
                ))}
              </div>
            ) : null}
            {otherLink ? (
              <Button
                asChild
                className="w-full border-white/18 bg-white/12 text-white shadow-sm hover:border-white/28 hover:bg-white/20 hover:text-white focus-visible:text-white"
                variant="outline"
              >
                <a href={otherLink.url} rel="noopener noreferrer" target="_blank">
                  <PackDownloadIcon label={otherLink.label} />
                  {otherLink.label}
                </a>
              </Button>
            ) : null}
            {!hasDownloadLinks ? <p className="text-sm text-white/70">{t("pack.detail.noDownloadLinks")}</p> : null}
          </div>
        </div>
      </div>
    </article>
  )
}

type SelectedMapPanelProps = {
  map: PackMap
}

function SelectedMapPanel({ map }: SelectedMapPanelProps) {
  const { t } = useTranslation()
  const stats = [
    { icon: Gauge, label: "OD", value: formatDecimal(map.od, 1), progress: toFiniteNumber(map.od) * 10, color: "#409EFF" },
    { icon: Gauge, label: "HP", value: formatDecimal(map.hp, 1), progress: toFiniteNumber(map.hp) * 10, color: "#f56c6c" },
    { icon: Star, label: t("pack.detail.stats.rating"), value: formatDecimal(map.rating, 2), progress: null },
    { icon: MusicNote, label: "BPM", value: formatDecimal(map.bpm, 0), progress: null },
    { icon: Clock, label: t("pack.detail.stats.length"), value: formatSeconds(map.length), progress: null },
    { icon: PlayCircle, label: t("pack.detail.stats.realLength"), value: formatSeconds(map.real_length), progress: null },
    { icon: SquaresFour, label: "RC", value: String(map.key_count), progress: null },
    { icon: Columns, label: "LN", value: String(map.ln_count), progress: null },
  ]

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {stats.map((stat) => (
        <div className="rounded bg-black/45 px-3 py-2" key={stat.label}>
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-1.5 text-xs text-white/72">
              <stat.icon className="size-3.5" weight="bold" />
              {stat.label}
            </div>
            <span className="text-xs font-semibold">{stat.value}</span>
          </div>
          {stat.progress === null ? null : (
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-black/65">
              <div
                className="h-full rounded-full"
                style={{ backgroundColor: stat.color, width: `${Math.max(0, Math.min(stat.progress, 100))}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function DifficultyGlyph({ color }: { color: string }) {
  return (
    <svg aria-hidden="true" className="size-5" viewBox="0 0 500 500">
      <path
        d="M250 99c-13.807 0-25 11.193-25 25v252c0 13.807 11.193 25 25 25s25-11.193 25-25V124c0-13.807-11.193-25-25-25Z"
        fill={color}
      />
      <path
        d="M170 170c-13.807 0-25 11.192-25 25v110c0 13.807 11.193 25 25 25s25-11.193 25-25V195c0-13.808-11.193-25-25-25Zm160 0c-13.808 0-25 11.192-25 25v110c0 13.807 11.192 25 25 25s25-11.193 25-25V195c0-13.808-11.192-25-25-25Z"
        fill={color}
      />
      <path
        d="M250 15C120.213 15 15 120.213 15 250s105.213 235 235 235 235-105.213 235-235S379.787 15 250 15Zm0 40c107.695 0 195 87.305 195 195s-87.305 195-195 195S55 357.695 55 250 142.305 55 250 55Z"
        fill={color}
      />
    </svg>
  )
}

function PackDownloadIcon({ label }: { label: string }) {
  const icon = packDownloadIcons[label]

  if (icon) {
    return <img alt="" className="size-4 shrink-0 object-contain" src={icon} />
  }

  return <DownloadSimple className="size-4 shrink-0" weight="bold" />
}

type PackDescriptionProps = {
  className?: string
  description: string | null
}

export function PackDescription({ className, description }: PackDescriptionProps) {
  const { t } = useTranslation()
  return (
    <section className={cn("flex h-full min-h-0 flex-col rounded-lg border bg-card p-4", className)}>
      <h2 className="font-heading text-xl font-semibold">{t("pack.detail.descriptionTitle")}</h2>
      <Separator className="my-3" />
      <div className="scrollbar-soft min-h-0 flex-1 overflow-y-auto pr-2">
        <RichTextRenderer content={description ?? ""} emptyLabel={t("pack.detail.noDescription")} />
      </div>
    </section>
  )
}

type StatusBadgeProps = {
  children: string
  tone: "danger" | "muted" | "success" | "warning"
}

function StatusBadge({ children, tone }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "rounded px-2 py-1 text-xs font-semibold",
        tone === "muted" && "bg-white/12 text-white/78",
        tone === "success" && "bg-emerald-500/18 text-emerald-100",
        tone === "warning" && "bg-amber-500/18 text-amber-100",
        tone === "danger" && "bg-rose-500/18 text-rose-100",
      )}
    >
      {children}
    </span>
  )
}

export function PackDetailSkeleton() {
  return (
    <section className="space-y-6">
      <div className="h-5 w-28 animate-pulse rounded bg-muted" />
      <div className="h-[22rem] animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <div className="h-80 animate-pulse rounded-lg bg-muted" />
          <div className="h-36 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="space-y-6">
          <div className="h-52 animate-pulse rounded-lg bg-muted" />
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    </section>
  )
}

function formatDecimal(value: number | string | null | undefined, digits: number) {
  return toFiniteNumber(value).toFixed(digits)
}

function formatSeconds(totalSeconds: number | string | null | undefined) {
  const normalizedSeconds = Math.max(0, Math.round(toFiniteNumber(totalSeconds)))
  const minutes = Math.floor(normalizedSeconds / 60)
  const seconds = normalizedSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, "0")}`
}

function isUpdatedToday(value: string | null | undefined) {
  if (!value) return false
  const updatedDate = new Date(value)
  if (Number.isNaN(updatedDate.getTime())) return false

  const today = new Date()
  return updatedDate.toDateString() === today.toDateString()
}
