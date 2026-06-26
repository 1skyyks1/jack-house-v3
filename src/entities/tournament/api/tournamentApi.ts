import { http } from "@/shared/api/http"
import type {
  CreateTournamentQualMapRequest,
  CreateTournamentRequest,
  CreateTournamentMatchRequest,
  CreateTournamentRoundMapRequest,
  CreateTournamentRoundRequest,
  CreateTournamentStaffRequest,
  CreateTournamentTeamRequest,
  FetchTournamentQualScoresRequest,
  JoinTournamentTeamRequest,
  Tournament,
  TournamentAuditLogList,
  TournamentAuditLogQuery,
  TournamentHistoricalImportRequest,
  TournamentHistoricalImportResult,
  TournamentMarkdownPreviewRequest,
  TournamentMarkdownPreviewResult,
  TournamentMatch,
  TournamentMappoolMap,
  TournamentQualImportList,
  TournamentQualMap,
  TournamentQualScore,
  TournamentRefereeData,
  TournamentRound,
  TournamentSection,
  TournamentSectionRequest,
  TournamentStaff,
  TournamentTeam,
  TransferTournamentCaptainRequest,
  UpdateTournamentTeamInfoRequest,
  RecordTournamentRollRequest,
  TournamentMatchAction,
  TournamentMatchActionRequest,
  UpdateTournamentGameScoreRequest,
  UpdateTournamentMatchRequest,
  UpdateTournamentQualMapRequest,
  UpdateTournamentQualScoreRequest,
  UpdateTournamentPlayerRequest,
  UpdateTournamentRoundRequest,
  UpdateTournamentTeamStatusRequest,
  UpdateTournamentRequest,
} from "../model/types"

export async function getTournamentList(): Promise<Tournament[]> {
  return await http.get("/tournament") as unknown as Tournament[]
}

export async function createTournament(request: CreateTournamentRequest): Promise<Tournament> {
  return await http.post("/tournament", request) as unknown as Tournament
}

export async function getTournamentById(tournamentId: string): Promise<Tournament> {
  return await http.get(`/tournament/${tournamentId}`) as unknown as Tournament
}

export async function updateTournament(tournamentId: string, request: UpdateTournamentRequest): Promise<Tournament> {
  return await http.put(`/tournament/${tournamentId}`, request) as unknown as Tournament
}

export async function getTournamentSections(tournamentId: string): Promise<TournamentSection[]> {
  return await http.get(`/tournament/${tournamentId}/sections`) as unknown as TournamentSection[]
}

export async function getTournamentManageSections(tournamentId: string): Promise<TournamentSection[]> {
  return await http.get(`/tournament/${tournamentId}/sections/manage`) as unknown as TournamentSection[]
}

export async function getTournamentAuditLogs(tournamentId: string, params?: TournamentAuditLogQuery): Promise<TournamentAuditLogList> {
  return await http.get(`/tournament/${tournamentId}/audit-logs`, { params }) as unknown as TournamentAuditLogList
}

export async function getTournamentStaff(tournamentId: string): Promise<TournamentStaff[]> {
  return await http.get(`/tournament/${tournamentId}/staff`) as unknown as TournamentStaff[]
}

export async function createTournamentStaff(tournamentId: string, request: CreateTournamentStaffRequest): Promise<TournamentStaff> {
  return await http.post(`/tournament/${tournamentId}/staff`, request) as unknown as TournamentStaff
}

export async function deleteTournamentStaff(tournamentId: string, staffId: number): Promise<void> {
  await http.delete(`/tournament/${tournamentId}/staff/${staffId}`)
}

export async function createTournamentSection(tournamentId: string, request: TournamentSectionRequest): Promise<TournamentSection> {
  return await http.post(`/tournament/${tournamentId}/sections`, request) as unknown as TournamentSection
}

export async function updateTournamentSection(tournamentId: string, sectionId: number, request: TournamentSectionRequest): Promise<TournamentSection> {
  return await http.put(`/tournament/${tournamentId}/sections/${sectionId}`, request) as unknown as TournamentSection
}

export async function deleteTournamentSection(tournamentId: string, sectionId: number): Promise<void> {
  await http.delete(`/tournament/${tournamentId}/sections/${sectionId}`)
}

export async function previewTournamentMarkdown(tournamentId: string, request: TournamentMarkdownPreviewRequest): Promise<TournamentMarkdownPreviewResult> {
  return await http.post(`/tournament/${tournamentId}/sections/preview`, request) as unknown as TournamentMarkdownPreviewResult
}

export async function getTournamentBracket(tournamentId: string): Promise<TournamentMatch[]> {
  return await http.get(`/tournament/${tournamentId}/bracket`) as unknown as TournamentMatch[]
}

export async function generateTournamentBracket(tournamentId: string): Promise<unknown> {
  return await http.post(`/tournament/${tournamentId}/bracket/generate`) as unknown
}

export async function getTournamentMatch(tournamentId: string, matchId: string): Promise<TournamentMatch> {
  return await http.get(`/tournament/${tournamentId}/match/${matchId}`) as unknown as TournamentMatch
}

export async function getTournamentRounds(tournamentId: string): Promise<TournamentRound[]> {
  return await http.get(`/tournament/${tournamentId}/rounds`) as unknown as TournamentRound[]
}

export async function createTournamentRound(tournamentId: string, request: CreateTournamentRoundRequest): Promise<TournamentRound> {
  return await http.post(`/tournament/${tournamentId}/round`, request) as unknown as TournamentRound
}

export async function updateTournamentRound(tournamentId: string, roundId: number, request: UpdateTournamentRoundRequest): Promise<TournamentRound> {
  return await http.put(`/tournament/${tournamentId}/round/${roundId}`, request) as unknown as TournamentRound
}

export async function deleteTournamentRound(tournamentId: string, roundId: number): Promise<void> {
  await http.delete(`/tournament/${tournamentId}/round/${roundId}`)
}

export async function getTournamentRoundMappool(tournamentId: string, roundId: number): Promise<TournamentMappoolMap[]> {
  return await http.get(`/tournament/${tournamentId}/round/${roundId}/mappool`) as unknown as TournamentMappoolMap[]
}

export async function createTournamentRoundMap(tournamentId: string, roundId: number, request: CreateTournamentRoundMapRequest): Promise<TournamentMappoolMap> {
  return await http.post(`/tournament/${tournamentId}/round/${roundId}/mappool`, request) as unknown as TournamentMappoolMap
}

export async function deleteTournamentRoundMap(tournamentId: string, mapId: number): Promise<void> {
  await http.delete(`/tournament/${tournamentId}/round/mappool/${mapId}`)
}

export async function createTournamentMatch(tournamentId: string, request: CreateTournamentMatchRequest): Promise<TournamentMatch> {
  return await http.post(`/tournament/${tournamentId}/match`, request) as unknown as TournamentMatch
}

export async function updateTournamentMatch(tournamentId: string, matchId: number, request: UpdateTournamentMatchRequest): Promise<TournamentMatch> {
  return await http.put(`/tournament/${tournamentId}/match/${matchId}`, request) as unknown as TournamentMatch
}

export async function fetchTournamentMatchScores(tournamentId: string, matchId: number): Promise<unknown> {
  return await http.post(`/tournament/${tournamentId}/match/${matchId}/fetch-scores`) as unknown
}

export async function getTournamentRefereeData(tournamentId: string, matchId: string): Promise<TournamentRefereeData> {
  return await http.get(`/tournament/${tournamentId}/referee/${matchId}`) as unknown as TournamentRefereeData
}

export async function recordTournamentRoll(tournamentId: string, matchId: string, request: RecordTournamentRollRequest): Promise<unknown> {
  return await http.post(`/tournament/${tournamentId}/referee/${matchId}/roll`, request) as unknown
}

export async function createTournamentMatchAction(tournamentId: string, matchId: string, request: TournamentMatchActionRequest): Promise<TournamentMatchAction> {
  const response = await http.post(`/tournament/${tournamentId}/referee/${matchId}/action`, request) as unknown as { action?: TournamentMatchAction }
  return response.action as TournamentMatchAction
}

export async function updateTournamentMatchAction(tournamentId: string, matchId: string, actionId: number, request: TournamentMatchActionRequest): Promise<TournamentMatchAction> {
  const response = await http.put(`/tournament/${tournamentId}/referee/${matchId}/action/${actionId}`, request) as unknown as { action?: TournamentMatchAction }
  return response.action as TournamentMatchAction
}

export async function recordTournamentTimeout(tournamentId: string, matchId: string, team: 1 | 2): Promise<void> {
  await http.post(`/tournament/${tournamentId}/referee/${matchId}/timeout`, { team })
}

export async function updateTournamentGameScore(tournamentId: string, matchId: string, gameId: number, request: UpdateTournamentGameScoreRequest): Promise<void> {
  await http.put(`/tournament/${tournamentId}/referee/${matchId}/game/${gameId}`, request)
}

export async function getTournamentTeams(tournamentId: string): Promise<TournamentTeam[]> {
  return await http.get(`/tournament/${tournamentId}/teams`) as unknown as TournamentTeam[]
}

export async function updateTournamentTeamStatus(tournamentId: string, teamId: number, request: UpdateTournamentTeamStatusRequest): Promise<TournamentTeam> {
  return await http.put(`/tournament/${tournamentId}/team/${teamId}`, request) as unknown as TournamentTeam
}

export async function approveAllTournamentTeams(tournamentId: string): Promise<void> {
  await http.post(`/tournament/${tournamentId}/team/approve-all`)
}

export async function importTournamentHistoricalTeams(tournamentId: string, request: TournamentHistoricalImportRequest): Promise<TournamentHistoricalImportResult> {
  return await http.post(`/tournament/${tournamentId}/import/teams`, request) as unknown as TournamentHistoricalImportResult
}

export async function updateTournamentPlayer(tournamentId: string, playerId: number, request: UpdateTournamentPlayerRequest): Promise<void> {
  await http.put(`/tournament/${tournamentId}/player/${playerId}`, request)
}

export async function createTournamentTeam(tournamentId: string, request: CreateTournamentTeamRequest): Promise<TournamentTeam> {
  return await http.post(`/tournament/${tournamentId}/team`, request) as unknown as TournamentTeam
}

export async function joinTournamentTeam(tournamentId: string, request: JoinTournamentTeamRequest): Promise<void> {
  await http.post(`/tournament/${tournamentId}/team/join`, request)
}

export async function leaveTournamentTeam(tournamentId: string): Promise<void> {
  await http.delete(`/tournament/${tournamentId}/team/leave`)
}

export async function submitTournamentTeam(tournamentId: string, teamId: number): Promise<TournamentTeam> {
  return await http.post(`/tournament/${tournamentId}/team/${teamId}/submit`) as unknown as TournamentTeam
}

export async function updateTournamentTeamInfo(tournamentId: string, teamId: number, request: UpdateTournamentTeamInfoRequest): Promise<TournamentTeam> {
  return await http.put(`/tournament/${tournamentId}/team/${teamId}/info`, request) as unknown as TournamentTeam
}

export async function transferTournamentCaptain(tournamentId: string, teamId: number, request: TransferTournamentCaptainRequest): Promise<TournamentTeam> {
  return await http.post(`/tournament/${tournamentId}/team/${teamId}/transfer-captain`, request) as unknown as TournamentTeam
}

export async function resetTournamentInviteCode(tournamentId: string, teamId: number): Promise<{ invite_code: string }> {
  return await http.post(`/tournament/${tournamentId}/team/${teamId}/reset-invite`) as unknown as { invite_code: string }
}

export async function kickTournamentPlayer(tournamentId: string, teamId: number, playerId: number): Promise<void> {
  await http.delete(`/tournament/${tournamentId}/team/${teamId}/player/${playerId}`)
}

export async function getTournamentQualMappool(tournamentId: string): Promise<TournamentQualMap[]> {
  return await http.get(`/tournament/${tournamentId}/qualifier/mappool`) as unknown as TournamentQualMap[]
}

export async function createTournamentQualMap(tournamentId: string, request: CreateTournamentQualMapRequest): Promise<TournamentQualMap> {
  return await http.post(`/tournament/${tournamentId}/qualifier/mappool`, request) as unknown as TournamentQualMap
}

export async function updateTournamentQualMap(tournamentId: string, mapId: number, request: UpdateTournamentQualMapRequest): Promise<TournamentQualMap> {
  return await http.put(`/tournament/${tournamentId}/qualifier/mappool/${mapId}`, request) as unknown as TournamentQualMap
}

export async function deleteTournamentQualMap(tournamentId: string, mapId: number): Promise<void> {
  await http.delete(`/tournament/${tournamentId}/qualifier/mappool/${mapId}`)
}

export async function getTournamentQualScores(tournamentId: string): Promise<TournamentQualScore[]> {
  return await http.get(`/tournament/${tournamentId}/qualifier/scores`) as unknown as TournamentQualScore[]
}

export async function getTournamentQualImports(tournamentId: string, params?: { page?: number; pageSize?: number }): Promise<TournamentQualImportList> {
  return await http.get(`/tournament/${tournamentId}/qualifier/imports`, { params }) as unknown as TournamentQualImportList
}

export async function fetchTournamentQualScores(tournamentId: string, request: FetchTournamentQualScoresRequest): Promise<void> {
  await http.post(`/tournament/${tournamentId}/qualifier/fetch-scores`, request)
}

export async function calculateTournamentQualRanking(tournamentId: string): Promise<void> {
  await http.post(`/tournament/${tournamentId}/qualifier/calculate-ranking`)
}

export async function lockTournamentQualRanking(tournamentId: string): Promise<Tournament> {
  const response = await http.post(`/tournament/${tournamentId}/qualifier/lock`) as unknown as { tournament?: Tournament }
  return response.tournament as Tournament
}

export async function updateTournamentQualScore(tournamentId: string, scoreId: number, request: UpdateTournamentQualScoreRequest): Promise<void> {
  await http.put(`/tournament/${tournamentId}/qualifier/scores/${scoreId}`, request)
}

export async function getTournamentQualRanking(tournamentId: string): Promise<TournamentTeam[]> {
  return await http.get(`/tournament/${tournamentId}/qualifier/ranking`) as unknown as TournamentTeam[]
}
