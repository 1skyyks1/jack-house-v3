import type { MatchType } from "@elyasasmad/react-tournament-brackets"
import type { TournamentMatch } from "@/entities/tournament"
import { getMatchStage, getStageSortIndex, type MainStageKey } from "../../_shared/tournamentRoundStages"

export type BracketRoundData = {
  group: string
  key: string
  matches: TournamentMatch[]
  name: string
  roundNo?: number | null
  stage?: MainStageKey | null
}

export type DoubleEliminationMatches = {
  lower: MatchType[]
  upper: MatchType[]
}

export type MatchLookup = Map<number, TournamentMatch>

export function createScheduleRoundJumpItems(rounds: BracketRoundData[]) {
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

export function scheduleRoundDomId(key: string) {
  return `schedule-round-${key.replace(/[^a-zA-Z0-9_-]/g, "-")}`
}

export function sourceLabel(match: TournamentMatch, slot: 1 | 2, matchLookup?: MatchLookup, matchNumbers?: Map<number, number>) {
  const sourceId = slot === 1 ? match.source_match_1_id : match.source_match_2_id
  const result = slot === 1 ? match.source_match_1_result : match.source_match_2_result
  if (!sourceId) return "TBD"
  const sourceMatch = matchLookup?.get(sourceId)
  const sourceNumber = sourceMatch ? getMatchNumber(sourceMatch, matchNumbers) : matchNumbers?.get(sourceId)
  const sourceName = sourceNumber ? `Match #${sourceNumber}` : `Match #${sourceId}`
  const resultName = result === "winner" ? "Winner" : result === "loser" ? "Loser" : "Source"
  return `${resultName} of ${sourceName}`
}

export function toDoubleEliminationMatches(matches: TournamentMatch[], tournamentId: string, matchNumbers: Map<number, number>): DoubleEliminationMatches {
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
  const group = match.bracket_group === "winner" ? "WB" : match.bracket_group === "loser" ? "LB" : "Match"
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
  return ({ 1: "RO32", 2: "RO16", 3: "QF", 4: "SF", 5: "F" } as Record<number, string>)[roundNo ?? 0] ?? `R${roundNo ?? "-"}`
}

function compactLoserRoundLabel(roundNo: number | null) {
  return ({ 1: "RO16", 2: "QF-A", 3: "QF-B", 4: "SF-A", 5: "SF-B", 6: "F-A", 7: "F-B", 8: "GF" } as Record<number, string>)[roundNo ?? 0] ?? `R${roundNo ?? "-"}`
}

function winnerRoundLabel(roundNo: number | null) {
  return ({ 1: "Round of 32", 2: "Round of 16", 3: "Quarterfinals", 4: "Semifinals", 5: "Finals" } as Record<number, string>)[roundNo ?? 0] ?? `Round ${roundNo ?? "-"}`
}

function loserRoundLabel(roundNo: number | null) {
  return ({
    1: "Loser Bracket RO16",
    2: "Loser Bracket QF A",
    3: "Loser Bracket QF B",
    4: "Loser Bracket SF A",
    5: "Loser Bracket SF B",
    6: "Loser Bracket Finals A",
    7: "Loser Bracket Finals B",
    8: "Loser Bracket GF",
  } as Record<number, string>)[roundNo ?? 0] ?? `Lower Round ${roundNo ?? "-"}`
}

export function groupScheduleRounds(matches: TournamentMatch[]) {
  const grouped = new Map<string, TournamentMatch[]>()
  for (const match of matches) {
    const stage = getMatchStage(match)
    const key = `${stage ?? "other"}-${match.bracket_group ?? "other"}-${match.round_no ?? match.round?.order ?? 0}`
    grouped.set(key, [...(grouped.get(key) ?? []), match])
  }

  return Array.from(grouped.entries()).map(([key, items]) => {
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
}

export function createTournamentMatchNumbers(matches: TournamentMatch[]) {
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

export function getMatchNumber(match: TournamentMatch, matchNumbers?: Map<number, number>) {
  return matchNumbers?.get(match.id) ?? getGeneratedBracketMatchNumber(match) ?? match.id
}

function getGeneratedBracketMatchNumber(match: TournamentMatch) {
  const slot = match.slot_no
  if (!slot || slot < 1) return null
  const roundNo = match.round_no ?? match.round?.order ?? null
  if (match.bracket_group === "winner") {
    const offset = roundNo ? ({ 1: 0, 2: 24, 3: 44, 4: 54, 5: 59 } as Record<number, number>)[roundNo] : undefined
    return offset === undefined ? null : offset + slot
  }
  if (match.bracket_group === "loser") {
    const offset = roundNo ? ({ 1: 16, 2: 32, 3: 40, 4: 48, 5: 52, 6: 56, 7: 58, 8: 60 } as Record<number, number>)[roundNo] : undefined
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

function getRoundSortNumber(round: BracketRoundData) {
  const numbers = round.matches.map(getGeneratedBracketMatchNumber).filter((number): number is number => typeof number === "number")
  return numbers.length > 0 ? Math.min(...numbers) : Number.MAX_SAFE_INTEGER
}

function groupSortIndex(group: string) {
  if (group === "winner") return 0
  if (group === "loser") return 1
  if (group === "grand_final") return 2
  if (group === "reset_final") return 3
  return 4
}

function scheduleRoundNavGroup(group: string): "final" | "loser" | "winner" | "other" {
  if (group === "winner") return "winner"
  if (group === "loser") return "loser"
  if (group === "grand_final" || group === "reset_final") return "final"
  return "other"
}
