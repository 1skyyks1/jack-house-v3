import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactElement, type RefObject } from "react"
import { Clock } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ThemeProvider } from "styled-components"
import {
  createTheme,
  SVGViewer,
  type ComputedOptionsType,
  type MatchComponentProps,
  type MatchType,
  type OptionsType,
} from "@elyasasmad/react-tournament-brackets"
import RoundHeader from "@elyasasmad/react-tournament-brackets/dist/esm/components/round-header"
import Connector from "@elyasasmad/react-tournament-brackets/dist/esm/components/connector"
import { MatchContextProvider } from "@elyasasmad/react-tournament-brackets/dist/esm/core/match-context"
import MatchWrapper from "@elyasasmad/react-tournament-brackets/dist/esm/core/match-wrapper"
import { calculateSVGDimensions } from "@elyasasmad/react-tournament-brackets/dist/esm/core/calculate-svg-dimensions"
import { generatePreviousRound } from "@elyasasmad/react-tournament-brackets/dist/esm/core/match-functions"
import { defaultStyle, getCalculatedStyles } from "@elyasasmad/react-tournament-brackets/dist/esm/settings"
import LowerBracket from "@elyasasmad/react-tournament-brackets/dist/esm/bracket-double/lower-bracket"
import UpperBracket from "@elyasasmad/react-tournament-brackets/dist/esm/bracket-double/upper-bracket"
import { useTournamentBracketQuery, useTournamentDetailQuery, type TournamentMatch } from "@/entities/tournament"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AppAlert, getErrorMessage, PageState } from "@/shared/components"
import { cn } from "@/lib/utils"
import { TournamentBreadcrumb } from "../_shared/TournamentBreadcrumb"
import { getMainStageLabel, getMatchStage, getStageSortIndex, type MainStageKey } from "../_shared/tournamentRoundStages"
import { formatTournamentScheduleTimeUtc } from "../_shared/tournamentScheduleTime"

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

const lowerBracketColumnOffset = 1

const bracketLayoutStyle: OptionsType = {
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
}

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
  const bracketMatches = useMemo(() => toDoubleEliminationMatches(visibleMatches, tid ?? "", scheduleMatchNumbers), [tid, visibleMatches, scheduleMatchNumbers])

  if (bracketQuery.isError || tournamentQuery.isError) {
    return <PageState title={t("tournament.bracket.loadFailed")} description={getErrorMessage(bracketQuery.error ?? tournamentQuery.error)} />
  }

  return (
    <main className="flex min-h-[calc(100dvh-4rem)] flex-col gap-4 pb-6">
      <div className="sticky top-[calc(4rem+1px)] z-30 bg-background/92 backdrop-blur">
        <div className={cn("w-full px-3 py-2 sm:px-6 lg:px-8", viewMode === "list" && "mx-auto max-w-6xl")}>
          <TournamentBreadcrumb current={t("tournament.common.schedule")} tournament={tournamentQuery.data} tournamentId={tid} />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-heading text-3xl font-semibold">{t("tournament.common.schedule")}</h1>
            </div>
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
        {bracketQuery.isLoading ? <PageState title={t("tournament.bracket.loading")} description={t("tournament.bracket.loadingDescription")} /> : null}
        {!bracketQuery.isLoading && matches.length === 0 ? (
          <AppAlert title={t("tournament.bracket.emptyTitle")}>{t("tournament.bracket.emptyDescription")}</AppAlert>
        ) : null}
      </div>

      {viewMode === "list" ? (
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-3 sm:px-6 lg:px-8">
          {scheduleRounds.map((round) => (
            <ScheduleRound key={round.key} matchLookup={matchLookup} matchNumbers={scheduleMatchNumbers} round={round} tournamentId={tid ?? ""} />
          ))}
        </div>
      ) : null}

      <div className={cn("w-full", viewMode !== "bracket" && "hidden")}>
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
    </main>
  )
}

function ScheduleRoundJumpNav({ rounds }: { rounds: BracketRoundData[] }) {
  const visibleRounds = createScheduleRoundJumpItems(rounds)

  if (visibleRounds.length <= 1) return null

  return (
    <nav className="-mx-1 mt-3 px-1 pb-1" aria-label="Schedule rounds">
      <div className="flex flex-wrap gap-2">
        {visibleRounds.map((round) => (
          <a
            className="shrink-0 whitespace-nowrap rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
            href={`#${scheduleRoundDomId(round.targetKey)}`}
            key={round.key}
            onClick={(event) => handleScheduleRoundJump(event, round.targetKey)}
          >
            {round.label}
          </a>
        ))}
      </div>
    </nav>
  )
}

function handleScheduleRoundJump(event: ReactMouseEvent<HTMLAnchorElement>, key: string) {
  event.preventDefault()
  const id = scheduleRoundDomId(key)
  const target = document.getElementById(id)
  if (!target) return
  window.history.replaceState(null, "", `#${id}`)
  target.scrollIntoView({ behavior: "smooth", block: "start" })
}

function createScheduleRoundJumpItems(rounds: BracketRoundData[]) {
  const orderedTabs: Array<{ group: "final" | "loser" | "winner"; label: string; stage: MainStageKey }> = [
    { group: "winner", label: "RO32", stage: "ro32" },
    { group: "loser", label: "RO16LB", stage: "ro16" },
    { group: "winner", label: "RO16", stage: "ro16" },
    { group: "loser", label: "QFLB", stage: "qf" },
    { group: "winner", label: "QF", stage: "qf" },
    { group: "loser", label: "SFLB", stage: "sf" },
    { group: "winner", label: "SF", stage: "sf" },
    { group: "loser", label: "FLB", stage: "f" },
    { group: "winner", label: "F", stage: "f" },
    { group: "loser", label: "GFLB", stage: "gf" },
    { group: "final", label: "GF", stage: "gf" },
  ]

  return orderedTabs.flatMap((tab) => {
    const round = rounds.find((item) => item.stage === tab.stage && scheduleRoundNavGroup(item.group) === tab.group)
    return round ? [{ key: `${tab.stage}-${tab.group}`, label: tab.label, targetKey: round.key }] : []
  })
}

function scheduleRoundNavGroup(group: string): "final" | "loser" | "winner" | "other" {
  if (group === "winner") return "winner"
  if (group === "loser") return "loser"
  if (group === "grand_final" || group === "reset_final") return "final"
  return "other"
}

function ScheduleRound({ matchLookup, matchNumbers, round, tournamentId }: { matchLookup: MatchLookup; matchNumbers: Map<number, number>; round: BracketRoundData; tournamentId: string }) {
  const { t } = useTranslation()

  return (
    <section className="scroll-mt-54" id={scheduleRoundDomId(round.key)}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3 border-b pb-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{round.stage ? getMainStageLabel(round.stage) : t("tournament.common.round", { round: round.roundNo ?? "-" })}</p>
          <h2 className="mt-1 truncate font-heading text-2xl font-semibold">{round.name}</h2>
        </div>
        <Badge className="mb-1" variant="outline">{t("tournament.common.matches", { count: round.matches.length })}</Badge>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {round.matches.map((match) => (
          <ScheduleMatchCard key={match.id} match={match} matchLookup={matchLookup} matchNumber={matchNumbers.get(match.id) ?? 0} matchNumbers={matchNumbers} tournamentId={tournamentId} />
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
      <ShiftedDoubleEliminationBracket
        matches={matches}
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
        onMatchClick={onMatchClick}
      />
    </div>
  )
}

function ShiftedDoubleEliminationBracket({
  matches,
  onMatchClick,
  svgWrapper: SvgWrapper,
}: {
  matches: DoubleEliminationMatches
  onMatchClick: (match: MatchType) => void
  svgWrapper: (props: BracketSvgWrapperProps) => ReactElement
}) {
  const style = {
    ...defaultStyle,
    ...bracketLayoutStyle,
    lineInfo: {
      ...defaultStyle.lineInfo,
      ...bracketLayoutStyle.lineInfo,
    },
    roundHeader: {
      ...defaultStyle.roundHeader,
      ...bracketLayoutStyle.roundHeader,
    },
  }
  const calculatedStyles = getCalculatedStyles(style)
  const { canvasPadding = 0, columnWidth = 0, roundHeader, rowHeight = 0 } = calculatedStyles
  const { convergingMatch, finalsArray } = findTheFinals(matches)
  const hasMultipleFinals = finalsArray.length > 1
  const upperColumns = generateDoubleBracketColumns(convergingMatch, matches.upper)
  const lowerColumns = generateDoubleBracketColumns(convergingMatch, matches.lower)

  if (!convergingMatch || upperColumns.length === 0 || lowerColumns.length === 0) return null

  const finalColumnIndex = lowerColumns.length + lowerBracketColumnOffset
  const resetFinalColumnIndex = finalColumnIndex + 1
  const finalColumnCount = 1 + (hasMultipleFinals ? finalsArray.length - 1 : 0)
  const totalNumOfRounds = lowerColumns.length + lowerBracketColumnOffset + finalColumnCount
  const upperBracketDimensions = calculateSVGDimensions(upperColumns[0]?.length ?? 0, upperColumns.length, rowHeight, columnWidth, canvasPadding, roundHeader)
  const lowerBracketDimensions = calculateSVGDimensions(lowerColumns[0]?.length ?? 0, lowerColumns.length, rowHeight, columnWidth, canvasPadding, roundHeader)
  const fullBracketDimensions = calculateSVGDimensions(lowerColumns[0]?.length ?? 0, totalNumOfRounds, rowHeight, columnWidth, canvasPadding, roundHeader)
  const gameHeight = upperBracketDimensions.gameHeight + lowerBracketDimensions.gameHeight
  const lowerOffsetX = lowerBracketColumnOffset * columnWidth

  return (
    <ThemeProvider theme={bracketTheme}>
      <SvgWrapper bracketHeight={gameHeight} bracketWidth={fullBracketDimensions.gameWidth} startAt={upperBracketDimensions.startPosition}>
        <svg height={gameHeight} viewBox={`0 0 ${fullBracketDimensions.gameWidth} ${gameHeight}`} width={fullBracketDimensions.gameWidth}>
          <MatchContextProvider>
            <g>
              <ShiftedRoundHeaders calculatedStyles={calculatedStyles} numOfRounds={totalNumOfRounds} />
              <UpperBracket
                calculatedStyles={calculatedStyles}
                columns={upperColumns}
                gameHeight={gameHeight}
                gameWidth={fullBracketDimensions.gameWidth}
                matchComponent={TournamentBracketMatch}
                onPartyClick={undefined}
                onMatchClick={({ match }: { match: MatchType }) => onMatchClick(match)}
              />
              <g transform={`translate(${lowerOffsetX} 0)`}>
                <LowerBracket
                  calculatedStyles={calculatedStyles}
                  columns={lowerColumns}
                  gameHeight={gameHeight}
                  gameWidth={fullBracketDimensions.gameWidth}
                  matchComponent={TournamentBracketMatch}
                  upperBracketHeight={upperBracketDimensions.gameHeight}
                  onPartyClick={undefined}
                  onMatchClick={({ match }: { match: MatchType }) => onMatchClick(match)}
                />
              </g>
              <ShiftedFinalGame
                bracketSnippet={{
                  currentMatch: convergingMatch,
                  previousBottomMatch: lowerColumns[lowerColumns.length - 1]?.[0] ?? null,
                  previousTopMatch: upperColumns[upperColumns.length - 1]?.[0] ?? null,
                }}
                calculatedStyles={calculatedStyles}
                columnIndex={finalColumnIndex}
                gameHeight={gameHeight}
                gameWidth={fullBracketDimensions.gameWidth}
                lowerBracketHeight={lowerBracketDimensions.gameHeight}
                lowerOffsetX={lowerOffsetX}
                match={convergingMatch}
                numOfLowerRounds={lowerColumns.length}
                numOfUpperRounds={upperColumns.length}
                upperBracketHeight={upperBracketDimensions.gameHeight}
                onMatchClick={({ match }) => onMatchClick(match)}
              />
              {hasMultipleFinals ? (
                <ShiftedExtraFinal
                  bracketSnippet={{
                    currentMatch: finalsArray[1],
                    previousBottomMatch: finalsArray[0],
                    previousTopMatch: null,
                  }}
                  calculatedStyles={calculatedStyles}
                  columnIndex={resetFinalColumnIndex}
                  gameHeight={gameHeight}
                  gameWidth={fullBracketDimensions.gameWidth}
                  lowerBracketHeight={lowerBracketDimensions.gameHeight}
                  match={finalsArray[1]}
                  upperBracketHeight={upperBracketDimensions.gameHeight}
                  onMatchClick={({ match }) => onMatchClick(match)}
                />
              ) : null}
            </g>
          </MatchContextProvider>
        </svg>
      </SvgWrapper>
    </ThemeProvider>
  )
}

function ScheduleMatchCard({ match, matchLookup, matchNumber, matchNumbers, tournamentId }: { match: TournamentMatch; matchLookup: MatchLookup; matchNumber: number; matchNumbers: Map<number, number>; tournamentId: string }) {
  const { t } = useTranslation()
  const isComplete = match.status === 2
  const team1Name = match.team1?.display_name ?? sourceLabel(match, 1, matchLookup, matchNumbers)
  const team2Name = match.team2?.display_name ?? sourceLabel(match, 2, matchLookup, matchNumbers)

  return (
    <Link
      className={cn(
        "block rounded-lg border bg-background p-3 shadow-sm transition hover:border-primary/40 hover:shadow-md",
        isComplete && "border-primary/25",
      )}
      to={`/t/${tournamentId}/match/${match.id}`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{t("tournament.common.match", { id: matchNumber })}</span>
        <span className="flex flex-wrap items-center gap-2">
          {match.scheduled_time ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />
              {formatTournamentScheduleTimeUtc(match.scheduled_time)}
            </span>
          ) : null}
        </span>
      </div>

      <div className="grid items-center gap-3 md:grid-cols-[minmax(0,1fr)_8rem_minmax(0,1fr)]">
        <ScheduleTeamSide align="left" isWinner={match.winner_id === match.team1_id} name={team1Name} team={match.team1} />
        <div className="flex items-center justify-center gap-2">
          <span className={cn("font-heading text-2xl font-semibold tabular-nums", match.winner_id === match.team1_id && "text-primary")}>{match.team1_score ?? 0}</span>
          <span className="text-muted-foreground">:</span>
          <span className={cn("font-heading text-2xl font-semibold tabular-nums", match.winner_id === match.team2_id && "text-primary")}>{match.team2_score ?? 0}</span>
        </div>
        <ScheduleTeamSide align="right" isWinner={match.winner_id === match.team2_id} name={team2Name} team={match.team2} />
      </div>
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

function ScheduleTeamSide({ align, isWinner, name, team }: { align: "left" | "right"; isWinner: boolean; name: string; team?: TournamentMatch["team1"] }) {
  const avatars = (team?.players ?? []).slice(0, 2)
  const avatarGroup = (
    <div className={cn("flex shrink-0 -space-x-2", align === "right" && "flex-row-reverse space-x-reverse")}>
      {avatars.map((player) => {
        const playerName = player.user_name_snapshot ?? player.user?.user_name ?? "?"
        return (
          <Avatar className="size-7 border-2 border-background" key={player.id}>
            <AvatarImage src={player.avatar_snapshot ?? player.user?.avatar ?? undefined} />
            <AvatarFallback>{playerName.slice(0, 1)}</AvatarFallback>
          </Avatar>
        )
      })}
    </div>
  )

  return (
    <div className={cn(
      "flex min-w-0 items-center gap-2",
      align === "right" ? "justify-end text-right" : "justify-start",
      isWinner && "font-semibold text-primary",
    )}>
      {align === "left" ? avatarGroup : null}
      <span className="truncate">{name}</span>
      {align === "right" ? avatarGroup : null}
    </div>
  )
}

function sourceLabel(match: TournamentMatch, slot: 1 | 2, matchLookup?: MatchLookup, matchNumbers?: Map<number, number>) {
  const sourceId = slot === 1 ? match.source_match_1_id : match.source_match_2_id
  const result = slot === 1 ? match.source_match_1_result : match.source_match_2_result
  if (!sourceId) return "TBD"
  const sourceMatch = matchLookup?.get(sourceId)
  const sourceNumber = sourceMatch ? getMatchNumber(sourceMatch, matchNumbers) : matchNumbers?.get(sourceId)
  const sourceName = sourceNumber ? `Match #${sourceNumber}` : `Match #${sourceId}`
  const resultName = result === "winner" ? "Winner" : result === "loser" ? "Loser" : "Source"
  return `${resultName} of ${sourceName}`
}

type BracketRoundData = {
  group: string
  key: string
  matches: TournamentMatch[]
  name: string
  roundNo?: number | null
  stage?: MainStageKey | null
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

type BracketPosition = {
  x: number
  y: number
}

type BracketSnippet = {
  currentMatch: MatchType | null
  previousBottomMatch: MatchType | null
  previousTopMatch: MatchType | null
}

type BracketMatchClickPayload = {
  bottomWon: boolean
  match: MatchType
  topWon: boolean
}

function ShiftedRoundHeaders({ calculatedStyles, numOfRounds }: { calculatedStyles: ComputedOptionsType; numOfRounds: number }) {
  const { canvasPadding = 0, columnWidth = 0, roundHeader, rowHeight = 0, width = 0 } = calculatedStyles
  if (!roundHeader?.isShown) return null

  return (
    <>
      {Array.from({ length: numOfRounds }).map((_, columnIndex) => {
        const { x } = calculatePositionOfMatchLowerBracket(0, columnIndex, {
          canvasPadding,
          columnWidth,
          rowHeight,
        })
        return (
          <g key={`round-${columnIndex}-${x}`}>
            <RoundHeader
              canvasPadding={canvasPadding}
              columnIndex={columnIndex}
              numOfRounds={numOfRounds}
              roundHeader={roundHeader}
              tournamentRoundText={`${columnIndex + 1}`}
              width={width}
              x={x}
            />
          </g>
        )
      })}
    </>
  )
}

function ShiftedFinalGame({
  bracketSnippet,
  calculatedStyles,
  columnIndex,
  gameHeight,
  gameWidth,
  lowerBracketHeight,
  lowerOffsetX,
  match,
  numOfLowerRounds,
  numOfUpperRounds,
  onMatchClick,
  upperBracketHeight,
}: {
  bracketSnippet: BracketSnippet
  calculatedStyles: ComputedOptionsType
  columnIndex: number
  gameHeight: number
  gameWidth: number
  lowerBracketHeight: number
  lowerOffsetX: number
  match: MatchType
  numOfLowerRounds: number
  numOfUpperRounds: number
  onMatchClick: (args: BracketMatchClickPayload) => void
  upperBracketHeight: number
}) {
  const { canvasPadding = 0, columnWidth = 0, roundHeader, rowHeight = 0 } = calculatedStyles
  const { x, y } = calculatePositionOfFinalGame(0, columnIndex, {
    canvasPadding,
    columnWidth,
    gameHeight,
    lowerBracketHeight,
    rowHeight,
    upperBracketHeight,
  })

  return (
    <>
      <ShiftedFinalConnectors
        bracketSnippet={bracketSnippet}
        calculatedStyles={calculatedStyles}
        columnIndex={columnIndex}
        gameHeight={gameHeight}
        gameWidth={gameWidth}
        lowerBracketHeight={lowerBracketHeight}
        lowerOffsetX={lowerOffsetX}
        numOfLowerRounds={numOfLowerRounds}
        numOfUpperRounds={numOfUpperRounds}
        upperBracketHeight={upperBracketHeight}
      />
      <g>
        <MatchWrapper
          bottomText={match.name ?? ""}
          columnIndex={columnIndex}
          match={match}
          matchComponent={TournamentBracketMatch}
          previousBottomMatch={bracketSnippet.previousBottomMatch}
          rowIndex={0}
          style={calculatedStyles}
          teams={match.participants}
          topText={match.startTime}
          x={x}
          y={y + (roundHeader?.isShown ? (roundHeader.height ?? 0) + (roundHeader.marginBottom ?? 0) : 0)}
          onPartyClick={undefined}
          onMatchClick={onMatchClick}
        />
      </g>
    </>
  )
}

function ShiftedExtraFinal({
  bracketSnippet,
  calculatedStyles,
  columnIndex,
  gameHeight,
  gameWidth,
  lowerBracketHeight,
  match,
  onMatchClick,
  upperBracketHeight,
}: {
  bracketSnippet: BracketSnippet
  calculatedStyles: ComputedOptionsType
  columnIndex: number
  gameHeight: number
  gameWidth: number
  lowerBracketHeight: number
  match: MatchType
  onMatchClick: (args: BracketMatchClickPayload) => void
  upperBracketHeight: number
}) {
  const { canvasPadding = 0, columnWidth = 0, roundHeader, rowHeight = 0 } = calculatedStyles
  const { x, y } = calculatePositionOfFinalGame(0, columnIndex, {
    canvasPadding,
    columnWidth,
    gameHeight,
    lowerBracketHeight,
    rowHeight,
    upperBracketHeight,
  })

  return (
    <>
      <ShiftedExtraFinalConnectors
        bracketSnippet={bracketSnippet}
        calculatedStyles={calculatedStyles}
        columnIndex={columnIndex}
        gameHeight={gameHeight}
        gameWidth={gameWidth}
        lowerBracketHeight={lowerBracketHeight}
        upperBracketHeight={upperBracketHeight}
      />
      <g>
        <MatchWrapper
          bottomText={match.name ?? ""}
          columnIndex={columnIndex}
          match={match}
          matchComponent={TournamentBracketMatch}
          previousBottomMatch={bracketSnippet.previousBottomMatch}
          rowIndex={0}
          style={calculatedStyles}
          teams={match.participants}
          topText={match.startTime}
          x={x}
          y={y + (roundHeader?.isShown ? (roundHeader.height ?? 0) + (roundHeader.marginBottom ?? 0) : 0)}
          onPartyClick={undefined}
          onMatchClick={onMatchClick}
        />
      </g>
    </>
  )
}

function ShiftedFinalConnectors({
  bracketSnippet,
  calculatedStyles,
  columnIndex,
  gameHeight,
  lowerBracketHeight,
  lowerOffsetX,
  numOfLowerRounds,
  numOfUpperRounds,
  upperBracketHeight,
}: {
  bracketSnippet: BracketSnippet
  calculatedStyles: ComputedOptionsType
  columnIndex: number
  gameHeight: number
  gameWidth: number
  lowerBracketHeight: number
  lowerOffsetX: number
  numOfLowerRounds: number
  numOfUpperRounds: number
  upperBracketHeight: number
}) {
  const { canvasPadding = 0, columnWidth = 0, rowHeight = 0 } = calculatedStyles
  const currentMatchPosition = calculatePositionOfFinalGame(0, columnIndex, {
    canvasPadding,
    columnWidth,
    gameHeight,
    lowerBracketHeight,
    rowHeight,
    upperBracketHeight,
  })
  const previousTopMatchPosition = calculatePositionOfMatchUpperBracket(0, numOfUpperRounds - 1, {
    canvasPadding,
    columnWidth,
    rowHeight,
  })
  const previousBottomMatchPosition = calculatePositionOfMatchLowerBracket(0, numOfLowerRounds - 1, {
    canvasPadding,
    columnWidth,
    offsetX: lowerOffsetX,
    offsetY: upperBracketHeight,
    rowHeight,
  })

  return (
    <Connector
      bracketSnippet={bracketSnippet}
      currentMatchPosition={currentMatchPosition}
      previousBottomMatchPosition={previousBottomMatchPosition}
      previousTopMatchPosition={previousTopMatchPosition}
      style={calculatedStyles}
    />
  )
}

function ShiftedExtraFinalConnectors({
  bracketSnippet,
  calculatedStyles,
  columnIndex,
  gameHeight,
  lowerBracketHeight,
  upperBracketHeight,
}: {
  bracketSnippet: BracketSnippet
  calculatedStyles: ComputedOptionsType
  columnIndex: number
  gameHeight: number
  gameWidth: number
  lowerBracketHeight: number
  upperBracketHeight: number
}) {
  const { canvasPadding = 0, columnWidth = 0, rowHeight = 0 } = calculatedStyles
  const currentMatchPosition = calculatePositionOfFinalGame(0, columnIndex, {
    canvasPadding,
    columnWidth,
    gameHeight,
    lowerBracketHeight,
    rowHeight,
    upperBracketHeight,
  })
  const previousBottomMatchPosition = calculatePositionOfFinalGame(0, columnIndex - 1, {
    canvasPadding,
    columnWidth,
    gameHeight,
    lowerBracketHeight,
    rowHeight,
    upperBracketHeight,
  })

  return (
    <Connector
      bracketSnippet={bracketSnippet}
      currentMatchPosition={currentMatchPosition}
      previousBottomMatchPosition={previousBottomMatchPosition}
      style={calculatedStyles}
    />
  )
}

function findTheFinals(matches: DoubleEliminationMatches) {
  const isFinalInUpper = matches.upper.some((match) => !match.nextMatchId)
  const isFinalInLower = matches.lower.some((match) => !match.nextMatchId)
  let convergingMatch: MatchType | null = null
  let finalsArray: MatchType[] = []

  if (isFinalInLower) {
    const lastUpper = matches.upper.find((match) => !matches.upper.some((candidate) => candidate.id === match.nextMatchId))
    convergingMatch = matches.lower.find((match) => match.id === lastUpper?.nextMatchId) ?? null
    finalsArray = [convergingMatch, matches.lower.find((match) => match.id === convergingMatch?.nextMatchId) ?? null].filter((match): match is MatchType => Boolean(match?.id))
  }

  if (isFinalInUpper) {
    const lastLower = matches.lower.find((match) => !matches.lower.some((candidate) => candidate.id === match.nextMatchId))
    convergingMatch = matches.upper.find((match) => match.id === lastLower?.nextMatchId) ?? null
    finalsArray = [convergingMatch, matches.upper.find((match) => match.id === convergingMatch?.nextMatchId) ?? null].filter((match): match is MatchType => Boolean(match?.id))
  }

  return { convergingMatch, finalsArray }
}

function generateDoubleBracketColumns(final: MatchType | null, matches: MatchType[]) {
  const generateColumn = (matchesColumn: MatchType[]): MatchType[][] => {
    const previousMatchesColumn = generatePreviousRound(matchesColumn, matches) as MatchType[]
    if (previousMatchesColumn.length > 0) {
      return [...generateColumn(previousMatchesColumn), previousMatchesColumn]
    }
    return [previousMatchesColumn]
  }

  return final ? [...generateColumn([final]), []].filter((column) => column.length > 0) : []
}

function calculateVerticalStartingPoint(columnIndex: number, height: number) {
  return 2 ** columnIndex * (height / 2) - height / 2
}

function columnIncrement(columnIndex: number, height: number) {
  return 2 ** columnIndex * height
}

function calculateHeightIncrease(columnIndex: number, rowIndex: number, height: number) {
  return columnIncrement(columnIndex, height) * rowIndex
}

function calculateVerticalPositioning({ columnIndex, rowHeight }: { columnIndex: number; rowHeight: number }, rowIndex: number) {
  return calculateHeightIncrease(columnIndex, rowIndex, rowHeight) + calculateVerticalStartingPoint(columnIndex, rowHeight)
}

function calculatePositionOfMatchUpperBracket(
  rowIndex: number,
  columnIndex: number,
  { canvasPadding, columnWidth, offsetX = 0, offsetY = 0, rowHeight }: { canvasPadding: number; columnWidth: number; offsetX?: number; offsetY?: number; rowHeight: number },
): BracketPosition {
  const yResult = calculateVerticalPositioning({ columnIndex, rowHeight }, rowIndex)
  const skipStep = (index: number) => Math.floor((index + 1) * 2) - 3
  const xResult = columnIndex === 0 || columnIndex === 1 ? columnIndex * columnWidth : skipStep(columnIndex) * columnWidth
  return {
    x: xResult + canvasPadding + offsetX,
    y: yResult + canvasPadding + offsetY,
  }
}

function lowerBracketColumnIndex(columnIndex: number) {
  return Math.ceil((columnIndex + 1) / 2) - 1
}

function calculatePositionOfMatchLowerBracket(
  rowIndex: number,
  columnIndex: number,
  { canvasPadding, columnWidth, offsetX = 0, offsetY = 0, rowHeight }: { canvasPadding: number; columnWidth: number; offsetX?: number; offsetY?: number; rowHeight: number },
): BracketPosition {
  const yResult = calculateVerticalPositioning({ columnIndex: lowerBracketColumnIndex(columnIndex), rowHeight }, rowIndex)
  return {
    x: columnIndex * columnWidth + canvasPadding + offsetX,
    y: yResult + canvasPadding + offsetY,
  }
}

function calculatePositionOfFinalGame(
  _rowIndex: number,
  columnIndex: number,
  {
    canvasPadding,
    columnWidth,
    gameHeight,
    lowerBracketHeight,
    offsetX = 0,
    offsetY = 0,
    rowHeight,
    upperBracketHeight,
  }: {
    canvasPadding: number
    columnWidth: number
    gameHeight: number
    lowerBracketHeight: number
    offsetX?: number
    offsetY?: number
    rowHeight: number
    upperBracketHeight: number
  },
): BracketPosition {
  const yResult = gameHeight * (lowerBracketHeight / upperBracketHeight) - rowHeight
  return {
    x: columnIndex * columnWidth + canvasPadding + offsetX,
    y: yResult + canvasPadding + offsetY,
  }
}

function toStartAtTuple(startAt: number[]): [number, number] {
  return [startAt[0] ?? 0, startAt[1] ?? 0]
}

function bracketRoundHeaderLabel(currentRoundNumber: number, roundsTotalNumber: number) {
  const labels = roundsTotalNumber >= 11
    ? [
        "WB RO32",
        "WB/LB RO16",
        "LB QF A",
        "WB/LB QF B",
        "LB SF A",
        "WB/LB SF B",
        "LB Finals A",
        "WB/LB Finals B",
        "LB Grand Final",
        "Grand Final",
        "Reset Final",
      ]
    : [
        "WB RO32",
        "WB/LB RO16",
        "LB QF A",
        "WB/LB QF B",
        "LB SF A",
        "WB/LB SF B",
        "LB Finals A",
        "WB/LB Finals B",
        "LB Grand Final",
        "Grand Final",
      ]

  return labels[currentRoundNumber - 1] ?? `Round ${currentRoundNumber}`
}

function toDoubleEliminationMatches(matches: TournamentMatch[], tournamentId: string, matchNumbers: Map<number, number>): DoubleEliminationMatches {
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
    .sort(compareMatchesForFallbackNumber)
    .map((match) => toBracketMatch(match, tournamentId, nextBySourceId, nextLoserBySourceId, matchById, matchNumbers))
  const lower = matches
    .filter((match) => match.bracket_group === "loser" || match.bracket_group === "grand_final" || match.bracket_group === "reset_final")
    .sort(compareMatchesForFallbackNumber)
    .map((match) => toBracketMatch(match, tournamentId, nextBySourceId, nextLoserBySourceId, matchById, matchNumbers))

  return { lower, upper }
}

function toBracketMatch(
  match: TournamentMatch,
  tournamentId: string,
  nextBySourceId: Map<number, number>,
  nextLoserBySourceId: Map<number, number>,
  matchLookup: MatchLookup,
  matchNumbers: Map<number, number>,
): MatchType {
  return {
    href: `/t/${tournamentId}/match/${match.id}`,
    id: match.id,
    name: matchName(match, matchNumbers),
    nextLooserMatchId: nextLoserBySourceId.get(match.id),
    nextMatchId: nextBySourceId.get(match.id) ?? null,
    participants: [
      toParticipant(match, 1, matchLookup, matchNumbers),
      toParticipant(match, 2, matchLookup, matchNumbers),
    ],
    startTime: match.scheduled_time ?? "",
    state: match.status === 2 ? "SCORE_DONE" : "PLAYED",
    tournamentRoundText: roundLabel(match),
  }
}

function toParticipant(match: TournamentMatch, slot: 1 | 2, matchLookup: MatchLookup, matchNumbers: Map<number, number>) {
  const team = slot === 1 ? match.team1 : match.team2
  const teamId = slot === 1 ? match.team1_id : match.team2_id
  const score = slot === 1 ? match.team1_score : match.team2_score
  return {
    id: teamId ?? `match-${match.id}-slot-${slot}`,
    isWinner: Boolean(teamId && match.winner_id && Number(teamId) === Number(match.winner_id)),
    name: team?.display_name ?? sourceLabel(match, slot, matchLookup, matchNumbers),
    resultText: match.status === 2 ? String(score ?? 0) : score ? String(score) : null,
    status: match.status === 2 ? "PLAYED" : null,
  }
}

function matchName(match: TournamentMatch, matchNumbers?: Map<number, number>) {
  if (match.bracket_group === "grand_final") return `WB GF #${getMatchNumber(match, matchNumbers)}`
  if (match.bracket_group === "reset_final") return `WB-GF-Reset #${getMatchNumber(match, matchNumbers)}`

  const group = match.bracket_group === "winner"
    ? "WB"
    : match.bracket_group === "loser"
      ? "LB"
      : "Match"
  return `${group} ${compactRoundLabel(match)} #${getMatchNumber(match, matchNumbers)}`
}

function roundLabel(match: TournamentMatch) {
  const roundNo = match.round_no ?? match.round?.order ?? null
  if (match.bracket_group === "grand_final") return "WB GF"
  if (match.bracket_group === "reset_final") return "WB GF Reset"
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
      return "RO16"
    case 2:
      return "QF-A"
    case 3:
      return "QF-B"
    case 4:
      return "SF-A"
    case 5:
      return "SF-B"
    case 6:
      return "F-A"
    case 7:
      return "F-B"
    case 8:
      return "GF"
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
      return "Loser Bracket RO16"
    case 2:
      return "Loser Bracket QF A"
    case 3:
      return "Loser Bracket QF B"
    case 4:
      return "Loser Bracket SF A"
    case 5:
      return "Loser Bracket SF B"
    case 6:
      return "Loser Bracket Finals A"
    case 7:
      return "Loser Bracket Finals B"
    case 8:
      return "Loser Bracket GF"
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

function groupScheduleRounds(matches: TournamentMatch[]) {
  const grouped = new Map<string, TournamentMatch[]>()
  for (const match of matches) {
    const stage = getMatchStage(match)
    const key = `${stage ?? "other"}-${match.bracket_group ?? "other"}-${match.round_no ?? match.round?.order ?? 0}`
    grouped.set(key, [...(grouped.get(key) ?? []), match])
  }

  const rounds = Array.from(grouped.entries()).map(([key, items]) => {
    const first = items[0]
    return {
      group: first.bracket_group ?? "other",
      key,
      matches: items.sort((a, b) => (a.slot_no ?? a.id) - (b.slot_no ?? b.id)),
      name: roundLabel(first),
      roundNo: first.round_no ?? first.round?.order ?? null,
      stage: getMatchStage(first),
    }
  }).sort((a, b) => {
    const aMatch = a.matches[0]
    const bMatch = b.matches[0]
    return getRoundSortNumber(a) - getRoundSortNumber(b)
      || getStageSortIndex(a.stage) - getStageSortIndex(b.stage)
      || (aMatch?.round?.order ?? 0) - (bMatch?.round?.order ?? 0)
      || groupSortIndex(a.group) - groupSortIndex(b.group)
      || (aMatch?.slot_no ?? aMatch?.id ?? 0) - (bMatch?.slot_no ?? bMatch?.id ?? 0)
  })

  return rounds
}

function createTournamentMatchNumbers(matches: TournamentMatch[]) {
  const numbers = new Map<number, number>()
  const reservedNumbers = new Set<number>()
  const sortedMatches = [...matches].sort(compareMatchesForFallbackNumber)

  for (const match of sortedMatches) {
    const number = getGeneratedBracketMatchNumber(match)
    if (!number || reservedNumbers.has(number)) continue
    numbers.set(match.id, number)
    reservedNumbers.add(number)
  }

  let fallbackNumber = 1
  for (const match of sortedMatches) {
    if (numbers.has(match.id)) continue
    while (reservedNumbers.has(fallbackNumber)) fallbackNumber += 1
    numbers.set(match.id, fallbackNumber)
    reservedNumbers.add(fallbackNumber)
  }
  return numbers
}

function getMatchNumber(match: TournamentMatch, matchNumbers?: Map<number, number>) {
  return matchNumbers?.get(match.id) ?? getGeneratedBracketMatchNumber(match) ?? match.id
}

function getGeneratedBracketMatchNumber(match: TournamentMatch) {
  const slot = match.slot_no
  if (!slot || slot < 1) return null

  const roundNo = match.round_no ?? match.round?.order ?? null
  if (match.bracket_group === "winner") {
    const offsets: Record<number, number> = {
      1: 0,
      2: 24,
      3: 44,
      4: 54,
      5: 59,
    }
    const offset = roundNo ? offsets[roundNo] : undefined
    return offset === undefined ? null : offset + slot
  }

  if (match.bracket_group === "loser") {
    const offsets: Record<number, number> = {
      1: 16,
      2: 32,
      3: 40,
      4: 48,
      5: 52,
      6: 56,
      7: 58,
      8: 60,
    }
    const offset = roundNo ? offsets[roundNo] : undefined
    return offset === undefined ? null : offset + slot
  }

  if (match.bracket_group === "grand_final") return 62
  if (match.bracket_group === "reset_final") return 63
  return null
}

function compareMatchesForFallbackNumber(a: TournamentMatch, b: TournamentMatch) {
  const aGenerated = getGeneratedBracketMatchNumber(a)
  const bGenerated = getGeneratedBracketMatchNumber(b)
  if (aGenerated && bGenerated && aGenerated !== bGenerated) return aGenerated - bGenerated
  if (aGenerated && !bGenerated) return -1
  if (!aGenerated && bGenerated) return 1

  return getStageSortIndex(getMatchStage(a)) - getStageSortIndex(getMatchStage(b))
    || groupSortIndex(a.bracket_group ?? "other") - groupSortIndex(b.bracket_group ?? "other")
    || (a.round_no ?? a.round?.order ?? 0) - (b.round_no ?? b.round?.order ?? 0)
    || (a.slot_no ?? a.id) - (b.slot_no ?? b.id)
    || a.id - b.id
}

function scheduleRoundDomId(key: string) {
  return `schedule-round-${key.replace(/[^a-zA-Z0-9_-]/g, "-")}`
}

function getRoundSortNumber(round: BracketRoundData) {
  const numbers = round.matches
    .map((match) => getGeneratedBracketMatchNumber(match))
    .filter((number): number is number => typeof number === "number")
  return numbers.length > 0 ? Math.min(...numbers) : Number.MAX_SAFE_INTEGER
}

function groupSortIndex(group: string) {
  if (group === "winner") return 0
  if (group === "loser") return 1
  if (group === "grand_final") return 2
  if (group === "reset_final") return 3
  return 4
}
