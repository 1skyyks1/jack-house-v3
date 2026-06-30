import { LockKey, Plus, SignIn } from "@phosphor-icons/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { toast } from "sonner"
import {
  useCreateTournamentTeamMutation,
  useJoinTournamentTeamMutation,
  useKickTournamentPlayerMutation,
  useLeaveTournamentTeamMutation,
  useResetTournamentInviteCodeMutation,
  useSubmitTournamentTeamMutation,
  useTournamentDetailQuery,
  useTournamentTeamsQuery,
  useTransferTournamentCaptainMutation,
  useUpdateTournamentTeamInfoMutation,
  type TournamentPlayer,
  type TournamentTeam,
} from "@/entities/tournament"
import { useAuthStore } from "@/features/auth/model/authStore"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AppAlert, getErrorMessage, MutationErrorAlert, PageState } from "@/shared/components"
import { TournamentBreadcrumb } from "../_shared/TournamentBreadcrumb"
import { TeamSection } from "./components"
import { getRegistrationStatus, isPlayerCaptain } from "./utils"

export function TournamentTeamsPage() {
  const { t } = useTranslation()
  const { tid } = useParams()
  const isLogged = useAuthStore((state) => state.isLogged)
  const openLoginDialog = useAuthStore((state) => state.openLoginDialog)
  const userId = useAuthStore((state) => state.userId)
  const tournamentQuery = useTournamentDetailQuery(tid)
  const teamsQuery = useTournamentTeamsQuery(tid)
  const createMutation = useCreateTournamentTeamMutation(tid ?? "")
  const joinMutation = useJoinTournamentTeamMutation(tid ?? "")
  const leaveMutation = useLeaveTournamentTeamMutation(tid ?? "")
  const submitMutation = useSubmitTournamentTeamMutation(tid ?? "")
  const updateTeamInfoMutation = useUpdateTournamentTeamInfoMutation(tid ?? "")
  const transferCaptainMutation = useTransferTournamentCaptainMutation(tid ?? "")
  const resetInviteMutation = useResetTournamentInviteCodeMutation(tid ?? "")
  const kickMutation = useKickTournamentPlayerMutation(tid ?? "")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isJoinOpen, setIsJoinOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<TournamentTeam | null>(null)
  const [transferTeam, setTransferTeam] = useState<TournamentTeam | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [teamName, setTeamName] = useState("")
  const [isOpenTeam, setIsOpenTeam] = useState(true)
  const [inviteCode, setInviteCode] = useState("")
  const [editName, setEditName] = useState("")
  const [editDisplayName, setEditDisplayName] = useState("")
  const [editAvatar, setEditAvatar] = useState("")
  const [editIsOpen, setEditIsOpen] = useState(true)
  const [transferPlayerId, setTransferPlayerId] = useState("")

  const requireLogin = () => {
    if (isLogged) return true
    openLoginDialog(window.location.pathname)
    return false
  }

  const ensureCanRegister = () => {
    if (!requireLogin()) return false
    if (registrationBlockReason) {
      toast.error(registrationBlockReason)
      return false
    }
    return true
  }

  const createTeam = () => {
    if (!ensureCanRegister() || !teamName.trim()) return
    createMutation.mutate({
      is_open: isOpenTeam,
      name: teamName.trim(),
    }, {
      onSuccess: () => {
        toast.success(t("tournament.teams.createSuccess"))
        setTeamName("")
        setIsCreateOpen(false)
      },
    })
  }

  const joinByCode = () => {
    if (!ensureCanRegister() || !inviteCode.trim()) return
    joinMutation.mutate({ invite_code: inviteCode.trim() }, {
      onSuccess: () => {
        toast.success(t("tournament.teams.joined"))
        setInviteCode("")
        setIsJoinOpen(false)
      },
    })
  }

  const joinOpenTeam = (teamId: number) => {
    if (!ensureCanRegister()) return
    joinMutation.mutate({ team_id: teamId }, {
      onSuccess: () => toast.success(t("tournament.teams.joined")),
    })
  }

  const leaveTeam = () => {
    leaveMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success(t("tournament.teams.left"))
        setConfirmAction(null)
      },
    })
  }

  const submitTeam = (teamId: number) => {
    submitMutation.mutate(teamId, {
      onSuccess: () => toast.success(t("tournament.teams.submitted")),
    })
  }

  const resetInviteCode = (teamId: number) => {
    resetInviteMutation.mutate(teamId, {
      onSuccess: (response) => toast.success(t("tournament.teams.newInviteCode", { code: response.invite_code })),
    })
  }

  const openEditTeam = (team: TournamentTeam) => {
    setEditingTeam(team)
    setEditName(team.name)
    setEditDisplayName(team.display_name || team.name)
    setEditAvatar(team.avatar ?? "")
    setEditIsOpen(Boolean(team.is_open))
  }

  const saveTeamInfo = () => {
    if (!editingTeam || !editName.trim()) return
    updateTeamInfoMutation.mutate({
      request: {
        avatar: editAvatar.trim() || null,
        display_name: editDisplayName.trim(),
        is_open: editIsOpen,
        name: editName.trim(),
      },
      teamId: editingTeam.id,
    }, {
      onSuccess: () => {
        toast.success(t("tournament.teams.updated"))
        setEditingTeam(null)
      },
    })
  }

  const openTransferCaptain = (team: TournamentTeam) => {
    setTransferTeam(team)
    const nextPlayer = (team.players ?? []).find((player) => !isPlayerCaptain(team, player))
    setTransferPlayerId(nextPlayer ? String(nextPlayer.id) : "")
  }

  const transferCaptain = () => {
    if (!transferTeam || !transferPlayerId) return
    transferCaptainMutation.mutate({
      request: { player_id: Number(transferPlayerId) },
      teamId: transferTeam.id,
    }, {
      onSuccess: () => {
        toast.success(t("tournament.teams.captainTransferred"))
        setTransferTeam(null)
      },
    })
  }

  const kickPlayer = (teamId: number, playerId: number) => {
    kickMutation.mutate({ playerId, teamId }, {
      onSuccess: () => {
        toast.success(t("tournament.teams.playerRemoved"))
        setConfirmAction(null)
      },
    })
  }

  if (tournamentQuery.isError || teamsQuery.isError) {
    return <PageState title={t("tournament.teams.loadFailed")} description={getErrorMessage(tournamentQuery.error ?? teamsQuery.error)} />
  }

  const tournament = tournamentQuery.data
  const teams = teamsQuery.data ?? []
  const currentUserId = userId ? Number(userId) : null
  const myTeam = currentUserId ? teams.find((team) => team.players?.some((player) => Number(player.user_id) === currentUserId)) : undefined
  const isCurrentUserStaff = Boolean(currentUserId && tournament?.staff?.some((staff) => Number(staff.user_id) === currentUserId))
  const registrationStatus = getRegistrationStatus(tournament, t)
  const registrationBlockReason = registrationStatus.blockReason
    ?? (isLogged && isCurrentUserStaff
      ? t("tournament.teams.staffCannotRegister")
      : isLogged && myTeam
      ? t("tournament.teams.alreadyInTeam")
        : null)

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <TournamentBreadcrumb current={t("tournament.teams.title")} tournament={tournament} tournamentId={tid} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">{tournament?.acronym ?? t("tournament.common.tournament")}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-3xl font-semibold">{t("tournament.teams.title")}</h1>
            <Badge variant={registrationStatus.isOpen ? "default" : "outline"}>{registrationStatus.title}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={Boolean(registrationBlockReason)} onClick={() => (ensureCanRegister() ? setIsJoinOpen(true) : undefined)} variant="outline">
            <LockKey className="size-4" weight="bold" />
            {t("tournament.teams.inviteCode")}
          </Button>
          <Button disabled={Boolean(registrationBlockReason)} onClick={() => (ensureCanRegister() ? setIsCreateOpen(true) : undefined)}>
            <Plus className="size-4" weight="bold" />
            {t("tournament.teams.newTeam")}
          </Button>
        </div>
      </div>

      {(createMutation.error || joinMutation.error || leaveMutation.error || submitMutation.error || updateTeamInfoMutation.error || transferCaptainMutation.error || resetInviteMutation.error || kickMutation.error) ? (
        <MutationErrorAlert error={createMutation.error ?? joinMutation.error ?? leaveMutation.error ?? submitMutation.error ?? updateTeamInfoMutation.error ?? transferCaptainMutation.error ?? resetInviteMutation.error ?? kickMutation.error} />
      ) : null}

      {teamsQuery.isLoading ? <PageState title={t("tournament.teams.loading")} description={null} /> : null}
      {!teamsQuery.isLoading && teams.length === 0 ? (
        <AppAlert title={t("tournament.teams.emptyTitle")} />
      ) : null}

      {teams.length > 0 ? (
        <TeamSection
          action={(team) => (
            team.is_open ? (
              <Button disabled={joinMutation.isPending || Boolean(registrationBlockReason)} onClick={() => joinOpenTeam(team.id)} size="sm" variant="outline">
                <SignIn className="size-4" weight="bold" />
                {t("tournament.common.join")}
              </Button>
            ) : null
          )}
          myTeamId={myTeam?.id}
          onKick={(team, player) => setConfirmAction({ player, team, type: "kick" })}
          onLeave={(team) => setConfirmAction({ team, type: "leave" })}
          onEdit={openEditTeam}
          onResetInvite={resetInviteCode}
          onSubmit={submitTeam}
          onTransferCaptain={openTransferCaptain}
          registrationOpen={registrationStatus.isOpen}
          userId={currentUserId}
          teams={teams}
        />
      ) : null}

      <Dialog onOpenChange={setIsCreateOpen} open={isCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("tournament.teams.newTeam")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">{t("tournament.teams.teamName")}</Label>
              <Input id="team-name" onChange={(event) => setTeamName(event.target.value)} value={teamName} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={isOpenTeam} onCheckedChange={(checked) => setIsOpenTeam(Boolean(checked))} />
              {t("tournament.teams.publicTeam")}
            </label>
          </div>
          <DialogFooter>
            <Button disabled={createMutation.isPending || !teamName.trim()} onClick={createTeam}>
              {t("tournament.common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setIsJoinOpen} open={isJoinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("tournament.teams.joinByInvite")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="invite-code">{t("tournament.teams.inviteCode")}</Label>
            <Input id="invite-code" onChange={(event) => setInviteCode(event.target.value)} value={inviteCode} />
          </div>
          <DialogFooter>
            <Button disabled={joinMutation.isPending || !inviteCode.trim()} onClick={joinByCode}>
              {t("tournament.common.join")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={(open) => !open && setEditingTeam(null)} open={Boolean(editingTeam)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("tournament.teams.editTeam")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-team-name">{t("tournament.teams.teamName")}</Label>
              <Input id="edit-team-name" onChange={(event) => setEditName(event.target.value)} value={editName} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-display-name">{t("tournament.teams.displayName")}</Label>
              <Input id="edit-display-name" onChange={(event) => setEditDisplayName(event.target.value)} value={editDisplayName} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-avatar">{t("tournament.teams.avatarUrl")}</Label>
              <Input id="edit-avatar" onChange={(event) => setEditAvatar(event.target.value)} value={editAvatar} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={editIsOpen} onCheckedChange={(checked) => setEditIsOpen(Boolean(checked))} />
              {t("tournament.teams.publicTeam")}
            </label>
          </div>
          <DialogFooter>
            <Button disabled={updateTeamInfoMutation.isPending || !editName.trim()} onClick={saveTeamInfo}>
              {t("tournament.common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={(open) => !open && setTransferTeam(null)} open={Boolean(transferTeam)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("tournament.teams.transferCaptain")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>{t("tournament.teams.newCaptain")}</Label>
            <Select value={transferPlayerId} onValueChange={setTransferPlayerId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("tournament.teams.selectPlayer")} />
              </SelectTrigger>
              <SelectContent>
                {(transferTeam?.players ?? []).filter((player) => !isPlayerCaptain(transferTeam as TournamentTeam, player)).map((player) => (
                  <SelectItem key={player.id} value={String(player.id)}>{player.user_name_snapshot ?? player.user?.user_name ?? t("tournament.common.user", { id: player.user_id })}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button disabled={transferCaptainMutation.isPending || !transferPlayerId} onClick={transferCaptain}>
              {t("tournament.common.transfer")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog onOpenChange={(open) => !open && setConfirmAction(null)} open={Boolean(confirmAction)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.type === "kick" ? t("tournament.teams.removePlayerTitle") : t("tournament.teams.leaveTeamTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "kick"
                ? t("tournament.teams.removePlayerDescription")
                : t("tournament.teams.leaveTeamDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("tournament.common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!confirmAction) return
                if (confirmAction.type === "kick") {
                  kickPlayer(confirmAction.team.id, confirmAction.player.id)
                } else {
                  leaveTeam()
                }
              }}
            >
              {t("tournament.common.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}

type ConfirmAction =
  | { team: TournamentTeam; type: "leave" }
  | { player: TournamentPlayer; team: TournamentTeam; type: "kick" }
