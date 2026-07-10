import { useEffect, useRef, useState, type ReactElement, type RefObject } from "react"
import { ThemeProvider } from "styled-components"
import {
  createTheme,
  SVGViewer,
  type ComputedOptionsType,
  type MatchComponentProps,
  type MatchType,
  type OptionsType,
} from "@elyasasmad/react-tournament-brackets"
import LowerBracket from "@elyasasmad/react-tournament-brackets/dist/esm/bracket-double/lower-bracket"
import UpperBracket from "@elyasasmad/react-tournament-brackets/dist/esm/bracket-double/upper-bracket"
import Connector from "@elyasasmad/react-tournament-brackets/dist/esm/components/connector"
import RoundHeader from "@elyasasmad/react-tournament-brackets/dist/esm/components/round-header"
import { calculateSVGDimensions } from "@elyasasmad/react-tournament-brackets/dist/esm/core/calculate-svg-dimensions"
import { MatchContextProvider } from "@elyasasmad/react-tournament-brackets/dist/esm/core/match-context"
import { generatePreviousRound } from "@elyasasmad/react-tournament-brackets/dist/esm/core/match-functions"
import MatchWrapper from "@elyasasmad/react-tournament-brackets/dist/esm/core/match-wrapper"
import { defaultStyle, getCalculatedStyles } from "@elyasasmad/react-tournament-brackets/dist/esm/settings"
import { cn } from "@/lib/utils"
import type { DoubleEliminationMatches } from "../model"

const bracketTheme = createTheme({
  border: { color: "var(--border)", highlightedColor: "var(--primary)" },
  canvasBackground: "var(--background)",
  disabledColor: "var(--muted-foreground)",
  fontFamily: "inherit",
  matchBackground: { lostColor: "var(--card)", wonColor: "var(--card)" },
  roundHeaders: { background: "var(--muted)" },
  score: {
    background: { lostColor: "var(--muted)", wonColor: "var(--primary)" },
    text: { highlightedLostColor: "var(--foreground)", highlightedWonColor: "var(--primary-foreground)" },
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

export function DoubleEliminationBracketView({ matches, onMatchClick }: { matches: DoubleEliminationMatches; onMatchClick: (match: MatchType) => void }) {
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

function ShiftedDoubleEliminationBracket({ matches, onMatchClick, svgWrapper: SvgWrapper }: {
  matches: DoubleEliminationMatches
  onMatchClick: (match: MatchType) => void
  svgWrapper: (props: BracketSvgWrapperProps) => ReactElement
}) {
  const style = {
    ...defaultStyle,
    ...bracketLayoutStyle,
    lineInfo: { ...defaultStyle.lineInfo, ...bracketLayoutStyle.lineInfo },
    roundHeader: { ...defaultStyle.roundHeader, ...bracketLayoutStyle.roundHeader },
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
  const totalNumOfRounds = lowerColumns.length + lowerBracketColumnOffset + 1 + (hasMultipleFinals ? finalsArray.length - 1 : 0)
  const upperDimensions = calculateSVGDimensions(upperColumns[0]?.length ?? 0, upperColumns.length, rowHeight, columnWidth, canvasPadding, roundHeader)
  const lowerDimensions = calculateSVGDimensions(lowerColumns[0]?.length ?? 0, lowerColumns.length, rowHeight, columnWidth, canvasPadding, roundHeader)
  const fullDimensions = calculateSVGDimensions(lowerColumns[0]?.length ?? 0, totalNumOfRounds, rowHeight, columnWidth, canvasPadding, roundHeader)
  const gameHeight = upperDimensions.gameHeight + lowerDimensions.gameHeight
  const lowerOffsetX = lowerBracketColumnOffset * columnWidth

  return (
    <ThemeProvider theme={bracketTheme}>
      <SvgWrapper bracketHeight={gameHeight} bracketWidth={fullDimensions.gameWidth} startAt={upperDimensions.startPosition}>
        <svg height={gameHeight} viewBox={`0 0 ${fullDimensions.gameWidth} ${gameHeight}`} width={fullDimensions.gameWidth}>
          <MatchContextProvider>
            <g>
              <ShiftedRoundHeaders calculatedStyles={calculatedStyles} numOfRounds={totalNumOfRounds} />
              <UpperBracket
                calculatedStyles={calculatedStyles}
                columns={upperColumns}
                gameHeight={gameHeight}
                gameWidth={fullDimensions.gameWidth}
                matchComponent={TournamentBracketMatch}
                onPartyClick={undefined}
                onMatchClick={({ match }: { match: MatchType }) => onMatchClick(match)}
              />
              <g transform={`translate(${lowerOffsetX} 0)`}>
                <LowerBracket
                  calculatedStyles={calculatedStyles}
                  columns={lowerColumns}
                  gameHeight={gameHeight}
                  gameWidth={fullDimensions.gameWidth}
                  matchComponent={TournamentBracketMatch}
                  upperBracketHeight={upperDimensions.gameHeight}
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
                lowerBracketHeight={lowerDimensions.gameHeight}
                lowerOffsetX={lowerOffsetX}
                match={convergingMatch}
                numOfLowerRounds={lowerColumns.length}
                numOfUpperRounds={upperColumns.length}
                upperBracketHeight={upperDimensions.gameHeight}
                onMatchClick={({ match }) => onMatchClick(match)}
              />
              {hasMultipleFinals ? (
                <ShiftedExtraFinal
                  bracketSnippet={{ currentMatch: finalsArray[1], previousBottomMatch: finalsArray[0], previousTopMatch: null }}
                  calculatedStyles={calculatedStyles}
                  columnIndex={resetFinalColumnIndex}
                  gameHeight={gameHeight}
                  lowerBracketHeight={lowerDimensions.gameHeight}
                  match={finalsArray[1]}
                  upperBracketHeight={upperDimensions.gameHeight}
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

function TournamentBracketMatch({ bottomParty, bottomWon, match, onMatchClick, topParty, topWon }: MatchComponentProps) {
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

type BracketSvgWrapperProps = { bracketHeight: number; bracketWidth: number; children: ReactElement; startAt: number[] }
type BracketPosition = { x: number; y: number }
type BracketSnippet = { currentMatch: MatchType | null; previousBottomMatch: MatchType | null; previousTopMatch: MatchType | null }
type BracketMatchClickPayload = { bottomWon: boolean; match: MatchType; topWon: boolean }

function ShiftedRoundHeaders({ calculatedStyles, numOfRounds }: { calculatedStyles: ComputedOptionsType; numOfRounds: number }) {
  const { canvasPadding = 0, columnWidth = 0, roundHeader, rowHeight = 0, width = 0 } = calculatedStyles
  if (!roundHeader?.isShown) return null
  return Array.from({ length: numOfRounds }).map((_, columnIndex) => {
    const { x } = calculatePositionOfMatchLowerBracket(0, columnIndex, { canvasPadding, columnWidth, rowHeight })
    return (
      <g key={`round-${columnIndex}-${x}`}>
        <RoundHeader canvasPadding={canvasPadding} columnIndex={columnIndex} numOfRounds={numOfRounds} roundHeader={roundHeader} tournamentRoundText={`${columnIndex + 1}`} width={width} x={x} />
      </g>
    )
  })
}

function ShiftedFinalGame({ bracketSnippet, calculatedStyles, columnIndex, gameHeight, lowerBracketHeight, lowerOffsetX, match, numOfLowerRounds, numOfUpperRounds, onMatchClick, upperBracketHeight }: {
  bracketSnippet: BracketSnippet
  calculatedStyles: ComputedOptionsType
  columnIndex: number
  gameHeight: number
  lowerBracketHeight: number
  lowerOffsetX: number
  match: MatchType
  numOfLowerRounds: number
  numOfUpperRounds: number
  onMatchClick: (args: BracketMatchClickPayload) => void
  upperBracketHeight: number
}) {
  const { canvasPadding = 0, columnWidth = 0, roundHeader, rowHeight = 0 } = calculatedStyles
  const { x, y } = calculatePositionOfFinalGame(0, columnIndex, { canvasPadding, columnWidth, gameHeight, lowerBracketHeight, rowHeight, upperBracketHeight })
  return (
    <>
      <ShiftedFinalConnectors bracketSnippet={bracketSnippet} calculatedStyles={calculatedStyles} columnIndex={columnIndex} gameHeight={gameHeight} lowerBracketHeight={lowerBracketHeight} lowerOffsetX={lowerOffsetX} numOfLowerRounds={numOfLowerRounds} numOfUpperRounds={numOfUpperRounds} upperBracketHeight={upperBracketHeight} />
      <g>
        <MatchWrapper bottomText={match.name ?? ""} columnIndex={columnIndex} match={match} matchComponent={TournamentBracketMatch} previousBottomMatch={bracketSnippet.previousBottomMatch} rowIndex={0} style={calculatedStyles} teams={match.participants} topText={match.startTime} x={x} y={y + roundHeaderOffset(roundHeader)} onPartyClick={undefined} onMatchClick={onMatchClick} />
      </g>
    </>
  )
}

function ShiftedExtraFinal({ bracketSnippet, calculatedStyles, columnIndex, gameHeight, lowerBracketHeight, match, onMatchClick, upperBracketHeight }: {
  bracketSnippet: BracketSnippet
  calculatedStyles: ComputedOptionsType
  columnIndex: number
  gameHeight: number
  lowerBracketHeight: number
  match: MatchType
  onMatchClick: (args: BracketMatchClickPayload) => void
  upperBracketHeight: number
}) {
  const { canvasPadding = 0, columnWidth = 0, roundHeader, rowHeight = 0 } = calculatedStyles
  const { x, y } = calculatePositionOfFinalGame(0, columnIndex, { canvasPadding, columnWidth, gameHeight, lowerBracketHeight, rowHeight, upperBracketHeight })
  return (
    <>
      <ShiftedExtraFinalConnectors bracketSnippet={bracketSnippet} calculatedStyles={calculatedStyles} columnIndex={columnIndex} gameHeight={gameHeight} lowerBracketHeight={lowerBracketHeight} upperBracketHeight={upperBracketHeight} />
      <g>
        <MatchWrapper bottomText={match.name ?? ""} columnIndex={columnIndex} match={match} matchComponent={TournamentBracketMatch} previousBottomMatch={bracketSnippet.previousBottomMatch} rowIndex={0} style={calculatedStyles} teams={match.participants} topText={match.startTime} x={x} y={y + roundHeaderOffset(roundHeader)} onPartyClick={undefined} onMatchClick={onMatchClick} />
      </g>
    </>
  )
}

function ShiftedFinalConnectors({ bracketSnippet, calculatedStyles, columnIndex, gameHeight, lowerBracketHeight, lowerOffsetX, numOfLowerRounds, numOfUpperRounds, upperBracketHeight }: {
  bracketSnippet: BracketSnippet
  calculatedStyles: ComputedOptionsType
  columnIndex: number
  gameHeight: number
  lowerBracketHeight: number
  lowerOffsetX: number
  numOfLowerRounds: number
  numOfUpperRounds: number
  upperBracketHeight: number
}) {
  const { canvasPadding = 0, columnWidth = 0, rowHeight = 0 } = calculatedStyles
  return (
    <Connector
      bracketSnippet={bracketSnippet}
      currentMatchPosition={calculatePositionOfFinalGame(0, columnIndex, { canvasPadding, columnWidth, gameHeight, lowerBracketHeight, rowHeight, upperBracketHeight })}
      previousBottomMatchPosition={calculatePositionOfMatchLowerBracket(0, numOfLowerRounds - 1, { canvasPadding, columnWidth, offsetX: lowerOffsetX, offsetY: upperBracketHeight, rowHeight })}
      previousTopMatchPosition={calculatePositionOfMatchUpperBracket(0, numOfUpperRounds - 1, { canvasPadding, columnWidth, rowHeight })}
      style={calculatedStyles}
    />
  )
}

function ShiftedExtraFinalConnectors({ bracketSnippet, calculatedStyles, columnIndex, gameHeight, lowerBracketHeight, upperBracketHeight }: {
  bracketSnippet: BracketSnippet
  calculatedStyles: ComputedOptionsType
  columnIndex: number
  gameHeight: number
  lowerBracketHeight: number
  upperBracketHeight: number
}) {
  const { canvasPadding = 0, columnWidth = 0, rowHeight = 0 } = calculatedStyles
  return (
    <Connector
      bracketSnippet={bracketSnippet}
      currentMatchPosition={calculatePositionOfFinalGame(0, columnIndex, { canvasPadding, columnWidth, gameHeight, lowerBracketHeight, rowHeight, upperBracketHeight })}
      previousBottomMatchPosition={calculatePositionOfFinalGame(0, columnIndex - 1, { canvasPadding, columnWidth, gameHeight, lowerBracketHeight, rowHeight, upperBracketHeight })}
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
    return previousMatchesColumn.length > 0 ? [...generateColumn(previousMatchesColumn), previousMatchesColumn] : [previousMatchesColumn]
  }
  return final ? [...generateColumn([final]), []].filter((column) => column.length > 0) : []
}

function calculateVerticalPositioning(columnIndex: number, rowIndex: number, rowHeight: number) {
  return 2 ** columnIndex * rowHeight * rowIndex + 2 ** columnIndex * (rowHeight / 2) - rowHeight / 2
}

function calculatePositionOfMatchUpperBracket(rowIndex: number, columnIndex: number, { canvasPadding, columnWidth, offsetX = 0, offsetY = 0, rowHeight }: PositionOptions): BracketPosition {
  const xResult = columnIndex <= 1 ? columnIndex * columnWidth : (Math.floor((columnIndex + 1) * 2) - 3) * columnWidth
  return { x: xResult + canvasPadding + offsetX, y: calculateVerticalPositioning(columnIndex, rowIndex, rowHeight) + canvasPadding + offsetY }
}

function calculatePositionOfMatchLowerBracket(rowIndex: number, columnIndex: number, { canvasPadding, columnWidth, offsetX = 0, offsetY = 0, rowHeight }: PositionOptions): BracketPosition {
  const lowerColumnIndex = Math.ceil((columnIndex + 1) / 2) - 1
  return { x: columnIndex * columnWidth + canvasPadding + offsetX, y: calculateVerticalPositioning(lowerColumnIndex, rowIndex, rowHeight) + canvasPadding + offsetY }
}

function calculatePositionOfFinalGame(_rowIndex: number, columnIndex: number, { canvasPadding, columnWidth, gameHeight, lowerBracketHeight, offsetX = 0, offsetY = 0, rowHeight, upperBracketHeight }: FinalPositionOptions): BracketPosition {
  return { x: columnIndex * columnWidth + canvasPadding + offsetX, y: gameHeight * (lowerBracketHeight / upperBracketHeight) - rowHeight + canvasPadding + offsetY }
}

type PositionOptions = { canvasPadding: number; columnWidth: number; offsetX?: number; offsetY?: number; rowHeight: number }
type FinalPositionOptions = PositionOptions & { gameHeight: number; lowerBracketHeight: number; upperBracketHeight: number }

function roundHeaderOffset(roundHeader: ComputedOptionsType["roundHeader"]) {
  return roundHeader?.isShown ? (roundHeader.height ?? 0) + (roundHeader.marginBottom ?? 0) : 0
}

function toStartAtTuple(startAt: number[]): [number, number] {
  return [startAt[0] ?? 0, startAt[1] ?? 0]
}

function bracketRoundHeaderLabel(currentRoundNumber: number, roundsTotalNumber: number) {
  const labels = roundsTotalNumber >= 11
    ? ["WB RO32", "WB/LB RO16", "LB QF A", "WB/LB QF B", "LB SF A", "WB/LB SF B", "LB Finals A", "WB/LB Finals B", "LB Grand Final", "Grand Final", "Reset Final"]
    : ["WB RO32", "WB/LB RO16", "LB QF A", "WB/LB QF B", "LB SF A", "WB/LB SF B", "LB Finals A", "WB/LB Finals B", "LB Grand Final", "Grand Final"]
  return labels[currentRoundNumber - 1] ?? `Round ${currentRoundNumber}`
}

function useElementSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ height: 680, width: 1200 })
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const update = () => {
      const rect = element.getBoundingClientRect()
      setSize({ height: Math.max(520, Math.round(rect.height)), width: Math.max(960, Math.round(rect.width)) })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])
  return size
}
