import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"
import {
  calculateTournamentQualRanking,
  createTournamentQualMap,
  deleteTournamentQualMap,
  fetchTournamentQualScores,
  getTournamentQualImports,
  getTournamentQualMappool,
  getTournamentQualRanking,
  getTournamentQualScores,
  lockTournamentQualRanking,
  unlockTournamentQualRanking,
  updateTournamentQualMap,
  updateTournamentQualScore,
} from "../tournamentApi"
import type {
  CreateTournamentQualMapRequest,
  FetchTournamentQualScoresRequest,
  UpdateTournamentQualMapRequest,
  UpdateTournamentQualScoreRequest,
} from "../../model/types"
import { tournamentQueryKeys } from "./queryKeys"

export function useTournamentQualMappoolQuery(tournamentId: string | undefined) {
  return useQuery({ enabled: Boolean(tournamentId), queryFn: () => getTournamentQualMappool(tournamentId as string), queryKey: tournamentQueryKeys.qualMappool(tournamentId ?? "") })
}

export function useCreateTournamentQualMapMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: (request: CreateTournamentQualMapRequest) => createTournamentQualMap(tournamentId, request), onSuccess: async () => queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.qualMappool(tournamentId) }) })
}

export function useUpdateTournamentQualMapMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ mapId, request }: { mapId: number; request: UpdateTournamentQualMapRequest }) => updateTournamentQualMap(tournamentId, mapId, request),
    onSuccess: async () => Promise.all([
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.qualMappool(tournamentId) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.qualScores(tournamentId) }),
    ]),
  })
}

export function useDeleteTournamentQualMapMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (mapId: number) => deleteTournamentQualMap(tournamentId, mapId),
    onSuccess: async () => Promise.all([
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.qualMappool(tournamentId) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.qualScores(tournamentId) }),
    ]),
  })
}

export function useTournamentQualScoresQuery(tournamentId: string | undefined) {
  return useQuery({ enabled: Boolean(tournamentId), queryFn: () => getTournamentQualScores(tournamentId as string), queryKey: tournamentQueryKeys.qualScores(tournamentId ?? "") })
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
    onSuccess: async () => Promise.all([
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.qualImportsRoot(tournamentId) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.qualScores(tournamentId) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.teams(tournamentId) }),
    ]),
  })
}

export function useCalculateTournamentQualRankingMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => calculateTournamentQualRanking(tournamentId),
    onSuccess: async () => Promise.all([
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.qualRanking(tournamentId) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.teams(tournamentId) }),
    ]),
  })
}

const invalidateLockedRanking = (queryClient: QueryClient, tournamentId: string) => Promise.all([
  queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.detail(tournamentId) }),
  queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.qualRanking(tournamentId) }),
  queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.teams(tournamentId) }),
  queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.bracket(tournamentId) }),
])

export function useLockTournamentQualRankingMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: () => lockTournamentQualRanking(tournamentId), onSuccess: async () => invalidateLockedRanking(queryClient, tournamentId) })
}

export function useUnlockTournamentQualRankingMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: () => unlockTournamentQualRanking(tournamentId), onSuccess: async () => invalidateLockedRanking(queryClient, tournamentId) })
}

export function useUpdateTournamentQualScoreMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ request, scoreId }: { request: UpdateTournamentQualScoreRequest; scoreId: number }) => updateTournamentQualScore(tournamentId, scoreId, request),
    onSuccess: async () => Promise.all([
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.qualScores(tournamentId) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.qualRanking(tournamentId) }),
    ]),
  })
}

export function useTournamentQualRankingQuery(tournamentId: string | undefined) {
  return useQuery({ enabled: Boolean(tournamentId), queryFn: () => getTournamentQualRanking(tournamentId as string), queryKey: tournamentQueryKeys.qualRanking(tournamentId ?? "") })
}
