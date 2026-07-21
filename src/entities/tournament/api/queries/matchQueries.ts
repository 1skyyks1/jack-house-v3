import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  calculateTournamentMappoolStats,
  createTournamentMatch,
  createTournamentMatchAction,
  createTournamentRound,
  createTournamentRoundMap,
  deleteTournamentRound,
  deleteTournamentRoundMap,
  fetchTournamentMatchScores,
  generateTournamentBracket,
  getTournamentBracket,
  getTournamentMappoolStats,
  getTournamentMappoolStatsManage,
  getTournamentMatch,
  getTournamentPerformance,
  getTournamentRefereeData,
  getTournamentRoundMappool,
  getTournamentRounds,
  recordTournamentRoll,
  recordTournamentTimeout,
  updateTournamentGameScore,
  updateTournamentMatch,
  updateTournamentMatchAction,
  updateTournamentRound,
} from "../tournamentApi"
import type {
  CreateTournamentMatchRequest,
  CreateTournamentRoundMapRequest,
  CreateTournamentRoundRequest,
  RecordTournamentRollRequest,
  TournamentMatchActionRequest,
  UpdateTournamentGameScoreRequest,
  UpdateTournamentMatchRequest,
  UpdateTournamentRoundRequest,
} from "../../model/types"
import { tournamentQueryKeys } from "./queryKeys"

export function useTournamentBracketQuery(tournamentId: string | undefined) {
  return useQuery({ enabled: Boolean(tournamentId), queryFn: () => getTournamentBracket(tournamentId as string), queryKey: tournamentQueryKeys.bracket(tournamentId ?? "") })
}

export function useTournamentPerformanceQuery(tournamentId: string | undefined) {
  return useQuery({ enabled: Boolean(tournamentId), queryFn: () => getTournamentPerformance(tournamentId as string), queryKey: tournamentQueryKeys.performance(tournamentId ?? "") })
}

export function useTournamentMappoolStatsQuery(tournamentId: string | undefined) {
  return useQuery({ enabled: Boolean(tournamentId), queryFn: () => getTournamentMappoolStats(tournamentId as string), queryKey: tournamentQueryKeys.mappoolStats(tournamentId ?? "") })
}

export function useTournamentMappoolStatsManageQuery(tournamentId: string | undefined) {
  return useQuery({ enabled: Boolean(tournamentId), queryFn: () => getTournamentMappoolStatsManage(tournamentId as string), queryKey: tournamentQueryKeys.mappoolStatsManage(tournamentId ?? "") })
}

export function useCalculateTournamentMappoolStatsMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (stage: string) => calculateTournamentMappoolStats(tournamentId, stage),
    onSuccess: async () => Promise.all([
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.mappoolStats(tournamentId) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.mappoolStatsManage(tournamentId) }),
    ]),
  })
}

export function useTournamentMatchQuery(tournamentId: string | undefined, matchId: string | undefined) {
  return useQuery({ enabled: Boolean(tournamentId && matchId), queryFn: () => getTournamentMatch(tournamentId as string, matchId as string), queryKey: tournamentQueryKeys.match(tournamentId ?? "", matchId ?? "") })
}

export function useGenerateTournamentBracketMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => generateTournamentBracket(tournamentId),
    onSuccess: async () => Promise.all([
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.bracket(tournamentId) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.rounds(tournamentId) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.mappoolStats(tournamentId) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.mappoolStatsManage(tournamentId) }),
    ]),
  })
}

export function useTournamentRoundsQuery(tournamentId: string | undefined) {
  return useQuery({ enabled: Boolean(tournamentId), queryFn: () => getTournamentRounds(tournamentId as string), queryKey: tournamentQueryKeys.rounds(tournamentId ?? "") })
}

export function useCreateTournamentRoundMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateTournamentRoundRequest) => createTournamentRound(tournamentId, request),
    onSuccess: async () => Promise.all([
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.rounds(tournamentId) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.mappoolStatsManage(tournamentId) }),
    ]),
  })
}

export function useUpdateTournamentRoundMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ request, roundId }: { request: UpdateTournamentRoundRequest; roundId: number }) => updateTournamentRound(tournamentId, roundId, request),
    onSuccess: async () => Promise.all([
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.rounds(tournamentId) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.bracket(tournamentId) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.mappoolStatsManage(tournamentId) }),
    ]),
  })
}

export function useDeleteTournamentRoundMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (roundId: number) => deleteTournamentRound(tournamentId, roundId),
    onSuccess: async () => Promise.all([
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.rounds(tournamentId) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.bracket(tournamentId) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.mappoolStatsManage(tournamentId) }),
    ]),
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
    onSuccess: async (_data, variables) => Promise.all([
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.roundMappool(tournamentId, variables.roundId) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.rounds(tournamentId) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.bracket(tournamentId) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.mappoolStatsManage(tournamentId) }),
    ]),
  })
}

export function useDeleteTournamentRoundMapMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ mapId }: { mapId: number; roundId?: number }) => deleteTournamentRoundMap(tournamentId, mapId),
    onSuccess: async (_data, variables) => Promise.all([
      variables.roundId ? queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.roundMappool(tournamentId, variables.roundId) }) : Promise.resolve(),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.rounds(tournamentId) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.bracket(tournamentId) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.mappoolStatsManage(tournamentId) }),
    ]),
  })
}

export function useCreateTournamentMatchMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateTournamentMatchRequest) => createTournamentMatch(tournamentId, request),
    onSuccess: async () => Promise.all([
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.bracket(tournamentId) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.mappoolStatsManage(tournamentId) }),
    ]),
  })
}

export function useUpdateTournamentMatchMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ matchId, request }: { matchId: number; request: UpdateTournamentMatchRequest }) => updateTournamentMatch(tournamentId, matchId, request),
    onSuccess: async (_data, variables) => Promise.all([
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.bracket(tournamentId) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.match(tournamentId, String(variables.matchId)) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.referee(tournamentId, String(variables.matchId)) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.mappoolStatsManage(tournamentId) }),
    ]),
  })
}

export function useFetchTournamentMatchScoresMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (matchId: number) => fetchTournamentMatchScores(tournamentId, matchId),
    onSuccess: async (_data, matchId) => Promise.all([
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.bracket(tournamentId) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.match(tournamentId, String(matchId)) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.referee(tournamentId, String(matchId)) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.performance(tournamentId) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.mappoolStatsManage(tournamentId) }),
    ]),
  })
}

export function useTournamentRefereeDataQuery(tournamentId: string | undefined, matchId: string | undefined) {
  return useQuery({ enabled: Boolean(tournamentId && matchId), queryFn: () => getTournamentRefereeData(tournamentId as string, matchId as string), queryKey: tournamentQueryKeys.referee(tournamentId ?? "", matchId ?? "") })
}

export function useRecordTournamentRollMutation(tournamentId: string, matchId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: RecordTournamentRollRequest) => recordTournamentRoll(tournamentId, matchId, request),
    onSuccess: async () => Promise.all([
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.referee(tournamentId, matchId) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.match(tournamentId, matchId) }),
    ]),
  })
}

export function useCreateTournamentMatchActionMutation(tournamentId: string, matchId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: TournamentMatchActionRequest) => createTournamentMatchAction(tournamentId, matchId, request),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.referee(tournamentId, matchId) }),
  })
}

export function useUpdateTournamentMatchActionMutation(tournamentId: string, matchId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ actionId, request }: { actionId: number; request: TournamentMatchActionRequest }) => updateTournamentMatchAction(tournamentId, matchId, actionId, request),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.referee(tournamentId, matchId) }),
  })
}

export function useRecordTournamentTimeoutMutation(tournamentId: string, matchId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (team: 1 | 2) => recordTournamentTimeout(tournamentId, matchId, team),
    onSuccess: async () => Promise.all([
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.referee(tournamentId, matchId) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.match(tournamentId, matchId) }),
    ]),
  })
}

export function useUpdateTournamentGameScoreMutation(tournamentId: string, matchId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ gameId, request }: { gameId: number; request: UpdateTournamentGameScoreRequest }) => updateTournamentGameScore(tournamentId, matchId, gameId, request),
    onSuccess: async () => Promise.all([
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.referee(tournamentId, matchId) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.match(tournamentId, matchId) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.bracket(tournamentId) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.performance(tournamentId) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.mappoolStatsManage(tournamentId) }),
    ]),
  })
}
