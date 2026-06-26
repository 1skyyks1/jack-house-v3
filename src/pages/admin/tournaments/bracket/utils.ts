import type { TournamentTeam } from "@/entities/tournament"

export function teamName(team?: TournamentTeam | null) {
  return team?.display_name ?? team?.name ?? "TBD"
}

export function groupLabel(group?: string | null) {
  if (group === "winner") return "Winners"
  if (group === "loser") return "Losers"
  if (group === "grand_final") return "Grand Final"
  if (group === "reset_final") return "Reset Final"
  return "Manual"
}
