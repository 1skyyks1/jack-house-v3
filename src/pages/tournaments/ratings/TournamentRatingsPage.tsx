import { ArrowUpRight, Info } from "@phosphor-icons/react"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { useTournamentDetailQuery, useTournamentPerformanceQuery, type TournamentPlayerRating } from "@/entities/tournament"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AppAlert, DetailPageSkeleton, getErrorMessage, PageState } from "@/shared/components"
import { TournamentBreadcrumb } from "../_shared/TournamentBreadcrumb"
import { TournamentStatsTabs } from "../_shared/TournamentStatsTabs"
import { getTournamentPublicPath } from "../_shared/tournamentVisuals"

export function TournamentRatingsPage() {
  const { t } = useTranslation()
  const { tid } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const tournamentQuery = useTournamentDetailQuery(tid)
  const performanceQuery = useTournamentPerformanceQuery(tid)
  const publicTournamentPath = tournamentQuery.data ? getTournamentPublicPath(tournamentQuery.data) : `/t/${tid ?? ""}`

  useEffect(() => {
    if (!tournamentQuery.data) return
    const canonicalPath = `${getTournamentPublicPath(tournamentQuery.data)}/ratings`
    if (location.pathname !== canonicalPath) navigate(`${canonicalPath}${location.hash}`, { replace: true })
  }, [location.hash, location.pathname, navigate, tournamentQuery.data])

  if (tournamentQuery.isError || performanceQuery.isError) {
    return <PageState title={t("tournament.playerPerformance.loadFailed")} description={getErrorMessage(tournamentQuery.error ?? performanceQuery.error)} />
  }
  if (tournamentQuery.isLoading || performanceQuery.isLoading) return <DetailPageSkeleton />

  const ratings = performanceQuery.data?.ratings ?? []

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TournamentBreadcrumb current={t("tournament.common.stats")} tournament={tournamentQuery.data} tournamentId={tid} />
        <TournamentStatsTabs active="ratings" publicTournamentPath={publicTournamentPath} />
      </div>

      {ratings.length === 0 ? (
        <AppAlert title={t("tournament.playerPerformance.emptyTitle")}>{t("tournament.playerPerformance.emptyDescription")}</AppAlert>
      ) : (
        <div className="space-y-6">
          <PerformanceMethodNotice />
          <section>
            {ratings.map((rating, index) => (
              <RatingRow key={rating.player.id} position={index + 1} rating={rating} />
            ))}
          </section>
        </div>
      )}
    </main>
  )
}

function PerformanceMethodNotice() {
  const { t } = useTranslation()

  return (
    <div className="flex gap-3 border-l-2 border-primary/50 bg-primary/[0.045] px-4 py-3 sm:px-5">
      <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div>
        <div className="text-sm font-semibold">{t("tournament.playerPerformance.methodTitle")}</div>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{t("tournament.playerPerformance.methodSummary")}</p>
      </div>
    </div>
  )
}

function RatingRow({ position, rating }: { position: number; rating: TournamentPlayerRating }) {
  const playerName = rating.player.user_name_snapshot || rating.player.user?.user_name || `Player ${rating.player.id}`
  const avatar = rating.player.avatar_snapshot || rating.player.user?.avatar || undefined
  const teamName = rating.team?.display_name || rating.team?.name || "—"
  const profilePath = rating.player.user_id ? `/user/${rating.player.user_id}` : null
  const isPodium = position <= 3
  const content = (
    <div className="group grid grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-3 py-3 transition hover:bg-foreground/[0.025] sm:grid-cols-[4.75rem_minmax(0,1fr)_auto] sm:gap-4">
      <div className="relative pl-1 sm:pl-2">
        <span className={`font-heading text-xl font-semibold tabular-nums ${isPodium ? "text-foreground" : "text-muted-foreground"}`}>
          {String(position).padStart(2, "0")}
        </span>
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="size-9">
          <AvatarImage src={avatar} />
          <AvatarFallback>{Array.from(playerName)[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="truncate text-base font-semibold tracking-tight">{playerName}</div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">{teamName}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 pr-1 text-right sm:pr-2">
        <div className="font-mono text-xl font-semibold tabular-nums tracking-tight">{Math.round(rating.tournament_rating)}</div>
        {profilePath ? <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" /> : null}
      </div>
    </div>
  )

  return profilePath ? <Link to={profilePath}>{content}</Link> : content
}
