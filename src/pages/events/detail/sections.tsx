import { ArrowSquareOut, ChartBar, ClockCountdown, Medal } from "@phosphor-icons/react"
import { useEffect, useRef, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import {
  getEventStatus,
  type EventStageRankItem,
  type EventStageSummary,
  type EventTotalRankItem,
  type EventUserStageScore,
} from "@/entities/event"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AppAlert, getErrorMessage } from "@/shared/components"
import type { EventCopy } from "./utils"
import {
  EVENT_LEADERBOARD_PAGE_SIZE,
  HIGHLIGHTED_RANK_COUNT,
  formatCooldown,
  formatCountdown,
  formatScore,
  formatShortDateTime,
  getUserInitial,
} from "./utils"

type EventHeroProps = {
  copy: EventCopy
  event: {
    end: string
    name: string
    start: string
  }
  navigation?: ReactNode
  status: ReturnType<typeof getEventStatus>
}

export function EventHero({ copy, event, navigation, status }: EventHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border bg-card shadow-sm">
      <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
      <div className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_15rem] md:items-end md:p-6">
        <div className="max-w-3xl">
          <EventStatusBadge status={status} />
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight md:text-4xl">{event.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {formatShortDateTime(event.start)} - {formatShortDateTime(event.end)}
          </p>
        </div>
        <div className="md:text-right">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:justify-end">
            <ClockCountdown className="size-4" weight="bold" />
            {copy.countdown}
          </div>
          <div className="mt-1.5 font-heading text-xl font-semibold">{formatCountdown(event.end)}</div>
        </div>
      </div>
      {navigation ? (
        <div className="overflow-x-auto overscroll-x-contain border-t p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navigation}
        </div>
      ) : null}
    </section>
  )
}

function EventStatusBadge({ status }: { status: ReturnType<typeof getEventStatus> }) {
  if (status.tone === "success") {
    return <Badge className="rounded-full bg-emerald-500/12 px-3 py-1 text-emerald-700 dark:text-emerald-300">{status.label}</Badge>
  }

  if (status.tone === "info") {
    return <Badge className="rounded-full px-3 py-1" variant="secondary">{status.label}</Badge>
  }

  return <Badge className="rounded-full px-3 py-1" variant="outline">{status.label}</Badge>
}

type ScorePanelProps = {
  copy: EventCopy
  cooldown: number
  isSubmitting: boolean
  onSubmitScore: () => void
  totalScore?: {
    totalRank: number | null
    totalScore: number | string
  }
}

export function ScorePanel({ copy, cooldown, isSubmitting, onSubmitScore, totalScore }: ScorePanelProps) {
  const hasScore = Boolean(totalScore?.totalRank)

  return (
    <section>
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <ChartBar className="size-4" weight="bold" />
          </div>
          <div className="min-w-0">
            <h2 className="font-heading text-lg font-semibold">{copy.myScore}</h2>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          {hasScore ? (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl bg-muted/25 px-3 py-2">
              <ScoreMetric label={copy.totalRank} value={`#${totalScore?.totalRank ?? "-"}`} />
              <ScoreMetric label={copy.totalScore} value={formatScore(totalScore?.totalScore)} />
            </div>
          ) : (
            <div className="min-w-0 rounded-xl bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {copy.noScore}
            </div>
          )}
          <Button className="shrink-0" disabled={isSubmitting || cooldown > 0} size="sm" onClick={onSubmitScore} type="button">
            {cooldown > 0 ? `${copy.submitScore} (${formatCooldown(cooldown)})` : copy.submitScore}
          </Button>
        </div>
      </div>
    </section>
  )
}

function ScoreMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="font-heading text-xl font-semibold tabular-nums">{value}</span>
    </div>
  )
}

type StageGridProps = {
  copy: EventCopy
  scoresById: Map<number, EventUserStageScore>
  stages: EventStageSummary[]
}

export function StageGrid({ copy, scoresById, stages }: StageGridProps) {
  const { t } = useTranslation()
  if (stages.length === 0) {
    return <div className="py-2 text-sm text-muted-foreground">{t("event.noStagesDescription")}</div>
  }

  return (
    <section>
      <div className="grid gap-2 md:grid-cols-2">
        {stages.map((stage) => (
          <StageCard key={stage.id} score={scoresById.get(stage.id)} scoreLabel={copy.score} stage={stage} />
        ))}
      </div>
    </section>
  )
}

type StageCardProps = {
  score?: EventUserStageScore
  scoreLabel?: string
  stage: EventStageSummary
}

export function StageCard({ score, scoreLabel, stage }: StageCardProps) {
  const { t } = useTranslation()
  const className = "group relative block h-24 overflow-hidden rounded-xl bg-muted text-white shadow-sm"
  const content = (
    <>
      {stage.url ? (
        <div
          className="absolute inset-0 bg-cover bg-center transition duration-300 group-hover:scale-105"
          style={{ backgroundImage: `url(${stage.url})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(255,255,255,0.2),transparent_35%),linear-gradient(135deg,#111827,#374151)]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/35 to-black/80" />
      <div className="relative flex h-full items-center justify-between gap-3 p-3">
        <div className="min-w-0">
          <div className="truncate font-heading text-base font-semibold">{stage.artist} - {stage.title}</div>
          <div className="mt-1 truncate text-xs text-white/75">{t("event.mappedBy", { name: stage.mapper })}</div>
        </div>
        <div className="shrink-0 text-right text-xs">
          <ArrowSquareOut className="ml-auto size-4 opacity-70" weight="bold" />
          {score ? (
            <div className="mt-1.5">
              <div className="font-heading text-base font-semibold">#{score.rank}</div>
              <div className="text-xs text-white/75">{scoreLabel}: {formatScore(score.score)}</div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )

  return stage.pack_id ? (
    <Link className={className} to={`/pack/${stage.pack_id}?beatmap=${stage.map_id}`}>{content}</Link>
  ) : (
    <a className={className} href={`https://osu.ppy.sh/b/${stage.map_id}`} rel="noreferrer" target="_blank">{content}</a>
  )
}

export function EventRules({ copy }: { copy: EventCopy }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.rule}</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-2 text-sm text-muted-foreground">
          {copy.rules.map((rule) => (
            <li className="leading-6" key={rule}>{rule}</li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}

type LeaderboardCardProps =
  | {
    copy: EventCopy
    error: unknown
    highlightedRows: EventTotalRankItem[]
    hasMore: boolean
    isError: boolean
    isLoading: boolean
    isLoadingMore: boolean
    onLoadMore: () => void
    rows: EventTotalRankItem[]
    type: "event"
  }
  | {
    copy: EventCopy
    error: unknown
    highlightedRows: EventStageRankItem[]
    hasMore: boolean
    isError: boolean
    isLoading: boolean
    isLoadingMore: boolean
    onLoadMore: () => void
    rows: EventStageRankItem[]
    type: "stage"
  }

export function LeaderboardCard(props: LeaderboardCardProps) {
  const { copy, error, hasMore, highlightedRows, isError, isLoading, isLoadingMore, onLoadMore, rows, type } = props
  const remainingRankStart = HIGHLIGHTED_RANK_COUNT + 1
  const remainingRows = rows.slice(HIGHLIGHTED_RANK_COUNT)
  const podiumRows = highlightedRows.length > 0 ? highlightedRows : rows.slice(0, HIGHLIGHTED_RANK_COUNT)

  return (
    <div className="space-y-5">
      {isLoading ? (
        <LeaderboardSkeleton />
      ) : isError ? (
        <AppAlert tone="destructive">
          {getErrorMessage(error)}
        </AppAlert>
      ) : rows.length > 0 ? (
        <>
          <LeaderboardHighlights
            rows={podiumRows}
            scoreLabel={type === "event" ? copy.totalScore : copy.score}
            startRank={1}
          />
          <div className="overflow-hidden rounded-xl bg-muted/20">
            <div className="grid grid-cols-[5rem_minmax(0,1fr)_auto] gap-4 border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span>{type === "event" ? copy.totalRank : copy.rank}</span>
              <span>{copy.username}</span>
              <span className="text-right">{type === "event" ? copy.totalScore : copy.score}</span>
            </div>
            <div className="divide-y">
              {remainingRows.length > 0 ? (
                remainingRows.map((row, index) => (
                  <LeaderboardListRow
                    key={`${row.user_id}-${remainingRankStart + index}`}
                    rank={remainingRankStart + index}
                    score={type === "event" ? (row as EventTotalRankItem).totalScore : (row as EventStageRankItem).score}
                    user={row.user}
                    userId={row.user_id}
                  />
                ))
              ) : (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  {copy.noScore}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          {copy.noScore}
        </div>
      )}
      {!isLoading && !isError ? <LeaderboardLoadMore hasMore={hasMore} isLoading={isLoadingMore} onLoadMore={onLoadMore} /> : null}
    </div>
  )
}

function LeaderboardHighlights({
  rows,
  scoreLabel,
  startRank,
}: {
  rows: Array<EventTotalRankItem | EventStageRankItem>
  scoreLabel: string
  startRank: number
}) {
  const orderedRows = rows.map((row, index) => ({
    rank: startRank + index,
    score: "totalScore" in row ? row.totalScore : row.score,
    user: row.user,
    user_id: row.user_id,
  }))
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {orderedRows.map((row) => (
        <LeaderboardHighlightCard
          key={`${row.user_id}-${row.rank}`}
          rank={row.rank}
          score={row.score}
          scoreLabel={scoreLabel}
          user={row.user}
          userId={row.user_id}
        />
      ))}
    </div>
  )
}

function LeaderboardHighlightCard({
  rank,
  score,
  scoreLabel,
  user,
  userId,
}: {
  rank: number
  score: number | string
  scoreLabel: string
  user: { avatar: string | null; user_name: string }
  userId: number
}) {
  const cardTone =
    rank === 1
      ? "bg-amber-500/8"
      : rank === 2
        ? "bg-slate-500/7"
        : "bg-orange-500/8"
  const accentClassName =
    rank === 1
      ? "bg-amber-500"
      : rank === 2
        ? "bg-slate-400"
        : "bg-orange-500"
  const rankTone =
    rank === 1
      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
      : rank === 2
        ? "bg-slate-500/15 text-slate-700 dark:text-slate-300"
        : "bg-orange-500/15 text-orange-700 dark:text-orange-300"
  const medalIconTone =
    rank === 1
      ? "text-amber-500"
      : rank === 2
        ? "text-slate-400"
        : "text-orange-500"
  const avatarRingTone =
    rank === 1
      ? "ring-amber-500/35"
      : rank === 2
        ? "ring-slate-400/35"
        : "ring-orange-500/35"

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl p-3",
        cardTone,
      )}
    >
      <div className={cn("absolute inset-y-0 left-0 w-1", accentClassName)} />
      <div className="flex items-center justify-between gap-3 pl-1">
        <Link
          className="flex min-w-0 items-center gap-2.5 rounded-xl transition hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          to={`/user/${userId}`}
        >
          <div className={cn("rounded-full ring-2 ring-offset-2 ring-offset-background", avatarRingTone)}>
            <Avatar size="sm">
              {user.avatar ? <AvatarImage alt={user.user_name} src={user.avatar} /> : null}
              <AvatarFallback>{getUserInitial(user.user_name)}</AvatarFallback>
            </Avatar>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Badge className={cn("h-5 rounded-full px-1.5 text-[11px] font-semibold", rankTone)} variant="secondary">
                #{rank}
              </Badge>
              <Medal className={cn("size-4 shrink-0", medalIconTone)} weight="fill" />
            </div>
            <div className="mt-1 truncate font-medium">{user.user_name}</div>
          </div>
        </Link>
        <div className="min-w-0 shrink-0 text-right">
          <div className="text-[11px] text-muted-foreground">{scoreLabel}</div>
          <div className="font-heading text-xl font-semibold tabular-nums">
            {formatScore(score)}
          </div>
        </div>
      </div>
    </div>
  )
}

function LeaderboardListRow({
  rank,
  score,
  user,
  userId,
}: {
  rank: number
  score: number | string
  user: { avatar: string | null; user_name: string }
  userId: number
}) {
  return (
    <div className="grid grid-cols-[5rem_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 transition hover:bg-muted/40">
      <div className="inline-flex items-center gap-2 font-medium">
        <span className="inline-flex min-w-10 justify-center rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
          #{rank}
        </span>
      </div>
      <Link
        className="flex min-w-0 items-center gap-3 rounded-lg transition hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        to={`/user/${userId}`}
      >
        <Avatar size="sm">
          {user.avatar ? <AvatarImage alt={user.user_name} src={user.avatar} /> : null}
          <AvatarFallback>{getUserInitial(user.user_name)}</AvatarFallback>
        </Avatar>
        <span className="truncate font-medium">{user.user_name}</span>
      </Link>
      <div className="text-right font-mono text-sm font-semibold tabular-nums">
        {formatScore(score)}
      </div>
    </div>
  )
}

function LeaderboardSkeleton() {
  return (
    <>
      <div className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div className="rounded-2xl border bg-background p-4" key={index}>
            <Skeleton className="h-6 w-12" />
            <div className="mt-4 flex items-center gap-3">
              <Skeleton className="size-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
            <Skeleton className="mt-5 h-8 w-24" />
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl bg-muted/20">
        <div className="grid grid-cols-[5rem_minmax(0,1fr)_auto] gap-4 border-b px-4 py-3">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="ml-auto h-4 w-16" />
        </div>
        <div className="divide-y">
          {Array.from({ length: EVENT_LEADERBOARD_PAGE_SIZE }, (_, index) => (
            <div className="grid grid-cols-[5rem_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3" key={index}>
              <Skeleton className="h-7 w-10" />
              <div className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="ml-auto h-5 w-20" />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function LeaderboardLoadMore({ hasMore, isLoading, onLoadMore }: { hasMore: boolean; isLoading: boolean; onLoadMore: () => void }) {
  const { t } = useTranslation()
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore || isLoading) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) onLoadMore()
    }, { rootMargin: "240px" })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, isLoading, onLoadMore])

  return (
    <div ref={sentinelRef} aria-live="polite" className="grid min-h-8 place-items-center" role="status">
      {isLoading ? <span className="text-sm text-muted-foreground">{t("event.loadingMore")}</span> : null}
    </div>
  )
}

export function EventDetailSkeleton() {
  return (
    <section className="space-y-6">
      <div className="rounded-3xl border bg-card p-8">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="mt-5 h-12 w-2/3" />
        <Skeleton className="mt-3 h-5 w-56" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="space-y-4">
          <Skeleton className="h-10 w-96 max-w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <Skeleton className="hidden h-48 xl:block" />
      </div>
    </section>
  )
}
