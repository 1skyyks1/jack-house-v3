import { ArrowLeft, CaretDown, Crown, GitBranch, Trophy } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router-dom"
import { useTournamentBracketQuery, useTournamentDetailQuery, type TournamentMatch } from "@/entities/tournament"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { AppAlert, getErrorMessage, PageState } from "@/shared/components"
import { cn } from "@/lib/utils"

export function TournamentBracketPage() {
  const { t } = useTranslation()
  const { tid } = useParams()
  const tournamentQuery = useTournamentDetailQuery(tid)
  const bracketQuery = useTournamentBracketQuery(tid)

  if (bracketQuery.isError || tournamentQuery.isError) {
    return <PageState title={t("tournament.bracket.loadFailed")} description={getErrorMessage(bracketQuery.error ?? tournamentQuery.error)} />
  }

  const matches = bracketQuery.data ?? []
  const visibleMatches = matches.filter((match) => !match.hidden_until_match_id || match.is_possible === 0)
  const hiddenMatches = matches.length - visibleMatches.length
  const sections = groupBracketSections(visibleMatches, t)

  return (
    <main className="flex min-h-[calc(100dvh-4rem)] flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button asChild className="px-0" variant="link">
            <Link to={`/t/${tid}`}>
              <ArrowLeft className="size-4" />
              {tournamentQuery.data?.acronym ?? t("tournament.common.tournament")}
            </Link>
          </Button>
          <h1 className="font-heading text-3xl font-semibold">{t("tournament.bracket.title", { name: tournamentQuery.data?.name ?? t("tournament.common.tournament") })}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className="gap-1" variant="secondary">
            <Trophy className="size-3.5" weight="bold" />
            {t("tournament.bracket.doubleElimination")}
          </Badge>
          {hiddenMatches > 0 ? <Badge variant="outline">{t("tournament.bracket.hiddenReset", { count: hiddenMatches })}</Badge> : null}
        </div>
      </div>

      {bracketQuery.isLoading ? <PageState title={t("tournament.bracket.loading")} description={t("tournament.bracket.loadingDescription")} /> : null}
      {!bracketQuery.isLoading && matches.length === 0 ? (
        <AppAlert title={t("tournament.bracket.emptyTitle")}>{t("tournament.bracket.emptyDescription")}</AppAlert>
      ) : null}

      <div className="grid gap-5">
        {sections.map((section) => (
          <BracketSection key={section.group} section={section} tournamentId={tid ?? ""} />
        ))}
      </div>
    </main>
  )
}

function BracketSection({ section, tournamentId }: { section: BracketSectionData; tournamentId: string }) {
  const { t } = useTranslation()
  const isFinals = section.group === "grand_final" || section.group === "reset_final"

  return (
    <section className={cn("overflow-hidden rounded-2xl border bg-card", isFinals && "border-primary/30 bg-primary/[0.03]")}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/35 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className={cn("flex size-10 items-center justify-center rounded-full bg-background text-primary", isFinals && "bg-primary text-primary-foreground")}>
            {isFinals ? <Crown className="size-5" weight="bold" /> : <GitBranch className="size-5" weight="bold" />}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t(`tournament.bracket.group.${section.group}`, { defaultValue: section.group })}</p>
            <h2 className="font-heading text-2xl font-semibold">{section.title}</h2>
          </div>
        </div>
        <Badge variant="outline">{t("tournament.common.matches", { count: section.rounds.reduce((total, round) => total + round.matches.length, 0) })}</Badge>
      </div>

      <div className="space-y-3 p-3 md:hidden">
        {section.rounds.map((round, index) => (
          <MobileRound key={round.key} round={round} defaultOpen={index === 0 || isFinals} tournamentId={tournamentId} />
        ))}
      </div>

      <div className="hidden overflow-x-auto p-4 md:block">
        <div className="flex min-w-max gap-4 pb-2">
          {section.rounds.map((round) => (
            <div className={cn("w-72 shrink-0", isFinals && "w-80")} key={round.key}>
              <div className="sticky top-0 z-10 mb-3 rounded-xl border bg-background px-3 py-2 shadow-sm">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Round {round.roundNo ?? "-"}</p>
                <h3 className="font-heading text-lg font-semibold">{round.name}</h3>
              </div>
              <div className={cn("space-y-3", round.matches.length <= 2 && "pt-2")}>
                {round.matches.map((match) => (
                  <BracketMatchCard key={match.id} match={match} tournamentId={tournamentId} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function MobileRound({
  defaultOpen,
  round,
  tournamentId,
}: {
  defaultOpen?: boolean
  round: BracketRoundData
  tournamentId: string
}) {
  const { t } = useTranslation()
  return (
    <Collapsible className="rounded-xl border bg-background" defaultOpen={defaultOpen}>
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-3 px-3 py-3 text-left">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">{t("tournament.common.round", { round: round.roundNo ?? "-" })}</p>
          <h3 className="font-heading text-lg font-semibold">{round.name}</h3>
          <p className="text-xs text-muted-foreground">{t("tournament.common.matches", { count: round.matches.length })}</p>
        </div>
        <CaretDown className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-3 border-t p-3">
          {round.matches.map((match) => (
            <BracketMatchCard key={match.id} match={match} tournamentId={tournamentId} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function BracketMatchCard({ match, tournamentId }: { match: TournamentMatch; tournamentId: string }) {
  const { t } = useTranslation()
  const isComplete = match.status === 2

  return (
    <Link
      className={cn(
        "block rounded-xl border bg-background p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
        isComplete && "border-primary/25",
      )}
      to={`/t/${tournamentId}/match/${match.id}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{t("tournament.common.match", { id: match.id })} · {t("tournament.common.slot")} {match.slot_no ?? "-"}</span>
        <Badge variant={isComplete ? "default" : "outline"}>{isComplete ? t("tournament.common.done") : t("tournament.common.notStarted")}</Badge>
      </div>
      <TeamLine isWinner={match.winner_id === match.team1_id} name={match.team1?.display_name ?? sourceLabel(match, 1)} score={match.team1_score} />
      <TeamLine isWinner={match.winner_id === match.team2_id} name={match.team2?.display_name ?? sourceLabel(match, 2)} score={match.team2_score} />
      {match.result_type && match.result_type !== "normal" ? (
        <p className="mt-2 text-xs uppercase text-muted-foreground">{match.result_type}</p>
      ) : null}
    </Link>
  )
}

function TeamLine({ isWinner, name, score }: { isWinner: boolean; name: string; score: number }) {
  return (
    <div className={cn("mt-1 flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm", isWinner && "bg-primary/10 font-semibold text-primary")}>
      <span className="truncate">{name}</span>
      <span>{score}</span>
    </div>
  )
}

function sourceLabel(match: TournamentMatch, slot: 1 | 2) {
  const sourceId = slot === 1 ? match.source_match_1_id : match.source_match_2_id
  const result = slot === 1 ? match.source_match_1_result : match.source_match_2_result
  if (!sourceId) return "TBD"
  return `${result ?? "source"} of #${sourceId}`
}

type BracketRoundData = {
  group: string
  key: string
  matches: TournamentMatch[]
  name: string
  roundNo?: number | null
}

type BracketSectionData = {
  group: string
  rounds: BracketRoundData[]
  title: string
}

function groupBracketSections(matches: TournamentMatch[], t: ReturnType<typeof useTranslation>["t"]) {
  const grouped = new Map<string, TournamentMatch[]>()
  for (const match of matches) {
    const key = `${match.bracket_group ?? "other"}-${match.round_no ?? match.round?.order ?? 0}`
    grouped.set(key, [...(grouped.get(key) ?? []), match])
  }

  const rounds = Array.from(grouped.entries()).map(([key, items]) => {
    const first = items[0]
    return {
      group: first.bracket_group ?? "other",
      key,
      matches: items.sort((a, b) => (a.slot_no ?? a.id) - (b.slot_no ?? b.id)),
      name: first.round?.name ?? key,
      roundNo: first.round_no ?? first.round?.order ?? null,
    }
  }).sort((a, b) => {
    const aOrder = a.matches[0]?.round?.order ?? 0
    const bOrder = b.matches[0]?.round?.order ?? 0
    return aOrder - bOrder
  })

  const sectionMap = new Map<string, BracketRoundData[]>()
  for (const round of rounds) {
    sectionMap.set(round.group, [...(sectionMap.get(round.group) ?? []), round])
  }

  const order = ["winner", "loser", "grand_final", "reset_final", "other"]
  return Array.from(sectionMap.entries())
    .map(([group, sectionRounds]) => ({
      group,
      rounds: sectionRounds,
      title: sectionTitle(group, t),
    }))
    .sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group))
}

function sectionTitle(group: string, t: ReturnType<typeof useTranslation>["t"]) {
  if (group === "winner") return t("tournament.admin.bracket.winnersBracket")
  if (group === "loser") return t("tournament.admin.bracket.losersBracket")
  if (group === "grand_final") return t("tournament.admin.bracket.grandFinal")
  if (group === "reset_final") return t("tournament.admin.bracket.resetFinal")
  return t("tournament.admin.bracket.manualMatches")
}
