import { ChartBar, Trophy } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import {
  usePackLeaderboardInfiniteQuery,
  useSubmitPackBeatmapScoreMutation,
  type PackLeaderboardEntry,
} from "@/entities/pack"
import { useAuthStore } from "@/features/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AppAlert, getErrorMessage } from "@/shared/components"

const PAGE_SIZE = 10

type PackLeaderboardProps = {
  beatmapId: number
  packId: number
  title: string
  version: string
}

export function PackLeaderboard({ beatmapId, packId, title, version }: PackLeaderboardProps) {
  const { t } = useTranslation()
  const isLogged = useAuthStore((state) => state.isLogged)
  const openLoginDialog = useAuthStore((state) => state.openLoginDialog)
  const leaderboardQuery = usePackLeaderboardInfiniteQuery({ beatmapId, packId, pageSize: PAGE_SIZE })
  const submitMutation = useSubmitPackBeatmapScoreMutation()
  const leaderboard = leaderboardQuery.data?.pages[0]
  const entries = leaderboardQuery.data?.pages.flatMap((page) => page.data) ?? []

  if (leaderboardQuery.isLoading) return null

  if (leaderboardQuery.isError && !leaderboard) {
    return (
      <section className="border-t p-5 sm:p-6">
        <AppAlert tone="destructive">{getErrorMessage(leaderboardQuery.error)}</AppAlert>
      </section>
    )
  }

  if (!leaderboard?.enabled) return null

  const submitScore = () => {
    if (!isLogged) {
      openLoginDialog(`/pack/${packId}?beatmap=${beatmapId}`)
      return
    }
    submitMutation.mutate(
      { beatmapId, packId },
      { onSuccess: () => toast.success(t("pack.leaderboard.submitSuccess")) },
    )
  }

  return (
    <section className="border-t p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="inline-flex items-center gap-2 font-heading text-lg font-semibold">
            <Trophy className="size-5 shrink-0 text-amber-500" weight="fill" />
            {t("pack.leaderboard.title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("pack.leaderboard.description", { title, version })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {leaderboard.activeEventId ? (
            <Button asChild size="sm" variant="outline">
              <Link to={`/event/${leaderboard.activeEventId}`}>{t("pack.leaderboard.openEvent")}</Link>
            </Button>
          ) : null}
          {leaderboard.canSubmit ? (
            <Button disabled={submitMutation.isPending} onClick={submitScore} size="sm" type="button">
              <ChartBar className="size-4" weight="bold" />
              {submitMutation.isPending ? t("pack.leaderboard.submitting") : t("pack.leaderboard.submit")}
            </Button>
          ) : null}
        </div>
      </div>

      {submitMutation.error ? <AppAlert className="mt-4" tone="destructive">{getErrorMessage(submitMutation.error)}</AppAlert> : null}

      {entries.length > 0 ? (
        <div className="mt-5">
          <div className="grid grid-cols-[1.5rem_minmax(0,1fr)_3.75rem_2.75rem_2.5rem_3.5rem] gap-0.5 border-b px-0.5 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground lg:grid-cols-[2.25rem_minmax(7rem,1fr)_repeat(6,3.25rem)_6rem_4.5rem_3rem_6rem_8.5rem] lg:gap-2 lg:px-2 lg:text-xs">
            <span className="text-left" aria-label={t("pack.leaderboard.rank")}>#</span>
            <span className="text-left">{t("pack.leaderboard.player")}</span>
            <span className="hidden lg:block">320</span>
            <span className="hidden lg:block">300</span>
            <span className="hidden lg:block">200</span>
            <span className="hidden lg:block">100</span>
            <span className="hidden lg:block">50</span>
            <span className="hidden lg:block">Miss</span>
            <span>{t("pack.leaderboard.score")}</span>
            <span>{t("pack.leaderboard.accuracy")}</span>
            <span className="hidden lg:block">{t("pack.leaderboard.grade")}</span>
            <span>{t("pack.leaderboard.mods")}</span>
            <span>{t("pack.leaderboard.date")}</span>
          </div>
          <div className="divide-y">
            {entries.map((entry) => (
              <LeaderboardRow
                entry={entry}
                isCurrentUser={leaderboard.personal?.user_id === entry.user_id}
                key={entry.user_id}
              />
            ))}
          </div>
          {leaderboardQuery.isFetchNextPageError ? (
            <AppAlert className="mt-4" tone="destructive">{getErrorMessage(leaderboardQuery.error)}</AppAlert>
          ) : null}
          {leaderboardQuery.hasNextPage ? (
            <div className="flex justify-center pt-4">
              <Button
                disabled={leaderboardQuery.isFetchingNextPage}
                onClick={() => leaderboardQuery.fetchNextPage()}
                size="sm"
                type="button"
                variant="outline"
              >
                {leaderboardQuery.isFetchingNextPage
                  ? t("pack.leaderboard.loadingMore")
                  : t("pack.leaderboard.loadMore")}
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-5 px-4 py-10 text-center text-sm text-muted-foreground">
          {t("pack.leaderboard.empty")}
        </div>
      )}

    </section>
  )
}

function LeaderboardRow({ entry, isCurrentUser }: { entry: PackLeaderboardEntry; isCurrentUser: boolean }) {
  return (
    <div
      aria-current={isCurrentUser ? "true" : undefined}
      className={cn(
        "grid grid-cols-[1.5rem_minmax(0,1fr)_3.75rem_2.75rem_2.5rem_3.5rem] items-center gap-0.5 px-0.5 py-2 lg:grid-cols-[2.25rem_minmax(7rem,1fr)_repeat(6,3.25rem)_6rem_4.5rem_3rem_6rem_8.5rem] lg:gap-2 lg:px-2",
        isCurrentUser && "bg-primary/10",
      )}
    >
      <span className="font-heading text-xs font-semibold tabular-nums sm:text-sm">#{entry.rank}</span>
      <Link className="flex min-w-0 items-center gap-2 text-xs hover:opacity-80 sm:text-sm" to={`/user/${entry.user_id}`}>
        <Avatar className="hidden sm:flex" size="sm">
          {entry.user.avatar ? <AvatarImage alt={entry.user.user_name} src={entry.user.avatar} /> : null}
          <AvatarFallback>{entry.user.user_name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className={cn("truncate font-medium", isCurrentUser && "font-semibold text-primary")}>{entry.user.user_name}</span>
      </Link>
      <StatisticValue entry={entry} name="perfect" />
      <StatisticValue entry={entry} name="great" />
      <StatisticValue entry={entry} name="good" />
      <StatisticValue entry={entry} name="ok" />
      <StatisticValue entry={entry} name="meh" />
      <StatisticValue entry={entry} name="miss" />
      <span className="text-center font-mono text-xs font-semibold tabular-nums sm:text-sm">
        {formatScore(entry.score)}
      </span>
      <span className="text-center font-mono text-[10px] tabular-nums sm:text-xs">
        {formatAccuracy(entry.accuracy)}
      </span>
      <span className="hidden text-center text-xs font-semibold lg:block">{entry.score_rank || ""}</span>
      <ScoreMods entry={entry} />
      <ScoreDate abbreviated className="text-center lg:hidden" entry={entry} />
      <ScoreDate className="hidden text-center lg:block" entry={entry} />
    </div>
  )
}

function StatisticValue({ entry, name }: { entry: PackLeaderboardEntry; name: keyof NonNullable<PackLeaderboardEntry["statistics"]> }) {
  const value = entry.statistics?.[name]
  return (
    <span className="hidden text-center font-mono text-[11px] tabular-nums lg:block">
      {value === undefined || value === null ? "" : formatScore(value)}
    </span>
  )
}

function ScoreMods({ entry }: { entry: PackLeaderboardEntry }) {
  const mods = entry.mods?.map((mod) => mod.acronym).filter(Boolean).join("") || (entry.mods ? "NM" : "")
  return (
    <span className="flex min-w-0 items-center justify-center gap-1 overflow-hidden text-[9px] font-semibold sm:text-[10px]">
      {entry.is_lazer ? (
        <span className="shrink-0 rounded bg-fuchsia-500/15 px-1 py-0.5 text-[8px] font-bold uppercase leading-none text-fuchsia-500 lg:text-[9px]">
          <span className="lg:hidden">L</span>
          <span className="hidden lg:inline">Lazer</span>
        </span>
      ) : null}
      <span className="truncate">{mods}</span>
    </span>
  )
}

function ScoreDate({ abbreviated = false, className = "", entry }: { abbreviated?: boolean; className?: string; entry: PackLeaderboardEntry }) {
  const { i18n } = useTranslation()
  const date = entry.played_at
  if (!date) return null
  const locale = i18n.resolvedLanguage?.startsWith("zh") ? "zh-CN" : "en-GB"
  return (
    <span className={`whitespace-nowrap text-[10px] text-muted-foreground sm:text-xs ${className}`}>
      {formatDate(date, locale, abbreviated)}
    </span>
  )
}

function formatScore(score: number) {
  return new Intl.NumberFormat().format(score)
}

function formatAccuracy(accuracy: number | null) {
  if (accuracy === null || !Number.isFinite(accuracy)) return ""
  return `${(accuracy * 100).toFixed(2)}%`
}

function formatDate(value: string, locale: string, abbreviated: boolean) {
  const compactChinese = abbreviated && locale === "zh-CN"
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: compactChinese ? "numeric" : abbreviated ? "short" : "long",
    year: abbreviated ? "2-digit" : "numeric",
  }).format(new Date(value))
}
