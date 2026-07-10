import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"
import {
  createTournament,
  createTournamentSection,
  createTournamentStaff,
  deleteTournamentSection,
  deleteTournamentStaff,
  getTournamentAuditLog,
  getTournamentAuditLogs,
  getTournamentById,
  getTournamentList,
  getTournamentManageSections,
  getTournamentSections,
  getTournamentStaff,
  previewTournamentMarkdown,
  updateTournament,
  updateTournamentSection,
  uploadTournamentDefaultTeamAvatar,
} from "../tournamentApi"
import type {
  CreateTournamentRequest,
  CreateTournamentStaffRequest,
  TournamentAuditLogQuery,
  TournamentMarkdownPreviewRequest,
  TournamentSectionRequest,
  UpdateTournamentRequest,
} from "../../model/types"
import { tournamentQueryKeys } from "./queryKeys"

export function useTournamentListQuery() {
  return useQuery({ queryFn: getTournamentList, queryKey: tournamentQueryKeys.list })
}

export function useCreateTournamentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateTournamentRequest) => createTournament(request),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.list }),
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
    onSuccess: async () => Promise.all([
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.detail(tournamentId) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.list }),
    ]),
  })
}

export function useUploadTournamentDefaultTeamAvatarMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => uploadTournamentDefaultTeamAvatar(tournamentId, file),
    onSuccess: async () => Promise.all([
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.detail(tournamentId) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.list }),
    ]),
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

export function useTournamentAuditLogQuery(tournamentId: string | undefined, auditId: number, enabled: boolean) {
  return useQuery({
    enabled: Boolean(tournamentId) && auditId > 0 && enabled,
    queryFn: () => getTournamentAuditLog(tournamentId as string, auditId),
    queryKey: tournamentQueryKeys.auditLog(tournamentId ?? "", auditId),
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
    onSuccess: async () => Promise.all([
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.staff(tournamentId) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.detail(tournamentId) }),
    ]),
  })
}

export function useDeleteTournamentStaffMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (staffId: number) => deleteTournamentStaff(tournamentId, staffId),
    onSuccess: async () => Promise.all([
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.staff(tournamentId) }),
      queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.detail(tournamentId) }),
    ]),
  })
}

const invalidateSections = (queryClient: QueryClient, tournamentId: string) => Promise.all([
  queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.manageSections(tournamentId) }),
  queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.sections(tournamentId) }),
])

export function useCreateTournamentSectionMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: TournamentSectionRequest) => createTournamentSection(tournamentId, request),
    onSuccess: async () => invalidateSections(queryClient, tournamentId),
  })
}

export function useUpdateTournamentSectionMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ request, sectionId }: { request: TournamentSectionRequest; sectionId: number }) => updateTournamentSection(tournamentId, sectionId, request),
    onSuccess: async () => invalidateSections(queryClient, tournamentId),
  })
}

export function useDeleteTournamentSectionMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sectionId: number) => deleteTournamentSection(tournamentId, sectionId),
    onSuccess: async () => invalidateSections(queryClient, tournamentId),
  })
}

export function usePreviewTournamentMarkdownMutation(tournamentId: string) {
  return useMutation({ mutationFn: (request: TournamentMarkdownPreviewRequest) => previewTournamentMarkdown(tournamentId, request) })
}
