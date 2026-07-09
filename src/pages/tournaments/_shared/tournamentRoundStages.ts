import type { TournamentMatch, TournamentMappoolMap, TournamentRound } from "@/entities/tournament"
import { sortMappoolMaps } from "./tournamentMappool"

export const MAIN_STAGE_KEYS = ["ro32", "ro16", "qf", "sf", "f", "gf"] as const

export type MainStageKey = typeof MAIN_STAGE_KEYS[number]

export type StageRoundGroup = {
  key: MainStageKey
  label: string
  maps: TournamentMappoolMap[]
  rounds: TournamentRound[]
}

const STAGE_LABELS: Record<MainStageKey, string> = {
  f: "Finals",
  gf: "Grand Finals",
  qf: "QF",
  ro16: "RO16",
  ro32: "RO32",
  sf: "SF",
}

export function getMainStageLabel(stage: MainStageKey | null | undefined) {
  return stage ? STAGE_LABELS[stage] : "Round"
}

export function getStageSortIndex(stage: MainStageKey | null | undefined) {
  const index = stage ? MAIN_STAGE_KEYS.indexOf(stage) : -1
  return index === -1 ? MAIN_STAGE_KEYS.length : index
}

export function getRoundStage(round: Pick<TournamentRound, "bracket_type" | "name" | "order"> | null | undefined): MainStageKey | null {
  if (!round) return null

  const name = String(round.name || "").trim().toLowerCase()
  const bracketType = Number(round.bracket_type)
  const order = Number(round.order)

  if (bracketType === 2 || bracketType === 3 || name.includes("grand final") || name.includes("reset")) {
    return "gf"
  }

  if (bracketType === 1 || name.includes("loser")) {
    const loserRoundNo = getLoserRoundNo(round)
    if (loserRoundNo === 1) return "ro16"
    if (loserRoundNo === 2 || loserRoundNo === 3) return "qf"
    if (loserRoundNo === 4 || loserRoundNo === 5) return "sf"
    if (loserRoundNo === 6 || loserRoundNo === 7) return "f"
    if (loserRoundNo === 8) return "gf"
    if (name.includes("grand final")) return "gf"
    if (name.includes("semi") || name.includes("final")) return "f"
    return null
  }

  if (name.includes("ro32") || name.includes("round of 32")) return "ro32"
  if (name.includes("ro16") || name.includes("round of 16")) return "ro16"
  if (name.includes("quarter") || name.includes("qf")) return "qf"
  if (name.includes("semi") || name.includes("sf")) return "sf"
  if (name.includes("final") || name === "f") return "f"

  if (Number.isInteger(order)) {
    if (order === 1) return "ro32"
    if (order === 2) return "ro16"
    if (order === 3) return "qf"
    if (order === 4) return "sf"
    if (order === 5) return "f"
  }

  return null
}

export function getMatchStage(match: Pick<TournamentMatch, "bracket_group" | "round" | "round_no">): MainStageKey | null {
  if (match.bracket_group === "grand_final" || match.bracket_group === "reset_final") return "gf"

  if (match.bracket_group === "winner") {
    return winnerRoundStage(match.round_no ?? match.round?.order ?? null)
  }

  if (match.bracket_group === "loser") {
    return loserRoundStage(match.round_no ?? null)
  }

  return getRoundStage(match.round)
}

export function groupRoundsByMainStage(rounds: TournamentRound[]): StageRoundGroup[] {
  const groups = new Map<MainStageKey, TournamentRound[]>()
  for (const round of rounds) {
    const stage = getRoundStage(round)
    if (!stage) continue
    groups.set(stage, [...(groups.get(stage) ?? []), round])
  }

  return MAIN_STAGE_KEYS
    .map((key) => {
      const stageRounds = [...(groups.get(key) ?? [])].sort(compareRounds)
      return {
        key,
        label: getMainStageLabel(key),
        maps: dedupeMaps(stageRounds.flatMap((round) => round.mappool ?? [])),
        rounds: stageRounds,
      }
    })
    .filter((group) => group.rounds.length > 0)
}

export function compareRounds(a: Pick<TournamentRound, "id" | "order">, b: Pick<TournamentRound, "id" | "order">) {
  return (a.order ?? 0) - (b.order ?? 0) || a.id - b.id
}

function getLoserRoundNo(round: Pick<TournamentRound, "bracket_type" | "name" | "order">) {
  const name = String(round.name || "").trim().toLowerCase()
  const match = name.match(/losers?\s+round\s+(\d+)/)
  if (match) return Number(match[1])

  const order = Number(round.order)
  if (Number.isInteger(order) && order >= 6 && order <= 13) return order - 5

  return null
}

function winnerRoundStage(roundNo: number | null): MainStageKey | null {
  if (roundNo === 1) return "ro32"
  if (roundNo === 2) return "ro16"
  if (roundNo === 3) return "qf"
  if (roundNo === 4) return "sf"
  if (roundNo === 5) return "f"
  return null
}

function loserRoundStage(roundNo: number | null): MainStageKey | null {
  if (roundNo === 1) return "ro16"
  if (roundNo === 2 || roundNo === 3) return "qf"
  if (roundNo === 4 || roundNo === 5) return "sf"
  if (roundNo === 6 || roundNo === 7) return "f"
  if (roundNo === 8) return "gf"
  return null
}

function dedupeMaps(maps: TournamentMappoolMap[]) {
  const seen = new Set<string>()
  const result: TournamentMappoolMap[] = []
  for (const map of maps) {
    const key = `${map.type.toUpperCase()}-${map.map_id}`
    if (seen.has(key)) continue
    seen.add(key)
    result.push(map)
  }
  return sortMappoolMaps(result)
}
