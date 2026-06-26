import type { TournamentPlayer, TournamentTeam } from "@/entities/tournament"
import { formatDate } from "@/shared/lib/date"
import type { TFunction } from "i18next"

export function isTeamCaptain(team: TournamentTeam, userId: number | null) {
  if (!userId) return false
  if (Number(team.captain_id) === userId) return true
  return (team.players ?? []).some((player) => isPlayerCaptain(team, player) && Number(player.user_id) === userId)
}

export function isPlayerCaptain(team: TournamentTeam, player: TournamentPlayer) {
  return Boolean(player.is_captain) || Number(team.captain_player_id) === Number(player.id)
}

export function isTeamMutable(team: TournamentTeam) {
  return !team.locked_at && team.status !== 1 && team.status !== 2 && team.status !== 3
}

export function getTeamStatusLabel(status: number | undefined, t: TFunction) {
  switch (status) {
    case 1:
      return t("admin.tournaments.teams.status.approved", { defaultValue: "Approved" })
    case 2:
      return t("admin.tournaments.teams.status.submitted", { defaultValue: "Submitted" })
    case 3:
      return t("admin.tournaments.teams.status.locked", { defaultValue: "Locked" })
    default:
      return t("admin.tournaments.teams.status.created", { defaultValue: "Created" })
  }
}

export function getRegistrationStatus(tournament: { reg_end?: string | null; reg_start?: string | null } | undefined, t: TFunction) {
  const now = Date.now()
  const regStart = tournament?.reg_start ? new Date(tournament.reg_start).getTime() : Number.NaN
  const regEnd = tournament?.reg_end ? new Date(tournament.reg_end).getTime() : Number.NaN

  if (!Number.isNaN(regStart) && now < regStart) {
    return {
      blockReason: t("tournament.teams.registrationOpensOn", { date: formatDate(tournament?.reg_start), defaultValue: `Registration opens on ${formatDate(tournament?.reg_start)}.` }),
      isOpen: false,
      message: t("tournament.teams.registrationAvailableRange", { end: formatDate(tournament?.reg_end), start: formatDate(tournament?.reg_start), defaultValue: `Team creation and joining will be available from ${formatDate(tournament?.reg_start)} to ${formatDate(tournament?.reg_end)}.` }),
      title: t("tournament.teams.registrationNotOpen", { defaultValue: "Registration not open" }),
    }
  }

  if (!Number.isNaN(regEnd) && now > regEnd) {
    return {
      blockReason: t("tournament.teams.registrationClosedOn", { date: formatDate(tournament?.reg_end), defaultValue: `Registration closed on ${formatDate(tournament?.reg_end)}.` }),
      isOpen: false,
      message: t("tournament.teams.registrationClosedDescription", { defaultValue: "Team creation, joining, leaving and roster changes are locked after registration closes." }),
      title: t("tournament.teams.registrationClosed", { defaultValue: "Registration closed" }),
    }
  }

  return {
    blockReason: null,
    isOpen: true,
    message: tournament?.reg_end ? t("tournament.teams.registrationOpenUntil", { date: formatDate(tournament.reg_end), defaultValue: `Registration is open until ${formatDate(tournament.reg_end)}.` }) : null,
    title: t("tournament.teams.registrationOpen", { defaultValue: "Registration open" }),
  }
}
