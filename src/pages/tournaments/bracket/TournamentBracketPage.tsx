import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { useTournamentBracketQuery, useTournamentDetailQuery } from "@/entities/tournament"
import { Button } from "@/components/ui/button"
import { AppAlert, getErrorMessage, PageSkeleton, PageState } from "@/shared/components"
import { cn } from "@/lib/utils"
import { TournamentBreadcrumb } from "../_shared/TournamentBreadcrumb"
import { DoubleEliminationBracketView, ScheduleRoundJumpNav, ScheduleView } from "./components"
import {
  createTournamentMatchNumbers,
  groupScheduleRounds,
  toDoubleEliminationMatches,
} from "./model"

export function TournamentBracketPage() {
  const { t } = useTranslation()
  const { tid } = useParams()
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<"bracket" | "list">("list")
  const tournamentQuery = useTournamentDetailQuery(tid)
  const bracketQuery = useTournamentBracketQuery(tid)
  const matches = bracketQuery.data ?? []
  const visibleMatches = matches.filter((match) => !match.hidden_until_match_id || match.is_possible === 0)
  const matchLookup = useMemo(() => new Map(visibleMatches.map((match) => [match.id, match])), [visibleMatches])
  const scheduleRounds = useMemo(() => groupScheduleRounds(visibleMatches), [visibleMatches])
  const scheduleMatchNumbers = useMemo(() => createTournamentMatchNumbers(visibleMatches), [visibleMatches])
  const bracketMatches = useMemo(
    () => toDoubleEliminationMatches(visibleMatches, tid ?? "", scheduleMatchNumbers),
    [tid, visibleMatches, scheduleMatchNumbers],
  )

  if (bracketQuery.isError || tournamentQuery.isError) {
    return <PageState title={t("tournament.bracket.loadFailed")} description={getErrorMessage(bracketQuery.error ?? tournamentQuery.error)} />
  }

  return (
    <main className="flex min-h-[calc(100dvh-4rem)] flex-col gap-4 pb-6">
      <div className="sticky top-[calc(4rem+1px)] z-30 bg-background/92 backdrop-blur">
        <div className={cn("w-full px-3 py-2 sm:px-6 lg:px-8", viewMode === "list" && "mx-auto max-w-6xl")}>
          <TournamentBreadcrumb current={t("tournament.common.schedule")} tournament={tournamentQuery.data} tournamentId={tid} />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-heading text-3xl font-semibold">{t("tournament.common.schedule")}</h1>
            <div className="flex rounded-lg border bg-card p-1">
              <Button size="sm" type="button" variant={viewMode === "list" ? "default" : "ghost"} onClick={() => setViewMode("list")}>
                {t("tournament.common.listView")}
              </Button>
              <Button size="sm" type="button" variant={viewMode === "bracket" ? "default" : "ghost"} onClick={() => setViewMode("bracket")}>
                {t("tournament.common.bracketView")}
              </Button>
            </div>
          </div>
          {viewMode === "list" ? <ScheduleRoundJumpNav rounds={scheduleRounds} /> : null}
        </div>
      </div>

      <div className={cn("w-full px-3 sm:px-6 lg:px-8", viewMode === "list" && "mx-auto max-w-6xl")}>
        {bracketQuery.isLoading ? <PageSkeleton className="py-4" /> : null}
        {!bracketQuery.isLoading && matches.length === 0 ? (
          <AppAlert title={t("tournament.bracket.emptyTitle")}>{t("tournament.bracket.emptyDescription")}</AppAlert>
        ) : null}
      </div>

      {viewMode === "list" ? (
        <ScheduleView matchLookup={matchLookup} matchNumbers={scheduleMatchNumbers} rounds={scheduleRounds} tournamentId={tid ?? ""} />
      ) : null}

      <div className={cn("w-full", viewMode !== "bracket" && "hidden")}>
        {visibleMatches.length > 0 ? (
          <DoubleEliminationBracketView
            matches={bracketMatches}
            onMatchClick={(match) => {
              const href = typeof match.href === "string" ? match.href : null
              if (href) navigate(href)
            }}
          />
        ) : null}
      </div>
    </main>
  )
}
