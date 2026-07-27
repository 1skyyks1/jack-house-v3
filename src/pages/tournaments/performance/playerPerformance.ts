import type {
  TournamentPerformance,
  TournamentPerformanceEntry,
  TournamentPerformanceMap,
  TournamentMappoolMap,
  TournamentPlayer,
} from "@/entities/tournament"
import { buildMappoolLabelMap, normalizeMapType } from "../_shared/tournamentMappool"

export type PlayerPerformanceEntry = TournamentPerformanceEntry & {
  mapData: TournamentPerformanceMap
  mapLabel: string
  stageKey: string
  stageLabel: string
  won: boolean
}

export type PlayerPerformanceStage = {
  averageRank: number
  averageScore: number
  games: number
  key: string
  label: string
  wins: number
}

export type PlayerPerformanceProfile = {
  averageRank: number
  bestRank: number
  entries: PlayerPerformanceEntry[]
  mapCount: number
  player: TournamentPlayer
  stages: PlayerPerformanceStage[]
  team: TournamentPerformanceEntry["team"]
  topThreeCount: number
}

export type PlayerPerformanceRoundGroup = {
  key: string
  label: string
  roundIds: number[]
}

export function buildPlayerPerformanceProfiles(
  performance?: TournamentPerformance,
  roundGroups: PlayerPerformanceRoundGroup[] = [],
  selectedRoundKey?: string,
): PlayerPerformanceProfile[] {
  const entriesByPlayer = new Map<number, PlayerPerformanceEntry[]>()
  const roundGroupById = new Map(roundGroups.flatMap((group) => group.roundIds.map((roundId) => [roundId, group] as const)))
  const mappoolLabelByMapId = buildPerformanceMappoolLabelMap(performance)

  for (const stage of performance?.stages ?? []) {
    for (const mapData of stage.maps) {
      const roundGroup = mapData.map?.round_id ? roundGroupById.get(mapData.map.round_id) : undefined
      if (selectedRoundKey && roundGroup?.key !== selectedRoundKey) continue
      const winningSideByGameId = getWinningSideByGameId(mapData.entries)
      for (const entry of mapData.entries) {
        if (!entry.player) continue
        const entries = entriesByPlayer.get(entry.player.id) ?? []
        entries.push({
          ...entry,
          mapData,
          mapLabel: mapData.map
            ? mappoolLabelByMapId.get(mapData.map.id) ?? normalizeMapType(mapData.map.type)
            : mapData.key,
          stageKey: roundGroup?.key ?? stage.key,
          stageLabel: roundGroup?.label ?? stage.label,
          won: winningSideByGameId.get(entry.game_id) === entry.side,
        })
        entriesByPlayer.set(entry.player.id, entries)
      }
    }
  }

  return Array.from(entriesByPlayer.values())
    .map((entries) => buildProfile(entries))
    .sort((a, b) => getPlayerName(a).localeCompare(getPlayerName(b)))
}

export function getPlayerName(profile: Pick<PlayerPerformanceProfile, "player">) {
  return profile.player.user_name_snapshot || profile.player.user?.user_name || `Player ${profile.player.id}`
}

export function getPlayerAvatar(profile: Pick<PlayerPerformanceProfile, "player">) {
  return profile.player.avatar_snapshot || profile.player.user?.avatar || undefined
}

export function getPlayerTeamName(profile: Pick<PlayerPerformanceProfile, "team">) {
  return profile.team.display_name || profile.team.name
}

export function getPerformanceMapLabel(entry: Pick<PlayerPerformanceEntry, "mapLabel">) {
  return entry.mapLabel
}

function buildPerformanceMappoolLabelMap(performance?: TournamentPerformance) {
  const mapsByRound = new Map<string, TournamentMappoolMap[]>()
  for (const stage of performance?.stages ?? []) {
    for (const mapData of stage.maps) {
      const map = mapData.map
      if (!map) continue
      const roundKey = map.round_id ? `round:${map.round_id}` : `stage:${stage.key}`
      const maps = mapsByRound.get(roundKey) ?? []
      if (!maps.some((item) => item.id === map.id)) maps.push(map)
      mapsByRound.set(roundKey, maps)
    }
  }

  const labelByMapId = new Map<number, string>()
  for (const maps of mapsByRound.values()) {
    for (const [mapId, label] of buildMappoolLabelMap(maps)) labelByMapId.set(mapId, label)
  }
  return labelByMapId
}

function buildProfile(entries: PlayerPerformanceEntry[]): PlayerPerformanceProfile {
  const stageEntries = new Map<string, PlayerPerformanceEntry[]>()
  for (const entry of entries) {
    stageEntries.set(entry.stageKey, [...(stageEntries.get(entry.stageKey) ?? []), entry])
  }

  const stages = Array.from(stageEntries.entries()).map(([key, stageGames]) => ({
    averageRank: average(stageGames.map((entry) => entry.rank)),
    averageScore: average(stageGames.map((entry) => entry.score)),
    games: stageGames.length,
    key,
    label: stageGames[0]?.stageLabel ?? key,
    wins: stageGames.filter((entry) => entry.won).length,
  }))

  return {
    averageRank: average(entries.map((entry) => entry.rank)),
    bestRank: Math.min(...entries.map((entry) => entry.rank)),
    entries: [...entries].sort((a, b) => a.game_id - b.game_id),
    mapCount: new Set(entries.map((entry) => `${entry.stageKey}:${entry.mapData.key}`)).size,
    player: entries[0].player as TournamentPlayer,
    stages,
    team: entries[entries.length - 1].team,
    topThreeCount: entries.filter((entry) => entry.rank <= 3).length,
  }
}

function average(values: number[]) {
  return values.length > 0 ? sum(values) / values.length : 0
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0)
}

function getWinningSideByGameId(entries: TournamentPerformanceEntry[]) {
  const scoresByGame = new Map<number, Map<number, number>>()
  for (const entry of entries) {
    const scoresBySide = scoresByGame.get(entry.game_id) ?? new Map<number, number>()
    scoresBySide.set(entry.side, Math.max(scoresBySide.get(entry.side) ?? 0, entry.score))
    scoresByGame.set(entry.game_id, scoresBySide)
  }

  const winningSideByGameId = new Map<number, number>()
  for (const [gameId, scoresBySide] of scoresByGame) {
    const scores = Array.from(scoresBySide.entries()).sort((left, right) => right[1] - left[1])
    if (scores.length >= 2 && scores[0][1] > scores[1][1]) {
      winningSideByGameId.set(gameId, scores[0][0])
    }
  }
  return winningSideByGameId
}
