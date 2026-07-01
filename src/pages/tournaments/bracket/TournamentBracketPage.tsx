import { useEffect, useMemo, useRef, useState, type ReactElement, type RefObject } from "react"
import { CaretDown, Crown, GitBranch } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  createTheme,
  DoubleEliminationBracket,
  SVGViewer,
  type MatchComponentProps,
  type MatchType,
} from "@elyasasmad/react-tournament-brackets"
import { useTournamentBracketQuery, useTournamentDetailQuery, type TournamentMatch } from "@/entities/tournament"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { AppAlert, getErrorMessage, PageState } from "@/shared/components"
import { cn } from "@/lib/utils"
import { TournamentBreadcrumb } from "../_shared/TournamentBreadcrumb"

const bracketTheme = createTheme({
  border: {
    color: "var(--border)",
    highlightedColor: "var(--primary)",
  },
  canvasBackground: "var(--background)",
  disabledColor: "var(--muted-foreground)",
  fontFamily: "inherit",
  matchBackground: {
    lostColor: "var(--card)",
    wonColor: "var(--card)",
  },
  roundHeaders: {
    background: "var(--muted)",
  },
  score: {
    background: {
      lostColor: "var(--muted)",
      wonColor: "var(--primary)",
    },
    text: {
      highlightedLostColor: "var(--foreground)",
      highlightedWonColor: "var(--primary-foreground)",
    },
  },
  textColor: {
    dark: "var(--muted-foreground)",
    disabled: "var(--muted-foreground)",
    highlighted: "var(--primary)",
    main: "var(--foreground)",
  },
  transitionTimingFunction: "150ms ease",
})

export function TournamentBracketPage() {
  const { t } = useTranslation()
  const { tid } = useParams()
  const navigate = useNavigate()
  const tournamentQuery = useTournamentDetailQuery(tid)
  const bracketQuery = useTournamentBracketQuery(tid)
  const matches = bracketQuery.data ?? []
  const visibleMatches = matches.filter((match) => !match.hidden_until_match_id || match.is_possible === 0)
  const matchLookup = useMemo(() => new Map(visibleMatches.map((match) => [match.id, match])), [visibleMatches])
  const bracketMatches = useMemo(() => toDoubleEliminationMatches(visibleMatches, tid ?? ""), [tid, visibleMatches])
  const mobileSections = groupBracketSections(visibleMatches, t)

  if (bracketQuery.isError || tournamentQuery.isError) {
    return <PageState title={t("tournament.bracket.loadFailed")} description={getErrorMessage(bracketQuery.error ?? tournamentQuery.error)} />
  }

  return (
    <main className="flex min-h-[calc(100dvh-4rem)] flex-col gap-4 pb-6 pt-2">
      <div className="px-4 sm:px-6 lg:px-8">
        <TournamentBreadcrumb current={t("tournament.common.bracket")} tournament={tournamentQuery.data} tournamentId={tid} />

        {bracketQuery.isLoading ? <PageState title={t("tournament.bracket.loading")} description={t("tournament.bracket.loadingDescription")} /> : null}
        {!bracketQuery.isLoading && matches.length === 0 ? (
          <AppAlert title={t("tournament.bracket.emptyTitle")}>{t("tournament.bracket.emptyDescription")}</AppAlert>
        ) : null}
      </div>

      <div className="hidden w-full md:block">
        {visibleMatches.length > 0 ? (
          <ResponsiveDoubleEliminationBracket
            matches={bracketMatches}
            onMatchClick={(match) => {
              const href = typeof match.href === "string" ? match.href : null
              if (href) navigate(href)
            }}
          />
        ) : null}
      </div>

      <div className="grid gap-4 px-4 sm:px-6 md:hidden">
        {mobileSections.map((section) => (
          <BracketSection key={section.group} matchLookup={matchLookup} section={section} tournamentId={tid ?? ""} />
        ))}
      </div>
    </main>
  )
}

function BracketSection({ matchLookup, section, tournamentId }: { matchLookup: MatchLookup; section: BracketSectionData; tournamentId: string }) {
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
          <MobileRound key={round.key} defaultOpen={index === 0 || isFinals} matchLookup={matchLookup} round={round} tournamentId={tournamentId} />
        ))}
      </div>
    </section>
  )
}

function ResponsiveDoubleEliminationBracket({ matches, onMatchClick }: { matches: DoubleEliminationMatches; onMatchClick: (match: MatchType) => void }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const size = useElementSize(ref)

  return (
    <div className="h-[calc(100dvh-8rem)] min-h-[620px] w-full" ref={ref}>
      <DoubleEliminationBracket
        matchComponent={TournamentBracketMatch}
        matches={matches}
        options={{
          style: {
            boxHeight: 92,
            canvasPadding: 12,
            connectorColor: "var(--border)",
            connectorColorHighlight: "var(--primary)",
            roundHeader: {
              backgroundColor: "var(--muted)",
              fontColor: "var(--muted-foreground)",
              fontSize: 12,
              height: 30,
              marginBottom: 18,
              roundTextGenerator: bracketRoundHeaderLabel,
            },
            spaceBetweenColumns: 64,
            spaceBetweenRows: 18,
            width: 280,
          },
        }}
        svgWrapper={({ bracketHeight, bracketWidth, children, startAt }: BracketSvgWrapperProps) => (
          <SVGViewer
            background="var(--background)"
            bracketHeight={bracketHeight}
            bracketWidth={bracketWidth}
            height={Math.max(size.height, 520)}
            scaleFactor={0.75}
            startAt={toStartAtTuple(startAt)}
            SVGBackground="var(--background)"
            width={Math.max(size.width, 960)}
          >
            {children}
          </SVGViewer>
        )}
        theme={bracketTheme}
        onMatchClick={({ match }) => onMatchClick(match)}
      />
    </div>
  )
}

function MobileRound({
  defaultOpen,
  matchLookup,
  round,
  tournamentId,
}: {
  defaultOpen?: boolean
  matchLookup: MatchLookup
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
            <BracketMatchCard key={match.id} match={match} matchLookup={matchLookup} tournamentId={tournamentId} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function BracketMatchCard({ match, matchLookup, tournamentId }: { match: TournamentMatch; matchLookup: MatchLookup; tournamentId: string }) {
  const { t } = useTranslation()
  const isComplete = match.status === 2

  return (
    <Link
      className={cn(
        "block rounded-lg border bg-background p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
        isComplete && "border-primary/25",
      )}
      to={`/t/${tournamentId}/match/${match.id}`}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{t("tournament.common.match", { id: match.id })} · {t("tournament.common.slot")} {match.slot_no ?? "-"}</span>
        <Badge variant={isComplete ? "default" : "outline"}>{isComplete ? t("tournament.common.done") : t("tournament.common.notStarted")}</Badge>
      </div>
      <TeamLine isWinner={match.winner_id === match.team1_id} name={match.team1?.display_name ?? sourceLabel(match, 1, matchLookup)} score={match.team1_score} />
      <TeamLine isWinner={match.winner_id === match.team2_id} name={match.team2?.display_name ?? sourceLabel(match, 2, matchLookup)} score={match.team2_score} />
      {match.result_type && match.result_type !== "normal" ? (
        <p className="mt-2 text-xs uppercase text-muted-foreground">{match.result_type}</p>
      ) : null}
    </Link>
  )
}

function TournamentBracketMatch({
  bottomParty,
  bottomWon,
  match,
  onMatchClick,
  topParty,
  topWon,
}: MatchComponentProps) {
  return (
    <a
      className="flex h-full w-full flex-col justify-between rounded-lg border bg-background p-2 text-foreground no-underline shadow-sm transition hover:border-primary/50"
      href={match.href}
      onClick={(event) => {
        event.preventDefault()
        onMatchClick({ bottomWon, event, match, topWon })
      }}
    >
      <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-muted-foreground">
        <span className="truncate">{match.name}</span>
        <span>{match.state === "SCORE_DONE" ? "DONE" : "OPEN"}</span>
      </div>
      <BracketPartyLine isWinner={topWon} name={topParty.name} score={topParty.resultText} />
      <BracketPartyLine isWinner={bottomWon} name={bottomParty.name} score={bottomParty.resultText} />
    </a>
  )
}

function BracketPartyLine({ isWinner, name, score }: { isWinner: boolean; name?: string; score?: string | null }) {
  return (
    <div className={cn("flex min-w-0 items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm", isWinner && "bg-primary/10 font-semibold text-primary")}>
      <span className="truncate">{name || "TBD"}</span>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{score ?? "-"}</span>
    </div>
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

function sourceLabel(match: TournamentMatch, slot: 1 | 2, matchLookup?: MatchLookup) {
  const sourceId = slot === 1 ? match.source_match_1_id : match.source_match_2_id
  const result = slot === 1 ? match.source_match_1_result : match.source_match_2_result
  if (!sourceId) return "TBD"
  const sourceMatch = matchLookup?.get(sourceId)
  const sourceName = sourceMatch ? matchName(sourceMatch) : `#${sourceId}`
  const resultName = result === "winner" ? "Winner" : result === "loser" ? "Loser" : "Source"
  return `${resultName} of ${sourceName}`
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

type DoubleEliminationMatches = {
  lower: MatchType[]
  upper: MatchType[]
}

type MatchLookup = Map<number, TournamentMatch>

type BracketSvgWrapperProps = {
  bracketHeight: number
  bracketWidth: number
  children: ReactElement
  startAt: number[]
}

function toStartAtTuple(startAt: number[]): [number, number] {
  return [startAt[0] ?? 0, startAt[1] ?? 0]
}

function bracketRoundHeaderLabel(currentRoundNumber: number, roundsTotalNumber: number) {
  const hasResetFinal = roundsTotalNumber >= 10
  if (hasResetFinal && currentRoundNumber === roundsTotalNumber) return "Reset Finals"
  if (currentRoundNumber === roundsTotalNumber || (hasResetFinal && currentRoundNumber === roundsTotalNumber - 1)) return "Grand Finals"

  const labels = [
    "Round of 32",
    "Round of 16",
    "Lower Round of 16",
    "Quarterfinals",
    "Lower Quarterfinals",
    "Semifinals",
    "Lower Semifinals",
    "Finals",
  ]

  return labels[currentRoundNumber - 1] ?? `Round ${currentRoundNumber}`
}

function toDoubleEliminationMatches(matches: TournamentMatch[], tournamentId: string): DoubleEliminationMatches {
  const visibleIds = new Set(matches.map((match) => match.id))
  const nextBySourceId = new Map<number, number>()
  const nextLoserBySourceId = new Map<number, number>()
  const matchById = new Map(matches.map((match) => [match.id, match]))

  for (const target of matches) {
    const sources = [
      { id: target.source_match_1_id, result: target.source_match_1_result },
      { id: target.source_match_2_id, result: target.source_match_2_result },
    ]

    for (const source of sources) {
      if (!source.id || !visibleIds.has(source.id)) continue
      const sourceMatch = matchById.get(source.id)
      if (!sourceMatch) continue
      if (source.result === "winner") {
        nextBySourceId.set(source.id, target.id)
      } else if (source.result === "loser" && sourceMatch.bracket_group === "winner") {
        nextLoserBySourceId.set(source.id, target.id)
      }
    }
  }

  const upper = matches
    .filter((match) => match.bracket_group === "winner")
    .map((match) => toBracketMatch(match, tournamentId, nextBySourceId, nextLoserBySourceId, matchById))
  const lower = matches
    .filter((match) => match.bracket_group === "loser" || match.bracket_group === "grand_final" || match.bracket_group === "reset_final")
    .map((match) => toBracketMatch(match, tournamentId, nextBySourceId, nextLoserBySourceId, matchById))

  return { lower, upper }
}

function toBracketMatch(
  match: TournamentMatch,
  tournamentId: string,
  nextBySourceId: Map<number, number>,
  nextLoserBySourceId: Map<number, number>,
  matchLookup: MatchLookup,
): MatchType {
  return {
    href: `/t/${tournamentId}/match/${match.id}`,
    id: match.id,
    name: matchName(match),
    nextLooserMatchId: nextLoserBySourceId.get(match.id),
    nextMatchId: nextBySourceId.get(match.id) ?? null,
    participants: [
      toParticipant(match, 1, matchLookup),
      toParticipant(match, 2, matchLookup),
    ],
    startTime: match.scheduled_time ?? "",
    state: match.status === 2 ? "SCORE_DONE" : "PLAYED",
    tournamentRoundText: roundLabel(match),
  }
}

function toParticipant(match: TournamentMatch, slot: 1 | 2, matchLookup: MatchLookup) {
  const team = slot === 1 ? match.team1 : match.team2
  const teamId = slot === 1 ? match.team1_id : match.team2_id
  const score = slot === 1 ? match.team1_score : match.team2_score
  return {
    id: teamId ?? `match-${match.id}-slot-${slot}`,
    isWinner: Boolean(teamId && match.winner_id && Number(teamId) === Number(match.winner_id)),
    name: team?.display_name ?? sourceLabel(match, slot, matchLookup),
    resultText: match.status === 2 ? String(score ?? 0) : score ? String(score) : null,
    status: match.status === 2 ? "PLAYED" : null,
  }
}

function matchName(match: TournamentMatch) {
  const group = match.bracket_group === "winner"
    ? "WB"
    : match.bracket_group === "loser"
      ? "LB"
      : match.bracket_group === "reset_final"
        ? "Reset"
        : "GF"
  if (match.bracket_group === "grand_final" || match.bracket_group === "reset_final") return group
  return `${group} ${compactRoundLabel(match)} M${match.slot_no ?? match.id}`
}

function roundLabel(match: TournamentMatch) {
  const roundNo = match.round_no ?? match.round?.order ?? null
  if (match.bracket_group === "grand_final") return "Grand Finals"
  if (match.bracket_group === "reset_final") return "Reset Finals"
  if (match.bracket_group === "winner") return winnerRoundLabel(roundNo)
  if (match.bracket_group === "loser") return loserRoundLabel(roundNo)
  return match.round?.name ?? `Round ${roundNo ?? "-"}`
}

function compactRoundLabel(match: TournamentMatch) {
  const roundNo = match.round_no ?? match.round?.order ?? null
  if (match.bracket_group === "grand_final") return "GF"
  if (match.bracket_group === "reset_final") return "Reset"
  if (match.bracket_group === "winner") return compactWinnerRoundLabel(roundNo)
  if (match.bracket_group === "loser") return compactLoserRoundLabel(roundNo)
  return roundNo ? `R${roundNo}` : "R-"
}

function compactWinnerRoundLabel(roundNo: number | null) {
  switch (roundNo) {
    case 1:
      return "RO32"
    case 2:
      return "RO16"
    case 3:
      return "QF"
    case 4:
      return "SF"
    case 5:
      return "F"
    default:
      return `R${roundNo ?? "-"}`
  }
}

function compactLoserRoundLabel(roundNo: number | null) {
  switch (roundNo) {
    case 1:
      return "RO16-A"
    case 2:
      return "RO16-B"
    case 3:
      return "QF-A"
    case 4:
      return "QF-B"
    case 5:
      return "SF-A"
    case 6:
      return "SF-B"
    case 7:
      return "F-A"
    case 8:
      return "F-B"
    default:
      return `R${roundNo ?? "-"}`
  }
}

function winnerRoundLabel(roundNo: number | null) {
  switch (roundNo) {
    case 1:
      return "Round of 32"
    case 2:
      return "Round of 16"
    case 3:
      return "Quarterfinals"
    case 4:
      return "Semifinals"
    case 5:
      return "Finals"
    default:
      return `Round ${roundNo ?? "-"}`
  }
}

function loserRoundLabel(roundNo: number | null) {
  switch (roundNo) {
    case 1:
      return "Lower Round of 16 A"
    case 2:
      return "Lower Round of 16 B"
    case 3:
      return "Lower Quarterfinals A"
    case 4:
      return "Lower Quarterfinals B"
    case 5:
      return "Lower Semifinals A"
    case 6:
      return "Lower Semifinals B"
    case 7:
      return "Lower Finals A"
    case 8:
      return "Lower Finals B"
    default:
      return `Lower Round ${roundNo ?? "-"}`
  }
}

function useElementSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ height: 680, width: 1200 })

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const update = () => {
      const rect = element.getBoundingClientRect()
      setSize({
        height: Math.max(520, Math.round(rect.height)),
        width: Math.max(960, Math.round(rect.width)),
      })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return size
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
