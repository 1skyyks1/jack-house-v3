import { ChartBar, Question, Trophy } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import gradeA from "@/assets/pic/osu/grades/grade-a.svg"
import gradeB from "@/assets/pic/osu/grades/grade-b.svg"
import gradeC from "@/assets/pic/osu/grades/grade-c.svg"
import gradeD from "@/assets/pic/osu/grades/grade-d.svg"
import gradeSSilver from "@/assets/pic/osu/grades/grade-s-silver.svg"
import gradeS from "@/assets/pic/osu/grades/grade-s.svg"
import gradeSSSilver from "@/assets/pic/osu/grades/grade-ss-silver.svg"
import gradeSS from "@/assets/pic/osu/grades/grade-ss.svg"
import {
  usePackLeaderboardInfiniteQuery,
  useSyncPackScoresMutation,
  type PackLeaderboardEntry,
} from "@/entities/pack"
import { UserHoverCard } from "@/entities/user"
import { useAuthStore } from "@/features/auth"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
  const submitMutation = useSyncPackScoresMutation()
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
    submitMutation.mutate(packId, {
      onSuccess: (response) => toast.success(t("pack.leaderboard.submitSuccess", response.data)),
    })
  }

  return (
    <section className="@container/leaderboard border-t p-5 sm:p-6">
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
          {leaderboard.canSubmit ? (
            <>
              <Button disabled={submitMutation.isPending} onClick={submitScore} size="sm" type="button">
                <ChartBar className="size-4" weight="bold" />
                {submitMutation.isPending ? t("pack.leaderboard.submitting") : t("pack.leaderboard.submit")}
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      aria-label={t("pack.leaderboard.submitHelpLabel")}
                      className="inline-flex size-6 cursor-help items-center justify-center text-muted-foreground transition hover:text-foreground"
                      role="button"
                      tabIndex={0}
                    >
                      <Question aria-hidden="true" className="size-4" weight="bold" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="w-80 max-w-[calc(100vw-2rem)] flex-col items-start whitespace-normal p-3 leading-5">
                    <p>{t("pack.leaderboard.submitDescription")}</p>
                    <p className="mt-2 text-background/75">
                      <span className="font-semibold text-background">Tips：</span>{t("pack.leaderboard.submitTip")}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          ) : null}
        </div>
      </div>

      {submitMutation.error ? <AppAlert className="mt-4" tone="destructive">{getErrorMessage(submitMutation.error)}</AppAlert> : null}

      {entries.length > 0 ? (
        <div className="mt-5">
          <div className="grid grid-cols-[1.75rem_minmax(0,1fr)_3.625rem_2.625rem_3.125rem] gap-0.5 border-b px-0.5 py-2 text-center text-[9px] font-semibold uppercase tracking-wide text-muted-foreground min-[360px]:grid-cols-[1.75rem_minmax(0,1fr)_3.625rem_2.625rem_3.125rem_3.375rem] lg:grid-cols-[2.5rem_minmax(5rem,1fr)_repeat(6,2.25rem)_5.25rem_3.75rem_2.5rem_5rem_6.5rem] lg:gap-1 lg:px-1 lg:text-[11px] @5xl/leaderboard:grid-cols-[3rem_minmax(7rem,1fr)_repeat(6,3.25rem)_6rem_4.5rem_3rem_6rem_8.5rem] @5xl/leaderboard:gap-2 @5xl/leaderboard:px-2 @5xl/leaderboard:text-xs">
            <span className="text-left">{t("pack.leaderboard.rank")}</span>
            <span className="text-left">{t("pack.leaderboard.player")}</span>
            <span className="hidden text-sky-300 lg:block">320</span>
            <span className="hidden text-sky-400 lg:block">300</span>
            <span className="hidden text-green-400 lg:block">200</span>
            <span className="hidden text-lime-400 lg:block">100</span>
            <span className="hidden text-amber-300 lg:block">50</span>
            <span className="hidden text-red-400 lg:block">Miss</span>
            <span>{t("pack.leaderboard.score")}</span>
            <span>{t("pack.leaderboard.accuracy")}</span>
            <span className="hidden lg:block">{t("pack.leaderboard.grade")}</span>
            <span>{t("pack.leaderboard.mods")}</span>
            <span className="hidden min-[360px]:block lg:block">{t("pack.leaderboard.date")}</span>
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
        "grid grid-cols-[1.75rem_minmax(0,1fr)_3.625rem_2.625rem_3.125rem] items-center gap-0.5 px-0.5 py-1.5 min-[360px]:grid-cols-[1.75rem_minmax(0,1fr)_3.625rem_2.625rem_3.125rem_3.375rem] lg:grid-cols-[2.5rem_minmax(5rem,1fr)_repeat(6,2.25rem)_5.25rem_3.75rem_2.5rem_5rem_6.5rem] lg:gap-1 lg:px-1 @5xl/leaderboard:grid-cols-[3rem_minmax(7rem,1fr)_repeat(6,3.25rem)_6rem_4.5rem_3rem_6rem_8.5rem] @5xl/leaderboard:gap-2 @5xl/leaderboard:px-2",
        isCurrentUser && "bg-primary/10",
      )}
    >
      <span className="text-[10px] font-semibold tabular-nums lg:text-xs">#{entry.rank}</span>
      <UserHoverCard
        avatar={entry.user.avatar}
        userId={entry.user_id}
        userName={entry.user.user_name}
      >
        <Link
          className={cn(
            "block min-w-0 truncate text-[11px] font-medium hover:text-primary lg:text-[13px]",
            isCurrentUser && "font-semibold text-primary",
          )}
          to={`/user/${entry.user_id}`}
        >
          {entry.user.user_name}
        </Link>
      </UserHoverCard>
      <StatisticValue entry={entry} name="perfect" />
      <StatisticValue entry={entry} name="great" />
      <StatisticValue entry={entry} name="good" />
      <StatisticValue entry={entry} name="ok" />
      <StatisticValue entry={entry} name="meh" />
      <StatisticValue entry={entry} name="miss" />
      <span className="text-center text-[10px] tabular-nums lg:text-xs">
        {formatScore(entry.score)}
      </span>
      <span
        className={cn(
          "text-center text-[10px] font-medium tabular-nums lg:text-xs",
          entry.accuracy === 1 && "text-emerald-300",
        )}
      >
        {formatAccuracy(entry.accuracy)}
      </span>
      <GradeIcon entry={entry} />
      <ScoreMods entry={entry} />
      <ScoreDate abbreviated className="hidden text-center min-[360px]:block lg:hidden" entry={entry} />
      <ScoreDate className="hidden text-center lg:block" entry={entry} />
    </div>
  )
}

function StatisticValue({ entry, name }: { entry: PackLeaderboardEntry; name: keyof NonNullable<PackLeaderboardEntry["statistics"]> }) {
  const rawValue = Number(entry.statistics?.[name] ?? 0)
  const value = Number.isFinite(rawValue) ? rawValue : 0
  return (
    <span
      className={cn(
        "hidden text-center text-xs font-medium tabular-nums lg:block",
        statisticColor[name],
        value === 0 && "opacity-45",
      )}
    >
      {formatScore(value)}
    </span>
  )
}

const statisticColor: Record<keyof NonNullable<PackLeaderboardEntry["statistics"]>, string> = {
  perfect: "text-sky-300",
  great: "text-sky-400",
  good: "text-green-400",
  ok: "text-lime-400",
  meh: "text-amber-300",
  miss: "text-red-400",
}

const gradeIcon = {
  A: gradeA,
  B: gradeB,
  C: gradeC,
  D: gradeD,
  S: gradeS,
  SH: gradeSSilver,
  SS: gradeSS,
  SSH: gradeSSSilver,
} as const

function GradeIcon({ entry }: { entry: PackLeaderboardEntry }) {
  const rawRank = entry.score_rank?.toUpperCase()
  if (!rawRank) return <span className="hidden lg:block" />

  const hasSilverMod = entry.mods?.some((mod) => ["HD", "FI", "FL"].includes(mod.acronym.toUpperCase())) ?? false
  const normalizedRank = rawRank === "XH"
    ? "SSH"
    : rawRank === "X"
      ? hasSilverMod ? "SSH" : "SS"
      : rawRank === "SH"
        ? "SH"
        : rawRank === "SS" && hasSilverMod
          ? "SSH"
          : rawRank === "S" && hasSilverMod
            ? "SH"
            : rawRank
  const icon = gradeIcon[normalizedRank as keyof typeof gradeIcon]

  return (
    <span className="hidden items-center justify-center lg:flex">
      {icon ? <img alt={normalizedRank} className="h-5 w-10 object-contain" src={icon} /> : rawRank}
    </span>
  )
}

function ScoreMods({ entry }: { entry: PackLeaderboardEntry }) {
  const mods = entry.mods
    ?.map((mod) => mod.acronym)
    .filter((acronym) => acronym && acronym.toUpperCase() !== "CL")
    .map((acronym) => acronym.toUpperCase()) ?? []
  return (
    <span
      className="flex min-w-0 items-center justify-center gap-px overflow-hidden text-[8px] font-semibold lg:gap-0.5 lg:text-[9px]"
      title={mods.join(" + ")}
    >
      {entry.is_lazer ? (
        <span className="shrink-0 rounded bg-fuchsia-500/15 px-1 py-0.5 text-[7px] font-bold uppercase leading-none text-fuchsia-500 lg:text-[9px]">
          <span className="lg:hidden">L</span>
          <span className="hidden lg:inline">Lazer</span>
        </span>
      ) : null}
      {mods.map((mod, index) => (
        <span
          className={cn(
            "flex h-5 min-w-5 shrink-0 items-center justify-center px-1 font-bold leading-none [clip-path:polygon(12%_0,88%_0,100%_50%,88%_100%,12%_100%,0_50%)] lg:h-6 lg:min-w-9 lg:px-2",
            index > 0 && "hidden lg:flex",
            mod === "NF"
              ? "bg-[#f06d68] text-[#67252b]"
              : "bg-[#8468f4] text-[#2d176f]",
          )}
          key={mod}
          title={mod}
        >
          {mod}
        </span>
      ))}
      {mods.length > 1 ? (
        <span className="shrink-0 text-[8px] font-bold leading-none text-muted-foreground lg:hidden">
          +{mods.length - 1}
        </span>
      ) : null}
    </span>
  )
}

function ScoreDate({ abbreviated = false, className = "", entry }: { abbreviated?: boolean; className?: string; entry: PackLeaderboardEntry }) {
  const { i18n } = useTranslation()
  const date = entry.played_at
  if (!date) return null
  const locale = i18n.resolvedLanguage?.startsWith("zh") ? "zh-CN" : "en-GB"
  return (
    <span className={`whitespace-nowrap text-[10px] font-medium text-muted-foreground lg:text-xs ${className}`}>
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
