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

export function getRollWinnerTeamId(match: TournamentMatch) {
  return match.roll_winner_id ?? null
}

export function getNextAction(match: TournamentMatch, actions: TournamentMatchAction[]) {
  const rollWinnerTeamId = getRollWinnerTeamId(match)
  const otherTeamId = rollWinnerTeamId && Number(rollWinnerTeamId) === Number(match.team1_id) ? match.team2_id : match.team1_id
  const protectedCount = actions.filter((action) => action.action_type === "protect").length
  const bannedCount = actions.filter((action) => action.action_type === "ban").length
  const pickedActions = actions.filter((action) => action.action_type === "pick")

  if (!rollWinnerTeamId || !otherTeamId) {
    return { action_type: "protect" as ActionType, labelKey: "recordRollFirst", team_id: null }
  }

  if (protectedCount === 0) return { action_type: "protect" as ActionType, labelKey: "rollWinnerProtectsFirst", team_id: rollWinnerTeamId }
  if (protectedCount === 1) return { action_type: "protect" as ActionType, labelKey: "lowRollProtectsSecond", team_id: otherTeamId }
  if (bannedCount === 0) return { action_type: "ban" as ActionType, labelKey: "lowRollBansFirst", team_id: otherTeamId }
  if (bannedCount === 1) return { action_type: "ban" as ActionType, labelKey: "rollWinnerBansSecond", team_id: rollWinnerTeamId }
  if (pickedActions.length === 0) return { action_type: "pick" as ActionType, labelKey: "rollWinnerPicksFirst", team_id: rollWinnerTeamId }
  if (pickedActions.length === 1) return { action_type: "pick" as ActionType, labelKey: "lowRollPicksSecond", team_id: otherTeamId }

  const lastPick = pickedActions[pickedActions.length - 1]
  const nextTeamId = Number(lastPick.team_id) === Number(rollWinnerTeamId) ? otherTeamId : rollWinnerTeamId
  return { action_type: "pick" as ActionType, labelKey: "alternatePicks", team_id: nextTeamId }
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
