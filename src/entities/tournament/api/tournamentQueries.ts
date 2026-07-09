import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  approveAllTournamentTeams,
  calculateTournamentQualRanking,
  createTournamentMatch,
  createTournamentMatchAction,
  createTournamentQualMap,
  createTournament,
  createTournamentRound,
  createTournamentRoundMap,
  createTournamentSection,
  createTournamentStaff,
  createTournamentTeam,
  deleteTournamentRound,
  deleteTournamentRoundMap,
  deleteTournamentQualMap,
  deleteTournamentStaff,
  deleteTournamentSection,
  fetchTournamentMatchScores,
  fetchTournamentQualScores,
  generateTournamentBracket,
  getTournamentAuditLogs,
  getTournamentBracket,
  getTournamentById,
  getTournamentList,
  getTournamentManageSections,
  getTournamentMatch,
  getTournamentPerformance,
  getTournamentQualImports,
  getTournamentQualMappool,
  getTournamentQualRanking,
  getTournamentQualScores,
  getTournamentRefereeData,
  getTournamentRoundMappool,
  getTournamentRounds,
  getTournamentSections,
  getTournamentStaff,
  getTournamentTeams,
  importTournamentGoogleFormTeams,
  importTournamentHistoricalTeams,
  joinTournamentTeam,
  kickTournamentPlayer,
  leaveTournamentTeam,
  lockTournamentQualRanking,
  previewTournamentMarkdown,
  recordTournamentRoll,
  recordTournamentTimeout,
  resetTournamentInviteCode,
  submitTournamentTeam,
  transferTournamentCaptain,
  unlockTournamentQualRanking,
  updateTournamentGameScore,
  updateTournamentMatch,
  updateTournamentMatchAction,
  updateTournamentQualMap,
  updateTournamentQualScore,
  updateTournamentRound,
  updateTournamentSection,
  updateTournamentPlayer,
  updateTournamentTeamInfo,
  updateTournamentTeamStatus,
  updateTournament,
  uploadTournamentDefaultTeamAvatar,
  uploadTournamentTeamAvatar,
} from "./tournamentApi"
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
  RecordTournamentRollRequest,
  TournamentAuditLogQuery,
  TournamentGoogleFormImportRequest,
  TournamentHistoricalImportRequest,
  TournamentMarkdownPreviewRequest,
  TournamentMatchActionRequest,
  TransferTournamentCaptainRequest,
  TournamentSectionRequest,
  UpdateTournamentGameScoreRequest,
  UpdateTournamentMatchRequest,
  UpdateTournamentQualMapRequest,
  UpdateTournamentQualScoreRequest,
  UpdateTournamentPlayerRequest,
  UpdateTournamentTeamInfoRequest,
  UpdateTournamentRoundRequest,
  UpdateTournamentTeamStatusRequest,
  UpdateTournamentRequest,
} from "../model/types"

export const tournamentQueryKeys = {
  auditLogs: (tournamentId: string, params: TournamentAuditLogQuery) => ["tournament", "audit-logs", tournamentId, params] as const,
  bracket: (tournamentId: string) => ["tournament", "bracket", tournamentId] as const,
  detail: (tournamentId: string) => ["tournament", "detail", tournamentId] as const,
  list: ["tournament", "list"] as const,
  match: (tournamentId: string, matchId: string) => ["tournament", "match", tournamentId, matchId] as const,
  manageSections: (tournamentId: string) => ["tournament", "sections", "manage", tournamentId] as const,
  qualImports: (tournamentId: string, page: number, pageSize: number) => [...tournamentQueryKeys.qualImportsRoot(tournamentId), page, pageSize] as const,
  qualImportsRoot: (tournamentId: string) => ["tournament", "qualifier", "imports", tournamentId] as const,
  qualMappool: (tournamentId: string) => ["tournament", "qualifier", "mappool", tournamentId] as const,
  performance: (tournamentId: string) => ["tournament", "performance", tournamentId] as const,
  qualRanking: (tournamentId: string) => ["tournament", "qualifier", "ranking", tournamentId] as const,
  qualScores: (tournamentId: string) => ["tournament", "qualifier", "scores", tournamentId] as const,
  referee: (tournamentId: string, matchId: string) => ["tournament", "referee", tournamentId, matchId] as const,
  roundMappool: (tournamentId: string, roundId: number | string) => ["tournament", "round", "mappool", tournamentId, roundId] as const,
  rounds: (tournamentId: string) => ["tournament", "rounds", tournamentId] as const,
  root: ["tournament"] as const,
  sections: (tournamentId: string) => ["tournament", "sections", tournamentId] as const,
  staff: (tournamentId: string) => ["tournament", "staff", tournamentId] as const,
  teams: (tournamentId: string) => ["tournament", "teams", tournamentId] as const,
}

export function useTournamentListQuery() {
  return useQuery({
    queryFn: getTournamentList,
    queryKey: tournamentQueryKeys.list,
  })
}

export function useCreateTournamentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateTournamentRequest) => createTournament(request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.list })
    },
  })
}

export function useTournamentDetailQuery(tournamentId: string | undefined) {
  return useQuery({
    enabled: Boolean(tournamentId),
    queryFn: () => getTournamentById(tournamentId as string),
    queryKey: tournamentQueryKeys.detail(tournamentId ?? ""),
  })
}

export function useUpdateTournamentMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: UpdateTournamentRequest) => updateTournament(tournamentId, request),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.detail(tournamentId) }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.list }),
      ])
    },
  })
}

export function useUploadTournamentDefaultTeamAvatarMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => uploadTournamentDefaultTeamAvatar(tournamentId, file),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.detail(tournamentId) }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.list }),
      ])
    },
  })
}

export function useTournamentSectionsQuery(tournamentId: string | undefined) {
  return useQuery({
    enabled: Boolean(tournamentId),
    queryFn: () => getTournamentSections(tournamentId as string),
    queryKey: tournamentQueryKeys.sections(tournamentId ?? ""),
  })
}

export function useTournamentManageSectionsQuery(tournamentId: string | undefined) {
  return useQuery({
    enabled: Boolean(tournamentId),
    queryFn: () => getTournamentManageSections(tournamentId as string),
    queryKey: tournamentQueryKeys.manageSections(tournamentId ?? ""),
  })
}

export function useTournamentAuditLogsQuery(tournamentId: string | undefined, params: TournamentAuditLogQuery) {
  return useQuery({
    enabled: Boolean(tournamentId),
    queryFn: () => getTournamentAuditLogs(tournamentId as string, params),
    queryKey: tournamentQueryKeys.auditLogs(tournamentId ?? "", params),
  })
}

export function useTournamentStaffQuery(tournamentId: string | undefined) {
  return useQuery({
    enabled: Boolean(tournamentId),
    queryFn: () => getTournamentStaff(tournamentId as string),
    queryKey: tournamentQueryKeys.staff(tournamentId ?? ""),
  })
}

export function useCreateTournamentStaffMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateTournamentStaffRequest) => createTournamentStaff(tournamentId, request),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.staff(tournamentId) }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.detail(tournamentId) }),
      ])
    },
  })
}

export function useDeleteTournamentStaffMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (staffId: number) => deleteTournamentStaff(tournamentId, staffId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.staff(tournamentId) }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.detail(tournamentId) }),
      ])
    },
  })
}

export function useCreateTournamentSectionMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: TournamentSectionRequest) => createTournamentSection(tournamentId, request),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.manageSections(tournamentId) }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.sections(tournamentId) }),
      ])
    },
  })
}

export function useUpdateTournamentSectionMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ request, sectionId }: { request: TournamentSectionRequest; sectionId: number }) => updateTournamentSection(tournamentId, sectionId, request),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.manageSections(tournamentId) }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.sections(tournamentId) }),
      ])
    },
  })
}

export function useDeleteTournamentSectionMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sectionId: number) => deleteTournamentSection(tournamentId, sectionId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.manageSections(tournamentId) }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.sections(tournamentId) }),
      ])
    },
  })
}

export function usePreviewTournamentMarkdownMutation(tournamentId: string) {
  return useMutation({
    mutationFn: (request: TournamentMarkdownPreviewRequest) => previewTournamentMarkdown(tournamentId, request),
  })
}

export function useTournamentBracketQuery(tournamentId: string | undefined) {
  return useQuery({
    enabled: Boolean(tournamentId),
    queryFn: () => getTournamentBracket(tournamentId as string),
    queryKey: tournamentQueryKeys.bracket(tournamentId ?? ""),
  })
}

export function useTournamentPerformanceQuery(tournamentId: string | undefined) {
  return useQuery({
    enabled: Boolean(tournamentId),
    queryFn: () => getTournamentPerformance(tournamentId as string),
    queryKey: tournamentQueryKeys.performance(tournamentId ?? ""),
  })
}

export function useTournamentMatchQuery(tournamentId: string | undefined, matchId: string | undefined) {
  return useQuery({
    enabled: Boolean(tournamentId && matchId),
    queryFn: () => getTournamentMatch(tournamentId as string, matchId as string),
    queryKey: tournamentQueryKeys.match(tournamentId ?? "", matchId ?? ""),
  })
}

export function useGenerateTournamentBracketMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => generateTournamentBracket(tournamentId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.bracket(tournamentId) }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.rounds(tournamentId) }),
      ])
    },
  })
}

export function useTournamentRoundsQuery(tournamentId: string | undefined) {
  return useQuery({
    enabled: Boolean(tournamentId),
    queryFn: () => getTournamentRounds(tournamentId as string),
    queryKey: tournamentQueryKeys.rounds(tournamentId ?? ""),
  })
}

export function useCreateTournamentRoundMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateTournamentRoundRequest) => createTournamentRound(tournamentId, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.rounds(tournamentId) })
    },
  })
}

export function useUpdateTournamentRoundMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ request, roundId }: { request: UpdateTournamentRoundRequest; roundId: number }) => updateTournamentRound(tournamentId, roundId, request),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.rounds(tournamentId) }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.bracket(tournamentId) }),
      ])
    },
  })
}

export function useDeleteTournamentRoundMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (roundId: number) => deleteTournamentRound(tournamentId, roundId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.rounds(tournamentId) }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.bracket(tournamentId) }),
      ])
    },
  })
}

export function useTournamentRoundMappoolQuery(tournamentId: string | undefined, roundId: number | undefined) {
  return useQuery({
    enabled: Boolean(tournamentId && roundId),
    queryFn: () => getTournamentRoundMappool(tournamentId as string, roundId as number),
    queryKey: tournamentQueryKeys.roundMappool(tournamentId ?? "", roundId ?? ""),
  })
}

export function useCreateTournamentRoundMapMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ request, roundId }: { request: CreateTournamentRoundMapRequest; roundId: number }) => createTournamentRoundMap(tournamentId, roundId, request),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.roundMappool(tournamentId, variables.roundId) }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.rounds(tournamentId) }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.bracket(tournamentId) }),
      ])
    },
  })
}

export function useDeleteTournamentRoundMapMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ mapId }: { mapId: number; roundId?: number }) => deleteTournamentRoundMap(tournamentId, mapId),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        variables.roundId ? queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.roundMappool(tournamentId, variables.roundId) }) : Promise.resolve(),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.rounds(tournamentId) }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.bracket(tournamentId) }),
      ])
    },
  })
}

export function useCreateTournamentMatchMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateTournamentMatchRequest) => createTournamentMatch(tournamentId, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.bracket(tournamentId) })
    },
  })
}

export function useUpdateTournamentMatchMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ matchId, request }: { matchId: number; request: UpdateTournamentMatchRequest }) => updateTournamentMatch(tournamentId, matchId, request),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.bracket(tournamentId) }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.match(tournamentId, String(variables.matchId)) }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.referee(tournamentId, String(variables.matchId)) }),
      ])
    },
  })
}

export function useFetchTournamentMatchScoresMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (matchId: number) => fetchTournamentMatchScores(tournamentId, matchId),
    onSuccess: async (_data, matchId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.bracket(tournamentId) }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.match(tournamentId, String(matchId)) }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.referee(tournamentId, String(matchId)) }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.performance(tournamentId) }),
      ])
    },
  })
}

export function useTournamentRefereeDataQuery(tournamentId: string | undefined, matchId: string | undefined) {
  return useQuery({
    enabled: Boolean(tournamentId && matchId),
    queryFn: () => getTournamentRefereeData(tournamentId as string, matchId as string),
    queryKey: tournamentQueryKeys.referee(tournamentId ?? "", matchId ?? ""),
  })
}

export function useRecordTournamentRollMutation(tournamentId: string, matchId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: RecordTournamentRollRequest) => recordTournamentRoll(tournamentId, matchId, request),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.referee(tournamentId, matchId) }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.match(tournamentId, matchId) }),
      ])
    },
  })
}

export function useCreateTournamentMatchActionMutation(tournamentId: string, matchId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: TournamentMatchActionRequest) => createTournamentMatchAction(tournamentId, matchId, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.referee(tournamentId, matchId) })
    },
  })
}

export function useUpdateTournamentMatchActionMutation(tournamentId: string, matchId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ actionId, request }: { actionId: number; request: TournamentMatchActionRequest }) => updateTournamentMatchAction(tournamentId, matchId, actionId, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.referee(tournamentId, matchId) })
    },
  })
}

export function useRecordTournamentTimeoutMutation(tournamentId: string, matchId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (team: 1 | 2) => recordTournamentTimeout(tournamentId, matchId, team),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.referee(tournamentId, matchId) }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.match(tournamentId, matchId) }),
      ])
    },
  })
}

export function useUpdateTournamentGameScoreMutation(tournamentId: string, matchId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ gameId, request }: { gameId: number; request: UpdateTournamentGameScoreRequest }) => updateTournamentGameScore(tournamentId, matchId, gameId, request),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.referee(tournamentId, matchId) }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.match(tournamentId, matchId) }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.bracket(tournamentId) }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.performance(tournamentId) }),
      ])
    },
  })
}

export function useTournamentTeamsQuery(tournamentId: string | undefined) {
  return useQuery({
    enabled: Boolean(tournamentId),
    queryFn: () => getTournamentTeams(tournamentId as string),
    queryKey: tournamentQueryKeys.teams(tournamentId ?? ""),
  })
}

export function useUpdateTournamentTeamStatusMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ request, teamId }: { request: UpdateTournamentTeamStatusRequest; teamId: number }) => updateTournamentTeamStatus(tournamentId, teamId, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.teams(tournamentId) })
    },
  })
}

export function useApproveAllTournamentTeamsMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => approveAllTournamentTeams(tournamentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.teams(tournamentId) })
    },
  })
}

export function useImportTournamentHistoricalTeamsMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: TournamentHistoricalImportRequest) => importTournamentHistoricalTeams(tournamentId, request),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tournament", "audit-logs", tournamentId] }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.teams(tournamentId) }),
      ])
    },
  })
}

export function useUpdateTournamentPlayerMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ playerId, request }: { playerId: number; request: UpdateTournamentPlayerRequest }) => updateTournamentPlayer(tournamentId, playerId, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.teams(tournamentId) })
    },
  })
}

export function useImportTournamentGoogleFormTeamsMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: TournamentGoogleFormImportRequest) => importTournamentGoogleFormTeams(tournamentId, request),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tournament", "audit-logs", tournamentId] }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.teams(tournamentId) }),
      ])
    },
  })
}

export function useTournamentQualMappoolQuery(tournamentId: string | undefined) {
  return useQuery({
    enabled: Boolean(tournamentId),
    queryFn: () => getTournamentQualMappool(tournamentId as string),
    queryKey: tournamentQueryKeys.qualMappool(tournamentId ?? ""),
  })
}

export function useCreateTournamentQualMapMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateTournamentQualMapRequest) => createTournamentQualMap(tournamentId, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.qualMappool(tournamentId) })
    },
  })
}

export function useUpdateTournamentQualMapMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ mapId, request }: { mapId: number; request: UpdateTournamentQualMapRequest }) => updateTournamentQualMap(tournamentId, mapId, request),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.qualMappool(tournamentId) }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.qualScores(tournamentId) }),
      ])
    },
  })
}

export function useDeleteTournamentQualMapMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (mapId: number) => deleteTournamentQualMap(tournamentId, mapId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.qualMappool(tournamentId) }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.qualScores(tournamentId) }),
      ])
    },
  })
}

export function useTournamentQualScoresQuery(tournamentId: string | undefined) {
  return useQuery({
    enabled: Boolean(tournamentId),
    queryFn: () => getTournamentQualScores(tournamentId as string),
    queryKey: tournamentQueryKeys.qualScores(tournamentId ?? ""),
  })
}

export function useTournamentQualImportsQuery(tournamentId: string | undefined, page = 1, pageSize = 20) {
  return useQuery({
    enabled: Boolean(tournamentId),
    queryFn: () => getTournamentQualImports(tournamentId as string, { page, pageSize }),
    queryKey: tournamentQueryKeys.qualImports(tournamentId ?? "", page, pageSize),
  })
}

export function useFetchTournamentQualScoresMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: FetchTournamentQualScoresRequest) => fetchTournamentQualScores(tournamentId, request),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.qualImportsRoot(tournamentId) }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.qualScores(tournamentId) }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.teams(tournamentId) }),
      ])
    },
  })
}

export function useCalculateTournamentQualRankingMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => calculateTournamentQualRanking(tournamentId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.qualRanking(tournamentId) }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.teams(tournamentId) }),
      ])
    },
  })
}

export function useLockTournamentQualRankingMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => lockTournamentQualRanking(tournamentId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.detail(tournamentId) }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.qualRanking(tournamentId) }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.teams(tournamentId) }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.bracket(tournamentId) }),
      ])
    },
  })
}

export function useUnlockTournamentQualRankingMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => unlockTournamentQualRanking(tournamentId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.detail(tournamentId) }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.qualRanking(tournamentId) }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.teams(tournamentId) }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.bracket(tournamentId) }),
      ])
    },
  })
}

export function useUpdateTournamentQualScoreMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ request, scoreId }: { request: UpdateTournamentQualScoreRequest; scoreId: number }) => updateTournamentQualScore(tournamentId, scoreId, request),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.qualScores(tournamentId) }),
        queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.qualRanking(tournamentId) }),
      ])
    },
  })
}

export function useTournamentQualRankingQuery(tournamentId: string | undefined) {
  return useQuery({
    enabled: Boolean(tournamentId),
    queryFn: () => getTournamentQualRanking(tournamentId as string),
    queryKey: tournamentQueryKeys.qualRanking(tournamentId ?? ""),
  })
}

export function useCreateTournamentTeamMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateTournamentTeamRequest) => createTournamentTeam(tournamentId, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.teams(tournamentId) })
    },
  })
}

export function useJoinTournamentTeamMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: JoinTournamentTeamRequest) => joinTournamentTeam(tournamentId, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.teams(tournamentId) })
    },
  })
}

export function useLeaveTournamentTeamMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => leaveTournamentTeam(tournamentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.teams(tournamentId) })
    },
  })
}

export function useSubmitTournamentTeamMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (teamId: number) => submitTournamentTeam(tournamentId, teamId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.teams(tournamentId) })
    },
  })
}

export function useUpdateTournamentTeamInfoMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ request, teamId }: { request: UpdateTournamentTeamInfoRequest; teamId: number }) => updateTournamentTeamInfo(tournamentId, teamId, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.teams(tournamentId) })
    },
  })
}

export function useUploadTournamentTeamAvatarMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ file, teamId }: { file: File; teamId: number }) => uploadTournamentTeamAvatar(tournamentId, teamId, file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.teams(tournamentId) })
    },
  })
}

export function useTransferTournamentCaptainMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ request, teamId }: { request: TransferTournamentCaptainRequest; teamId: number }) => transferTournamentCaptain(tournamentId, teamId, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.teams(tournamentId) })
    },
  })
}

export function useResetTournamentInviteCodeMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (teamId: number) => resetTournamentInviteCode(tournamentId, teamId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.teams(tournamentId) })
    },
  })
}

export function useKickTournamentPlayerMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ playerId, teamId }: { playerId: number; teamId: number }) => kickTournamentPlayer(tournamentId, teamId, playerId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.teams(tournamentId) })
    },
  })
}
