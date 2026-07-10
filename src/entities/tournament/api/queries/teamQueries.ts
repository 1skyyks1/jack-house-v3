import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"
import {
  approveAllTournamentTeams,
  createTournamentTeam,
  getTournamentTeams,
  importTournamentGoogleFormTeams,
  importTournamentHistoricalTeams,
  joinTournamentTeam,
  kickTournamentPlayer,
  leaveTournamentTeam,
  resetTournamentInviteCode,
  submitTournamentTeam,
  transferTournamentCaptain,
  updateTournamentPlayer,
  updateTournamentTeamInfo,
  updateTournamentTeamStatus,
  uploadTournamentTeamAvatar,
} from "../tournamentApi"
import type {
  CreateTournamentTeamRequest,
  JoinTournamentTeamRequest,
  TournamentGoogleFormImportRequest,
  TournamentHistoricalImportRequest,
  TransferTournamentCaptainRequest,
  UpdateTournamentPlayerRequest,
  UpdateTournamentTeamInfoRequest,
  UpdateTournamentTeamStatusRequest,
} from "../../model/types"
import { tournamentQueryKeys } from "./queryKeys"

const invalidateTeams = (queryClient: QueryClient, tournamentId: string) => queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.teams(tournamentId) })

export function useTournamentTeamsQuery(tournamentId: string | undefined) {
  return useQuery({ enabled: Boolean(tournamentId), queryFn: () => getTournamentTeams(tournamentId as string), queryKey: tournamentQueryKeys.teams(tournamentId ?? "") })
}

export function useUpdateTournamentTeamStatusMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: ({ request, teamId }: { request: UpdateTournamentTeamStatusRequest; teamId: number }) => updateTournamentTeamStatus(tournamentId, teamId, request), onSuccess: async () => invalidateTeams(queryClient, tournamentId) })
}

export function useApproveAllTournamentTeamsMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: () => approveAllTournamentTeams(tournamentId), onSuccess: async () => invalidateTeams(queryClient, tournamentId) })
}

export function useImportTournamentHistoricalTeamsMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: TournamentHistoricalImportRequest) => importTournamentHistoricalTeams(tournamentId, request),
    onSuccess: async () => Promise.all([
      queryClient.invalidateQueries({ queryKey: ["tournament", "audit-logs", tournamentId] }),
      invalidateTeams(queryClient, tournamentId),
    ]),
  })
}

export function useUpdateTournamentPlayerMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: ({ playerId, request }: { playerId: number; request: UpdateTournamentPlayerRequest }) => updateTournamentPlayer(tournamentId, playerId, request), onSuccess: async () => invalidateTeams(queryClient, tournamentId) })
}

export function useImportTournamentGoogleFormTeamsMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: TournamentGoogleFormImportRequest) => importTournamentGoogleFormTeams(tournamentId, request),
    onSuccess: async () => Promise.all([
      queryClient.invalidateQueries({ queryKey: ["tournament", "audit-logs", tournamentId] }),
      invalidateTeams(queryClient, tournamentId),
    ]),
  })
}

export function useCreateTournamentTeamMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: (request: CreateTournamentTeamRequest) => createTournamentTeam(tournamentId, request), onSuccess: async () => invalidateTeams(queryClient, tournamentId) })
}

export function useJoinTournamentTeamMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: (request: JoinTournamentTeamRequest) => joinTournamentTeam(tournamentId, request), onSuccess: async () => invalidateTeams(queryClient, tournamentId) })
}

export function useLeaveTournamentTeamMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: () => leaveTournamentTeam(tournamentId), onSuccess: async () => invalidateTeams(queryClient, tournamentId) })
}

export function useSubmitTournamentTeamMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: (teamId: number) => submitTournamentTeam(tournamentId, teamId), onSuccess: async () => invalidateTeams(queryClient, tournamentId) })
}

export function useUpdateTournamentTeamInfoMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: ({ request, teamId }: { request: UpdateTournamentTeamInfoRequest; teamId: number }) => updateTournamentTeamInfo(tournamentId, teamId, request), onSuccess: async () => invalidateTeams(queryClient, tournamentId) })
}

export function useUploadTournamentTeamAvatarMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: ({ file, teamId }: { file: File; teamId: number }) => uploadTournamentTeamAvatar(tournamentId, teamId, file), onSuccess: async () => invalidateTeams(queryClient, tournamentId) })
}

export function useTransferTournamentCaptainMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: ({ request, teamId }: { request: TransferTournamentCaptainRequest; teamId: number }) => transferTournamentCaptain(tournamentId, teamId, request), onSuccess: async () => invalidateTeams(queryClient, tournamentId) })
}

export function useResetTournamentInviteCodeMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: (teamId: number) => resetTournamentInviteCode(tournamentId, teamId), onSuccess: async () => invalidateTeams(queryClient, tournamentId) })
}

export function useKickTournamentPlayerMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: ({ playerId, teamId }: { playerId: number; teamId: number }) => kickTournamentPlayer(tournamentId, teamId, playerId), onSuccess: async () => invalidateTeams(queryClient, tournamentId) })
}
