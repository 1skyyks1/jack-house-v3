import type { TournamentMappoolMap, TournamentMatch, TournamentMatchAction, TournamentTeam } from "@/entities/tournament"
import type { ActionType } from "./types"

export function isMapDisabled(actionType: ActionType, map: TournamentMappoolMap, actions: TournamentMatchAction[], ignoredActionId?: number) {
  const otherActions = actions.filter((action) => !ignoredActionId || action.id !== ignoredActionId)
  const isProtected = otherActions.some((action) => action.action_type === "protect" && action.map_id === map.id)
  const isBanned = otherActions.some((action) => action.action_type === "ban" && action.map_id === map.id)
  const isPicked = otherActions.some((action) => action.action_type === "pick" && action.map_id === map.id)

  if (actionType === "protect") return isProtected || isBanned || isPicked
  if (actionType === "ban") return isProtected || isBanned || isPicked
  return isBanned || isPicked
}

export function getHighRollTeamId(match: TournamentMatch) {
  if (match.team1_roll == null || match.team2_roll == null) return null
  return match.team1_roll > match.team2_roll ? match.team1_id : match.team2_id
}

export function getNextAction(match: TournamentMatch, actions: TournamentMatchAction[]) {
  const highRollTeamId = getHighRollTeamId(match)
  const lowRollTeamId = highRollTeamId && Number(highRollTeamId) === Number(match.team1_id) ? match.team2_id : match.team1_id
  const protectedCount = actions.filter((action) => action.action_type === "protect").length
  const bannedCount = actions.filter((action) => action.action_type === "ban").length
  const pickedActions = actions.filter((action) => action.action_type === "pick")

  if (!highRollTeamId || !lowRollTeamId) {
    return { action_type: "protect" as ActionType, label: "Record both roll points first", team_id: null }
  }

  if (protectedCount === 0) return { action_type: "protect" as ActionType, label: "High roll protects first", team_id: highRollTeamId }
  if (protectedCount === 1) return { action_type: "protect" as ActionType, label: "Low roll protects second", team_id: lowRollTeamId }
  if (bannedCount === 0) return { action_type: "ban" as ActionType, label: "Low roll bans first", team_id: lowRollTeamId }
  if (bannedCount === 1) return { action_type: "ban" as ActionType, label: "High roll bans second", team_id: highRollTeamId }
  if (pickedActions.length === 0) return { action_type: "pick" as ActionType, label: "High roll picks first", team_id: highRollTeamId }
  if (pickedActions.length === 1) return { action_type: "pick" as ActionType, label: "Low roll picks second", team_id: lowRollTeamId }

  const lastPick = pickedActions[pickedActions.length - 1]
  const nextTeamId = Number(lastPick.team_id) === Number(highRollTeamId) ? lowRollTeamId : highRollTeamId
  return { action_type: "pick" as ActionType, label: "Alternate picks", team_id: nextTeamId }
}

export function teamName(team?: TournamentTeam | null) {
  return team?.display_name ?? team?.name ?? "TBD"
}

export function teamNameById(match: TournamentMatch, teamId?: number | null) {
  if (Number(teamId) === Number(match.team1_id)) return teamName(match.team1)
  if (Number(teamId) === Number(match.team2_id)) return teamName(match.team2)
  return "Unknown team"
}

export function mapTitle(map?: TournamentMappoolMap | null) {
  if (!map) return "Unknown map"
  return `${map.artist} - ${map.title}`
}

export function normalizeActionType(actionType: string): ActionType {
  if (actionType === "ban" || actionType === "pick" || actionType === "protect") return actionType
  return "pick"
}

export function getActionNote(action: TournamentMatchAction) {
  if (!action.value_json) return ""
  try {
    const value = JSON.parse(action.value_json) as { note?: string | null }
    return value.note ?? ""
  } catch {
    return ""
  }
}
