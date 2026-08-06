import {
  CalendarBlank,
  CaretLeft,
  CaretRight,
  ChatText,
  DiscordLogo,
  DownloadSimple,
  Eye,
  FileArrowUp,
  LinkSimple,
  Question,
  Trophy,
} from "@phosphor-icons/react"
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts"
import { resolvePostListTitle, useUserPostListQuery, type PostListItem } from "@/entities/post"
import {
  getPostFileStatusLabel,
  useUserPostFileListQuery,
  type PostFileStatus,
  type PublicPostFileListItem,
} from "@/entities/post-file"
import {
  useUserDetailQuery,
  useUserTournamentExperiencesQuery,
  type UserBadge,
  type UserProfile,
  type UserTournamentExperience,
} from "@/entities/user"
import { useTournamentPerformanceQuery, useTournamentRoundsQuery, type TournamentPerformance } from "@/entities/tournament"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { HolographicCard } from "@/components/ui/holographic-card"
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { AppLocale } from "@/shared/i18n/client"
import { formatDate } from "@/shared/lib/date"
import { getErrorMessage } from "@/shared/components"
import { PlayerPerformancePoster } from "@/pages/tournaments/performance/PlayerPerformancePoster"
import { PlayerCollectibleCard } from "@/pages/tournaments/performance/PlayerCollectibleCard"
import { downloadSvgAsPng } from "@/pages/tournaments/performance/exportSvg"
import {
  buildPlayerPerformanceProfiles,
  getPerformanceMapLabel,
  type PlayerPerformanceEntry,
} from "@/pages/tournaments/performance/playerPerformance"
import { getTournamentMapCoverUrl, getTournamentPublicPath } from "@/pages/tournaments/_shared/tournamentVisuals"
import { groupRoundsByMainStage } from "@/pages/tournaments/_shared/tournamentRoundStages"
import { UserPostsSkeleton, UserProfileSkeleton, UserProfileState, UserRoleBadge, UserStatusBadge } from "./components"
import { parsePage } from "./utils"

const USER_POST_PAGE_SIZE = 4
const USER_POST_FILE_PAGE_SIZE = 3
const SHOW_PERFORMANCE_POSTER = false
const TPR_CHART_CONFIG = {
  tpr: { color: "var(--primary)", label: "TPR" },
} satisfies ChartConfig

export function UserProfilePage() {
  const { userId } = useParams()
  const { i18n, t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const postPage = parsePage(searchParams.get("postPage"))
  const postFilePage = parsePage(searchParams.get("postFilePage"))
  const locale = i18n.language === "en" ? "en" : "zh"
  const userQuery = useUserDetailQuery(userId)
  const experiencesQuery = useUserTournamentExperiencesQuery(userId)
  const postsQuery = useUserPostListQuery(userId ? { page: postPage, pageSize: USER_POST_PAGE_SIZE, userId } : undefined)
  const postFilesQuery = useUserPostFileListQuery(userId ? { page: postFilePage, pageSize: USER_POST_FILE_PAGE_SIZE, userId } : undefined)

  const changePage = (key: "postFilePage" | "postPage", page: number) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set(key, String(page))
    setSearchParams(nextParams)
  }

  if (!userId) return <UserProfileState title={t("user.profile.missingTitle")} description={t("user.profile.missingDescription")} />
  if (userQuery.isLoading) return <UserProfileSkeleton />
  if (userQuery.isError) return <UserProfileState title={t("user.profile.loadFailedTitle")} description={getErrorMessage(userQuery.error)} />
  if (!userQuery.data) return <UserProfileState title={t("user.profile.notFoundTitle")} description={t("user.profile.notFoundDescription")} />

  return (
    <main className="mx-auto w-full max-w-5xl px-3 sm:px-0">
      <section
        className="relative overflow-hidden bg-muted px-4 sm:px-7"
        style={{
          background: "linear-gradient(108deg, color-mix(in oklch, var(--primary) 14%, var(--muted)) 0%, var(--muted) 48%, color-mix(in oklch, var(--background) 26%, var(--muted)) 100%)",
        }}
      >
        <div className="pointer-events-none absolute -right-24 -top-32 size-80 rounded-full bg-primary/[0.045] blur-3xl" />
        <UserHero user={userQuery.data} />
        <UserProfileMeta user={userQuery.data} />
      </section>

      <section>
        <div className="grid min-w-0 overflow-hidden bg-muted/30 px-5 py-5 sm:px-6 sm:py-6 xl:grid-cols-2">
          <UserPostsSection locale={locale as AppLocale} onPageChange={(page) => changePage("postPage", page)} postsQuery={postsQuery} />
          <UserPostFilesSection onPageChange={(page) => changePage("postFilePage", page)} postFilesQuery={postFilesQuery} />
        </div>
      </section>

      <section>
        <TournamentExperienceSection experiencesQuery={experiencesQuery} user={userQuery.data} />
      </section>
    </main>
  )
}

function UserHero({ user }: { user: UserProfile }) {
  const { t } = useTranslation()
  const initials = user.user_name.trim().slice(0, 2).toUpperCase() || "JH"

  return (
    <header className="relative py-5 sm:py-8">
      <div className="pointer-events-none absolute -right-20 -top-16 hidden sm:block" aria-hidden="true">
        <span className="absolute left-1/2 top-1/2 size-96 -translate-x-1/2 -translate-y-1/2 rounded-full border-[18px] border-foreground/[0.035]" />
        <span className="absolute left-1/2 top-1/2 size-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border-[11px] border-primary/[0.055]" />
        <span className="absolute left-1/2 top-1/2 size-[44rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-foreground/10" />
      </div>
      <div className="relative flex items-center gap-7 px-2 sm:items-end sm:gap-8 sm:px-4">
        <div className="relative grid size-18 shrink-0 place-items-center sm:size-28">
          <span className="pointer-events-none absolute -inset-2 rounded-full border border-primary/45" aria-hidden="true" />
          <span className="pointer-events-none absolute -inset-3.5 rounded-full border border-foreground/15" aria-hidden="true" />
          <div className="grid size-full place-items-center overflow-hidden rounded-full border-[3px] border-background bg-muted shadow-lg">
            {user.avatar ? <img alt="" className="size-full object-cover" src={user.avatar} /> : <span className="font-heading text-4xl font-semibold text-muted-foreground">{initials}</span>}
          </div>
        </div>
        <div className="min-w-0 flex-1 pb-1">
          <div className="mb-2 flex flex-wrap items-center gap-1.5 sm:mb-3 sm:gap-2">
            <UserRoleBadge role={user.role} />
            {user.status !== 0 ? <UserStatusBadge status={user.status} /> : null}
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{t("user.profile.uid", { id: user.user_id })}</span>
          </div>
          <h1 className="break-words font-heading text-2xl font-semibold tracking-tight sm:text-4xl">{user.user_name}</h1>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 sm:mt-4">
            <UserBadges badges={user.badges ?? []} />
          </div>
        </div>
      </div>
    </header>
  )
}

function UserBadges({ badges }: { badges: UserBadge[] }) {
  if (badges.length === 0) return null
  return (
    <>
      <UserBadgeStrip badges={badges} className="sm:hidden" limit={2} />
      <UserBadgeStrip badges={badges} className="hidden sm:flex" limit={4} />
    </>
  )
}

function UserBadgeStrip({ badges, className, limit }: { badges: UserBadge[]; className?: string; limit: number }) {
  const { t } = useTranslation()
  const visibleBadges = badges.slice(0, limit)
  const hiddenBadgeCount = badges.length - visibleBadges.length

  return (
    <div className={cn("flex min-w-0 flex-row flex-wrap items-center gap-2", className)}>
      {visibleBadges.map((badge) => <UserBadgeItem badge={badge} key={badge.id} />)}
      {hiddenBadgeCount > 0 ? (
        <Popover>
          <PopoverTrigger asChild>
            <button
              aria-label={t("user.profile.moreBadges", { count: hiddenBadgeCount })}
              className="grid h-10 min-w-10 shrink-0 place-items-center rounded-full border border-foreground/15 bg-background/45 px-2 text-xs font-semibold tabular-nums text-muted-foreground transition hover:border-primary/35 hover:text-primary"
              type="button"
            >
              +{hiddenBadgeCount}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="max-h-[60vh] w-[min(22rem,calc(100vw-2rem))] gap-3 overflow-y-auto rounded-xl p-3">
            <PopoverTitle className="font-heading text-sm font-semibold">{t("user.profile.allBadges")}</PopoverTitle>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {badges.map((badge) => <UserBadgeGridItem badge={badge} key={badge.id} />)}
            </div>
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  )
}

function UserBadgeItem({ badge }: { badge: UserBadge }) {
  const image = badge.signedUrl ?? badge.url
  const content = image
    ? <img alt={badge.name} className="h-9 w-auto max-w-16 object-contain sm:h-10 sm:max-w-20" src={image} />
    : <span className="text-xs font-semibold uppercase tracking-wide">{badge.name}</span>

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {badge.redirect_url ? <a className="shrink-0 transition hover:opacity-75" href={badge.redirect_url} rel="noopener noreferrer" target="_blank">{content}</a> : <span className="shrink-0">{content}</span>}
      </TooltipTrigger>
      <TooltipContent>{badge.name}</TooltipContent>
    </Tooltip>
  )
}

function UserBadgeGridItem({ badge }: { badge: UserBadge }) {
  const image = badge.signedUrl ?? badge.url
  const content = (
    <>
      <span className="grid h-12 w-full place-items-center overflow-hidden">
        {image ? <img alt="" className="max-h-10 max-w-full object-contain" src={image} /> : <span className="text-sm font-semibold">{badge.name.slice(0, 2)}</span>}
      </span>
      <span className="w-full truncate text-center text-xs text-muted-foreground">{badge.name}</span>
    </>
  )

  const className = "flex min-w-0 flex-col items-center gap-1 rounded-lg bg-muted/45 p-2 transition hover:bg-muted"
  return badge.redirect_url
    ? <a className={className} href={badge.redirect_url} rel="noopener noreferrer" target="_blank">{content}</a>
    : <div className={className}>{content}</div>
}

function UserProfileMeta({ user }: { user: UserProfile }) {
  const osuUrl = user.osu_uid ? `https://osu.ppy.sh/u/${user.osu_uid}` : null

  return (
    <div className="-mx-4 flex flex-wrap items-center gap-x-5 gap-y-2 bg-background/45 px-4 py-3 text-sm text-muted-foreground sm:-mx-7 sm:px-7">
      <ProfileMetaItem icon={<CalendarBlank />} content={formatDate(user.created_time)} />
      {osuUrl ? <ProfileMetaItem icon={<LinkSimple />} content={<a className="transition hover:text-foreground" href={osuUrl} rel="noreferrer" target="_blank">osu! · {user.osu_uid}</a>} /> : null}
      {user.qq?.trim() ? <ProfileMetaItem icon={<QqIcon />} content={<CopyableContact value={user.qq} />} /> : null}
      {user.discord?.trim() ? <ProfileMetaItem icon={<DiscordLogo />} content={<CopyableContact value={user.discord} />} /> : null}
    </div>
  )
}

function ProfileMetaItem({ content, icon }: { content: ReactNode; icon: ReactNode }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 [&>svg]:size-4 [&>svg]:shrink-0">
      {icon}<span className="min-w-0 max-w-64 truncate font-medium">{content}</span>
    </span>
  )
}

function QqIcon() {
  return <span aria-hidden="true" className="inline-flex w-5 shrink-0 items-center justify-center font-heading text-[0.65rem] font-bold tracking-tight">QQ</span>
}

function CopyableContact({ value }: { value: string | null | undefined }) {
  const { t } = useTranslation()
  const contact = value?.trim()
  if (!contact) return null
  return (
    <button className="max-w-full truncate text-left transition hover:text-primary" onClick={async () => {
      try {
        await navigator.clipboard.writeText(contact)
        toast.success(t("common.copied"))
      } catch {
        toast.error(t("common.copyFailed"))
      }
    }} type="button">{contact}</button>
  )
}

function TournamentExperienceSection({ experiencesQuery, user }: {
  experiencesQuery: ReturnType<typeof useUserTournamentExperiencesQuery>
  user: UserProfile
}) {
  const { t } = useTranslation()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedStageKey, setSelectedStageKey] = useState<string | null>(null)
  const [chartStageKey, setChartStageKey] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isCardHintVisible, setIsCardHintVisible] = useState(true)
  const collectibleCardRef = useRef<SVGSVGElement>(null)
  const cardHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const experiences = experiencesQuery.data ?? []
  const selected = experiences.find((item) => item.tournament.id === selectedId) ?? experiences[0]
  const roundsQuery = useTournamentRoundsQuery(selected ? String(selected.tournament.id) : undefined)
  const tournamentPerformanceQuery = useTournamentPerformanceQuery(selected ? String(selected.tournament.id) : undefined)
  const roundGroups = useMemo(() => groupRoundsByMainStage(roundsQuery.data ?? []).map((group) => ({
    key: group.key,
    label: group.label,
    maps: group.maps,
    roundIds: group.rounds.map((round) => round.id),
  })), [roundsQuery.data])
  const profile = useMemo(() => selected ? buildExperienceProfile(selected, roundGroups) : null, [roundGroups, selected])
  const comparisonProfiles = useMemo(() => (
    tournamentPerformanceQuery.data
      ? buildPlayerPerformanceProfiles(tournamentPerformanceQuery.data, roundGroups)
      : []
  ), [roundGroups, tournamentPerformanceQuery.data])
  useEffect(() => () => {
    if (cardHintTimerRef.current) clearTimeout(cardHintTimerRef.current)
  }, [])
  const handleCardDialogOpenChange = (open: boolean) => {
    if (cardHintTimerRef.current) clearTimeout(cardHintTimerRef.current)
    cardHintTimerRef.current = null
    if (open) setIsCardHintVisible(true)
  }
  const handleCardPointerMove = () => {
    if (!isCardHintVisible || cardHintTimerRef.current) return
    cardHintTimerRef.current = setTimeout(() => {
      setIsCardHintVisible(false)
      cardHintTimerRef.current = null
    }, 2000)
  }
  const activeStageKey = profile?.stages.some((stage) => stage.key === selectedStageKey)
    ? selectedStageKey
    : profile?.stages[0]?.key ?? null
  const visibleEntries = profile?.entries.filter((entry) => entry.stageKey === activeStageKey) ?? []
  const tprChartData = useMemo(() => {
    if (!profile?.entries.length) return []
    const entries = chartStageKey
      ? profile.entries.filter((entry) => entry.stageKey === chartStageKey)
      : profile.entries
    return entries.map((entry, index) => ({
      game: index + 1,
      stageKey: entry.stageKey,
      stageLabel: entry.stageLabel,
      tpr: entry.rating_after,
    }))
  }, [chartStageKey, profile])
  const tprStageBands = useMemo(() => {
    const bands: Array<{ end: number; key: string; label: string; start: number }> = []
    for (const point of tprChartData) {
      const current = bands.at(-1)
      if (!current || current.key !== point.stageKey) {
        bands.push({ end: point.game, key: point.stageKey, label: point.stageLabel, start: point.game })
      } else {
        current.end = point.game
      }
    }
    return bands.map((band) => ({ ...band, tick: (band.start + band.end) / 2 }))
  }, [tprChartData])
  const tprYAxis = useMemo(() => {
    const values = tprChartData.map((point) => point.tpr)
    if (values.length === 0) return { domain: [0, 1] as [number, number], ticks: [0, 1] }
    const dataMin = Math.min(...values)
    const dataMax = Math.max(...values)
    const spread = dataMax - dataMin
    if (spread === 0) {
      const padding = Math.max(1, Math.abs(dataMin) * 0.01)
      return { domain: [dataMin - padding, dataMax + padding] as [number, number], ticks: [dataMin - padding, dataMin, dataMax + padding] }
    }
    const roughStep = spread / 4
    const magnitude = 10 ** Math.floor(Math.log10(roughStep))
    const normalizedStep = roughStep / magnitude
    const niceMultiplier = normalizedStep <= 1 ? 1 : normalizedStep <= 2 ? 2 : normalizedStep <= 2.5 ? 2.5 : normalizedStep <= 5 ? 5 : 10
    const step = niceMultiplier * magnitude
    const min = Math.floor(dataMin / step) * step
    const max = Math.ceil(dataMax / step) * step
    const ticks = Array.from({ length: Math.floor((max - min) / step) + 1 }, (_, index) => min + index * step)
    return { domain: [min, max] as [number, number], ticks }
  }, [tprChartData])
  const exportCollectibleCard = async () => {
    if (!collectibleCardRef.current || !profile || !selected) return
    setIsExporting(true)
    try {
      const safeName = user.user_name.replace(/[^a-z0-9\u4e00-\u9fff_-]+/gi, "-")
      await downloadSvgAsPng(collectibleCardRef.current, `${selected.tournament.acronym}-${safeName}-collectible-card.png`)
      toast.success(t("tournament.playerPerformance.exported"))
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <section className="bg-muted/30 px-5 py-5 sm:px-6 sm:py-6">
      <SectionHeader
        action={selected && profile ? (
          <div className="flex items-center gap-2">
            <Select
              onValueChange={(value) => {
                setSelectedId(Number(value))
                setSelectedStageKey(null)
                setChartStageKey(null)
              }}
              value={String(selected.tournament.id)}
            >
              <SelectTrigger aria-label={t("user.profile.competitionTitle")} className="w-28 bg-background/45 sm:w-56" size="sm">
                <span className="truncate sm:hidden">{selected.tournament.acronym}</span>
                <span className="hidden truncate sm:block">{selected.tournament.acronym} · {selected.tournament.name}</span>
              </SelectTrigger>
              <SelectContent>
                {experiences.map((experience) => (
                  <SelectItem key={experience.tournament.id} value={String(experience.tournament.id)}>
                    <span className="sm:hidden">{experience.tournament.acronym}</span>
                    <span className="hidden sm:inline">{experience.tournament.acronym} · {experience.tournament.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog onOpenChange={handleCardDialogOpenChange}>
              <DialogTrigger asChild>
                <Button
                  aria-label={t("user.profile.previewPlayerCard")}
                  className="size-8 px-0 sm:w-auto sm:px-3"
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Eye />
                  <span className="hidden sm:inline">{t("user.profile.previewPlayerCard")}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[min(360px,calc((100dvh-176px)*0.72),calc(100vw-32px))] max-w-none select-none gap-0 rounded-none bg-transparent p-0 text-white ring-0 sm:max-w-none [&_[data-slot=dialog-close]]:-top-18 [&_[data-slot=dialog-close]]:right-0 [&_[data-slot=dialog-close]]:z-10 [&_[data-slot=dialog-close]]:bg-black/35 [&_[data-slot=dialog-close]]:text-white [&_[data-slot=dialog-close]]:backdrop-blur-md">
                <DialogHeader className="sr-only">
                  <DialogTitle>{t("user.profile.previewPlayerCard")}</DialogTitle>
                </DialogHeader>
                <div className="w-full" onPointerMove={handleCardPointerMove}>
                  <HolographicCard aspectRatio={360 / 500}>
                    <PlayerCollectibleCard comparisonProfiles={comparisonProfiles} profile={profile} tournament={selected.tournament} />
                  </HolographicCard>
                </div>
                <DialogDescription
                  aria-hidden={!isCardHintVisible}
                  className={cn(
                    "pointer-events-none absolute bottom-[-60px] left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-black/30 px-3 py-1.5 text-[11px] tracking-[0.08em] text-white/60 backdrop-blur-md transition duration-300",
                    isCardHintVisible ? "opacity-100" : "translate-y-1 opacity-0",
                  )}
                >
                  <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-white/60" />
                  {t("user.profile.playerCardPreviewDescription")}
                </DialogDescription>
              </DialogContent>
            </Dialog>
            <Button
              aria-label={isExporting ? t("tournament.playerPerformance.exporting") : t("user.profile.exportPlayerCard")}
              className="size-8 px-0 sm:w-auto sm:px-3"
              disabled={isExporting}
              onClick={exportCollectibleCard}
              size="sm"
              type="button"
              variant="outline"
            >
              <DownloadSimple />
              <span className="hidden sm:inline">{isExporting ? t("tournament.playerPerformance.exporting") : t("user.profile.exportPlayerCardShort")}</span>
            </Button>
          </div>
        ) : undefined}
        help={t("user.profile.competitionHelp")}
        title={t("user.profile.competitionTitle")}
      />

      {experiencesQuery.isLoading ? <div className="h-72 animate-pulse bg-muted/35" />
        : experiencesQuery.isError ? <InlineState title={t("user.profile.competitionLoadFailed")} description={getErrorMessage(experiencesQuery.error)} />
        : !selected || !profile ? <InlineState icon={<Trophy weight="duotone" />} title={t("user.profile.noCompetitionsTitle")} />
        : (
          <div className="min-w-0">
              <div className="py-4">
                <ChartContainer className="h-44 w-full aspect-auto" config={TPR_CHART_CONFIG}>
                  <LineChart data={tprChartData} margin={{ bottom: 0, left: 8, right: 8, top: 0 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      axisLine={false}
                      dataKey="game"
                      domain={tprChartData.length <= 1 ? [0, 2] : [1, tprChartData.length]}
                      tickFormatter={(value) => tprStageBands.find((band) => band.tick === value)?.label ?? ""}
                      tickLine={false}
                      tickMargin={8}
                      ticks={tprStageBands.map((band) => band.tick)}
                      type="number"
                    />
                    <YAxis axisLine={false} domain={tprYAxis.domain} tickFormatter={(value: number) => String(Number(value.toFixed(2)))} tickLine={false} tickMargin={6} ticks={tprYAxis.ticks} width={52} />
                    {tprStageBands.slice(1).map((band) => <ReferenceLine key={band.key} stroke="var(--border)" strokeDasharray="3 5" x={band.start - 0.5} />)}
                    <ChartTooltip content={<ChartTooltipContent indicator="line" labelFormatter={(_value, payload) => String(payload?.[0]?.payload?.stageLabel ?? "")} />} />
                    <Line dataKey="tpr" dot={{ r: 2 }} stroke="var(--color-tpr)" strokeWidth={2} type="monotone" />
                  </LineChart>
                </ChartContainer>
              </div>

              <div className="pt-4">
                {profile.stages.length > 1 ? (
                  <Tabs className="mb-4" onValueChange={setSelectedStageKey} value={activeStageKey ?? undefined}>
                    <TabsList className="flex h-9 w-full justify-start overflow-x-auto overflow-y-hidden">
                      {profile.stages.map((stage) => (
                        <TabsTrigger
                          className={cn("shrink-0", chartStageKey === stage.key && "ring-1 ring-primary/45")}
                          key={stage.key}
                          onDoubleClick={() => setChartStageKey((current) => current === stage.key ? null : stage.key)}
                          value={stage.key}
                        >
                          {stage.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                ) : null}
                <div>
                  {visibleEntries.map((entry, index) => (
                    <PerformanceGameRow
                      entry={entry}
                      fallbackCover={selected.tournament.banner}
                      index={index}
                      key={`${entry.game_id}-${entry.side}`}
                      tournamentPath={getTournamentPublicPath(selected.tournament)}
                    />
                  ))}
                </div>
              </div>

              {SHOW_PERFORMANCE_POSTER ? (
                <div className="fixed -left-[10000px] top-0 size-[340px] overflow-hidden" aria-hidden="true">
                  <PlayerPerformancePoster
                    profile={profile}
                    snapshotDate={selected.snapshot.finalized_at ?? selected.snapshot.calculated_at}
                    tournament={selected.tournament}
                  />
                </div>
              ) : null}
              <div className="fixed -left-[10000px] top-0 w-[360px] overflow-hidden" aria-hidden="true">
                <PlayerCollectibleCard
                  comparisonProfiles={comparisonProfiles}
                  profile={profile}
                  ref={collectibleCardRef}
                  tournament={selected.tournament}
                />
              </div>
          </div>
        )}
    </section>
  )
}

function PerformanceGameRow({ entry, fallbackCover, index, tournamentPath }: {
  entry: PlayerPerformanceEntry
  fallbackCover?: string | null
  index: number
  tournamentPath: string
}) {
  const map = entry.mapData.map
  const coverUrl = getTournamentMapCoverUrl(map) ?? fallbackCover
  const mapLabel = getPerformanceMapLabel(entry)
  const title = map?.title || mapLabel

  return (
    <Link
      className="group -mx-3 grid grid-cols-[1.5rem_3.75rem_minmax(0,1fr)_auto] items-center gap-2.5 px-3 py-3 transition hover:bg-background/35 sm:grid-cols-[2rem_5rem_minmax(0,1fr)_auto] sm:gap-3"
      to={`${tournamentPath}/match/${entry.match_id}`}
    >
      <span className="font-mono text-[0.65rem] text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
      <span className="relative h-10 overflow-hidden bg-background/55 sm:h-12">
        {coverUrl ? <img alt="" className="size-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" src={coverUrl} /> : <span className="absolute inset-0 bg-[linear-gradient(135deg,var(--primary),var(--muted))]" />}
        <span className="absolute inset-0 bg-black/25" />
        <span className="absolute bottom-1 left-1 bg-black/65 px-1.5 py-0.5 font-mono text-[0.58rem] font-semibold leading-none text-white">{mapLabel}</span>
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium transition group-hover:text-primary">{title}</span>
        <span className="mt-1 block truncate text-xs text-muted-foreground">
          {entry.score.toLocaleString()} · {Math.round(entry.rating_before)} → {Math.round(entry.rating_after)}
        </span>
      </span>
      <span className={cn("font-mono text-sm font-semibold", entry.rating_delta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>{formatDelta(entry.rating_delta)}</span>
    </Link>
  )
}

function buildExperienceProfile(experience: UserTournamentExperience, roundGroups: Parameters<typeof buildPlayerPerformanceProfiles>[1]) {
  const performance: TournamentPerformance = {
    ratings: [experience.rating],
    snapshot: experience.snapshot,
    stages: experience.stages,
  }
  return buildPlayerPerformanceProfiles(performance, roundGroups)[0] ?? null
}

function InlineState({ description, icon, title }: { description?: string; icon?: ReactNode; title: string }) {
  return <div className="py-12 text-center">{icon ? <div className="mx-auto mb-3 grid size-10 place-items-center text-primary/60 [&>svg]:size-8">{icon}</div> : null}<h3 className={cn("font-heading", icon ? "text-sm font-medium text-muted-foreground" : "text-lg font-semibold")}>{title}</h3>{description ? <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p> : null}</div>
}

function UserPostsSection({ locale, onPageChange, postsQuery }: { locale: AppLocale; onPageChange: (page: number) => void; postsQuery: ReturnType<typeof useUserPostListQuery> }) {
  const { t } = useTranslation()
  const pagination = postsQuery.data ? <UserPostPagination onPageChange={onPageChange} page={postsQuery.data.page} totalPages={postsQuery.data.totalPages} /> : undefined
  return (
    <section className="min-w-0 overflow-hidden pb-6 xl:pb-0 xl:pr-6">
      <SectionHeader action={pagination} title={t("user.profile.posts")} />
      {postsQuery.isLoading ? <UserPostsSkeleton />
        : postsQuery.isError ? <InlineState title={t("user.profile.postsLoadFailed")} description={getErrorMessage(postsQuery.error)} />
        : postsQuery.data?.data.length ? <div className="min-w-0 space-y-1">{postsQuery.data.data.map((post) => <UserPostRow key={post.post_id} locale={locale} post={post} />)}</div>
        : <InlineState icon={<ChatText weight="duotone" />} title={t("user.profile.noPostsTitle")} />}
    </section>
  )
}

function UserPostFilesSection({ onPageChange, postFilesQuery }: { onPageChange: (page: number) => void; postFilesQuery: ReturnType<typeof useUserPostFileListQuery> }) {
  const { t } = useTranslation()
  const pagination = postFilesQuery.data ? <UserPostPagination onPageChange={onPageChange} page={postFilesQuery.data.page} totalPages={postFilesQuery.data.totalPages} /> : undefined
  return (
    <section className="min-w-0 overflow-hidden border-t border-foreground/10 pt-6 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
      <SectionHeader action={pagination} title={t("user.profile.submissions")} />
      {postFilesQuery.isLoading ? <UserPostsSkeleton />
        : postFilesQuery.isError ? <InlineState title={t("user.profile.submissionsLoadFailed")} description={getErrorMessage(postFilesQuery.error)} />
        : postFilesQuery.data?.data.length ? <div className="min-w-0 space-y-1">{postFilesQuery.data.data.map((file) => <UserPostFileRow file={file} key={file.file_id} />)}</div>
        : <InlineState icon={<FileArrowUp weight="duotone" />} title={t("user.profile.noSubmissionsTitle")} />}
    </section>
  )
}

function SectionHeader({ action, help, title }: { action?: ReactNode; help?: string; title: string }) {
  return <div className="mb-3 flex items-center justify-between gap-4"><div className="flex items-center gap-2"><h2 className="flex items-center gap-2.5 font-heading text-lg font-semibold"><span className="h-4 w-1 bg-primary" aria-hidden="true" />{title}</h2>{help ? <Popover><PopoverTrigger asChild><button aria-label={help} className="grid size-6 place-items-center text-muted-foreground/70 transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" type="button"><Question className="size-4" weight="bold" /></button></PopoverTrigger><PopoverContent align="start" className="w-[min(18rem,calc(100vw-2rem))] rounded-xl p-3 text-xs leading-relaxed text-muted-foreground">{help}</PopoverContent></Popover> : null}</div>{action}</div>
}

function UserPostRow({ locale, post }: { locale: AppLocale; post: PostListItem }) {
  return <Link className="group -mx-3 flex min-w-0 items-center justify-between gap-4 px-3 py-4 transition hover:bg-background/50" to={`/post/${post.post_id}`}><span className="min-w-0 flex-1 truncate font-medium transition group-hover:text-primary">{resolvePostListTitle(post, locale)}</span><span className="shrink-0 text-xs text-muted-foreground">{formatDate(post.created_time)}</span></Link>
}

function UserPostFileRow({ file }: { file: PublicPostFileListItem }) {
  return (
    <div className="-mx-3 flex min-w-0 items-start justify-between gap-3 px-3 py-4 transition hover:bg-background/50">
      <div className="min-w-0 flex-1"><div className="flex min-w-0 items-center gap-2"><FileArrowUp className="size-4 shrink-0 text-muted-foreground" /><span className="min-w-0 truncate font-medium">{file.file_name}</span></div><div className="mt-1 text-xs text-muted-foreground">{formatDate(file.uploaded_time)}</div></div>
      <Badge className={cn("shrink-0", getPostFileStatusClassName(file.status))} variant="outline">{getPostFileStatusLabel(file.status)}</Badge>
    </div>
  )
}

function getPostFileStatusClassName(status: PostFileStatus) {
  if (status === 1) return "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
  if (status === 2) return "border-destructive/25 bg-destructive/10 text-destructive"
  return "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"
}

function UserPostPagination({ onPageChange, page, totalPages }: { onPageChange: (page: number) => void; page: number; totalPages: number }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground" aria-label={`${page} / ${totalPages}`}>
      <button aria-label="Previous page" className="grid size-7 place-items-center transition hover:text-foreground disabled:cursor-default disabled:opacity-30" disabled={page <= 1} onClick={() => onPageChange(page - 1)} type="button"><CaretLeft className="size-3.5" weight="bold" /></button>
      <span className="min-w-8 text-center tabular-nums">{page}/{totalPages}</span>
      <button aria-label="Next page" className="grid size-7 place-items-center transition hover:text-foreground disabled:cursor-default disabled:opacity-30" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} type="button"><CaretRight className="size-3.5" weight="bold" /></button>
    </div>
  )
}

function formatDelta(value: number) {
  const rounded = Math.round(value * 100) / 100
  return `${rounded >= 0 ? "+" : ""}${rounded.toFixed(2)}`
}
