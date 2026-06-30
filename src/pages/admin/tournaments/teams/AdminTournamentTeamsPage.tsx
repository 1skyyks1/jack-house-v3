import { ArrowLeft, Eye, NotePencil, Trash, UsersThree } from "@phosphor-icons/react"
import type { FormEvent } from "react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import {
  useApproveAllTournamentTeamsMutation,
  useKickTournamentPlayerMutation,
  useTournamentDetailQuery,
  useTournamentTeamsQuery,
  useUpdateTournamentTeamInfoMutation,
  useUpdateTournamentPlayerMutation,
  useUpdateTournamentTeamStatusMutation,
  type TournamentPlayer,
  type TournamentTeam,
  type UpdateTournamentTeamInfoRequest,
} from "@/entities/tournament"
import { AdminPage } from "@/features/admin-shell"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AppAlert, getErrorMessage, MutationErrorAlert, PageState } from "@/shared/components"

const teamStatuses = [0, 1, 2, 3] as const
const reviewStatuses = ["review_pending", "review_passed", "review_failed"] as const

export function AdminTournamentTeamsPage() {
  const { t } = useTranslation()
  const { tid } = useParams()
  const tournamentQuery = useTournamentDetailQuery(tid)
  const teamsQuery = useTournamentTeamsQuery(tid)
  const updateTeamMutation = useUpdateTournamentTeamStatusMutation(tid ?? "")
  const updateTeamInfoMutation = useUpdateTournamentTeamInfoMutation(tid ?? "")
  const updatePlayerMutation = useUpdateTournamentPlayerMutation(tid ?? "")
  const kickMutation = useKickTournamentPlayerMutation(tid ?? "")
  const approveAllMutation = useApproveAllTournamentTeamsMutation(tid ?? "")

  if (tournamentQuery.isError || teamsQuery.isError) {
    return <PageState title={t("tournament.admin.teams.loadFailed")} description={getErrorMessage(tournamentQuery.error ?? teamsQuery.error)} />
  }

  const teams = teamsQuery.data ?? []
  const players = teams.flatMap((team) => team.players ?? [])
  const passedPlayers = players.filter((player) => player.review_status === "review_passed").length
  const failedPlayers = players.filter((player) => player.review_status === "review_failed").length

  return (
    <AdminPage
      actions={(
        <>
          <Button asChild type="button" variant="outline">
            <Link to="/admin/tournaments">
              <ArrowLeft className="size-4" />
              {t("tournament.admin.common.back")}
            </Link>
          </Button>
          {tournamentQuery.data ? (
            <Button asChild type="button" variant="outline">
              <Link to={`/t/${tournamentQuery.data.acronym || tournamentQuery.data.id}/teams`}>
                <Eye className="size-4" />
                {t("tournament.admin.common.view")}
              </Link>
            </Button>
          ) : null}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={approveAllMutation.isPending || teams.length === 0} type="button">
                <UsersThree className="size-4" weight="bold" />
                {t("tournament.admin.teams.approveAllTeams")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("tournament.admin.teams.approveAllTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("tournament.admin.teams.approveAllDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("tournament.common.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    approveAllMutation.mutate(undefined, {
                      onSuccess: () => toast.success(t("tournament.admin.teams.teamsApproved")),
                    })
                  }}
                >
                  {t("tournament.admin.teams.approve")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    >
      {teamsQuery.isLoading || tournamentQuery.isLoading ? <PageState title={t("tournament.admin.teams.loading")} description={t("tournament.admin.teams.loadingDescription")} /> : null}

      {approveAllMutation.isError ? <MutationErrorAlert className="mb-4" error={approveAllMutation.error} title={t("tournament.admin.teams.approveAllFailed")} /> : null}
      {updateTeamMutation.isError ? <MutationErrorAlert className="mb-4" error={updateTeamMutation.error} title={t("tournament.admin.teams.updateTeamFailed")} /> : null}
      {updateTeamInfoMutation.isError ? <MutationErrorAlert className="mb-4" error={updateTeamInfoMutation.error} title={t("tournament.admin.teams.updateTeamInfoFailed")} /> : null}
      {updatePlayerMutation.isError ? <MutationErrorAlert className="mb-4" error={updatePlayerMutation.error} title={t("tournament.admin.teams.updatePlayerFailed")} /> : null}
      {kickMutation.isError ? <MutationErrorAlert className="mb-4" error={kickMutation.error} title={t("tournament.admin.teams.removePlayerFailed")} /> : null}

      {!teamsQuery.isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Metric label={t("tournament.common.teams")} value={teams.length} />
            <Metric label={t("tournament.admin.teams.players")} value={players.length} />
            <Metric label={t("tournament.admin.teams.reviewPassed")} value={passedPlayers} />
            <Metric label={t("tournament.admin.teams.reviewFailed")} value={failedPlayers} />
          </div>

          {teams.length === 0 ? <AppAlert title={t("tournament.admin.teams.noTeamsTitle")}>{t("tournament.admin.teams.noTeamsDescription")}</AppAlert> : null}

          {teams.length > 0 ? (
            <TeamManagementTable
              isRemovingPlayer={kickMutation.isPending}
              isUpdatingPlayer={updatePlayerMutation.isPending}
              isUpdatingTeam={updateTeamMutation.isPending}
              isUpdatingTeamInfo={updateTeamInfoMutation.isPending}
              onKickPlayer={(team, player) => {
                kickMutation.mutate({
                  playerId: player.id,
                  teamId: team.id,
                }, {
                  onSuccess: () => toast.success(t("tournament.admin.teams.playerRemoved")),
                })
              }}
              onPlayerReviewChange={(player, reviewStatus) => {
                updatePlayerMutation.mutate({
                  playerId: player.id,
                  request: { review_status: reviewStatus },
                }, {
                  onSuccess: () => toast.success(t("tournament.admin.teams.playerReviewUpdated")),
                })
              }}
              onTeamInfoUpdate={(team, request) => {
                updateTeamInfoMutation.mutate({
                  request,
                  teamId: team.id,
                }, {
                  onSuccess: () => toast.success(t("tournament.admin.teams.teamInfoUpdated")),
                })
              }}
              onTeamStatusChange={(team, status) => {
                updateTeamMutation.mutate({
                  request: { status },
                  teamId: team.id,
                }, {
                  onSuccess: () => toast.success(t("tournament.admin.teams.teamStatusUpdated")),
                })
              }}
              teams={teams}
            />
          ) : null}
        </div>
      ) : null}
    </AdminPage>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card size="sm">
      <CardContent>
        <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
        <p className="mt-1 font-heading text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
}

function TeamManagementTable({
  isRemovingPlayer,
  isUpdatingPlayer,
  isUpdatingTeam,
  isUpdatingTeamInfo,
  onKickPlayer,
  onPlayerReviewChange,
  onTeamInfoUpdate,
  onTeamStatusChange,
  teams,
}: {
  isRemovingPlayer: boolean
  isUpdatingPlayer: boolean
  isUpdatingTeam: boolean
  isUpdatingTeamInfo: boolean
  onKickPlayer: (team: TournamentTeam, player: TournamentPlayer) => void
  onPlayerReviewChange: (player: TournamentPlayer, reviewStatus: "review_pending" | "review_passed" | "review_failed") => void
  onTeamInfoUpdate: (team: TournamentTeam, request: UpdateTournamentTeamInfoRequest) => void
  onTeamStatusChange: (team: TournamentTeam, status: number) => void
  teams: TournamentTeam[]
}) {
  const { t } = useTranslation()

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader className="bg-muted/60">
          <TableRow>
            <TableHead className="min-w-64">{t("tournament.admin.teams.teamPlayer")}</TableHead>
            <TableHead className="min-w-52">{t("tournament.admin.teams.contact")}</TableHead>
            <TableHead>{t("tournament.admin.teams.review")}</TableHead>
            <TableHead>{t("tournament.admin.list.status")}</TableHead>
            <TableHead className="text-right">{t("tournament.admin.common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.flatMap((team) => {
            const players = team.players ?? []
            const qualifiedPlayers = players.filter((player) => player.review_status !== "review_failed")
            const isQualified = qualifiedPlayers.length > 0

            return [
              <TableRow className="bg-muted/25 hover:bg-muted/35" key={`team-${team.id}`}>
                <TableCell colSpan={2}>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10 rounded-lg">
                      <AvatarImage src={team.avatar ?? undefined} />
                      <AvatarFallback className="rounded-lg">{getTeamName(team).slice(0, 1)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{getTeamName(team)}</span>
                        <Badge variant="outline">#{team.id}</Badge>
                        <Badge variant={team.is_open ? "secondary" : "outline"}>{team.is_open ? t("tournament.teams.open") : t("tournament.teams.private")}</Badge>
                        <Badge className={isQualified ? "border-emerald-500/30 text-emerald-600" : "border-destructive/30 text-destructive"} variant="outline">
                          {isQualified ? t("tournament.admin.teams.mainStageEligible") : t("tournament.admin.teams.noEligiblePlayer")}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t("tournament.admin.teams.playersSummary", { count: players.length, rank: team.qual_rank ?? "-", score: team.qual_score ?? "-" })}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">{t("tournament.admin.teams.teamRow")}</span>
                </TableCell>
                <TableCell>
                  <Select disabled={isUpdatingTeam} onValueChange={(value) => onTeamStatusChange(team, Number(value))} value={String(team.status ?? 0)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {teamStatuses.map((status) => (
                        <SelectItem key={status} value={String(status)}>{teamStatusLabel(status, t)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <TeamInfoDialog isPending={isUpdatingTeamInfo} onSubmit={(request) => onTeamInfoUpdate(team, request)} team={team} />
                </TableCell>
              </TableRow>,
              ...(players.length > 0
                ? players.map((player) => (
                  <PlayerTableRow
                    isRemovingPlayer={isRemovingPlayer}
                    isUpdatingPlayer={isUpdatingPlayer}
                    key={`player-${player.id}`}
                    onKick={() => onKickPlayer(team, player)}
                    onReviewChange={(reviewStatus) => onPlayerReviewChange(player, reviewStatus)}
                    player={player}
                    removeDisabled={Boolean(player.is_captain) || Number(player.id) === Number(team.captain_player_id)}
                  />
                ))
                : [
                  <TableRow key={`empty-${team.id}`}>
                    <TableCell className="py-6 text-center text-muted-foreground" colSpan={5}>
                      {t("tournament.admin.teams.noPlayersDescription")}
                    </TableCell>
                  </TableRow>,
                ]),
            ]
          })}
        </TableBody>
      </Table>
    </div>
  )
}

function PlayerTableRow({
  isRemovingPlayer,
  isUpdatingPlayer,
  onKick,
  onReviewChange,
  player,
  removeDisabled,
}: {
  isRemovingPlayer: boolean
  isUpdatingPlayer: boolean
  onKick: () => void
  onReviewChange: (reviewStatus: "review_pending" | "review_passed" | "review_failed") => void
  player: TournamentPlayer
  removeDisabled: boolean
}) {
  const { t } = useTranslation()
  const name = player.user_name_snapshot ?? player.user?.user_name ?? t("tournament.common.player")
  const avatar = player.avatar_snapshot ?? player.user?.avatar ?? undefined
  const reviewStatus = player.review_status === "review_passed" || player.review_status === "review_failed" ? player.review_status : "review_pending"

  return (
    <TableRow>
      <TableCell>
        <div className="flex min-w-0 items-center gap-3 pl-6">
          <Avatar className="size-8">
            <AvatarImage src={avatar} />
            <AvatarFallback>{name.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link className="truncate font-medium hover:text-primary" to={`/user/${player.user_id}`}>{name}</Link>
              {player.is_captain ? <Badge variant="outline">{t("tournament.common.captain")}</Badge> : null}
            </div>
            <p className="text-xs text-muted-foreground">UID {player.user_id} / osu {player.user?.osu_uid ?? "-"}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <p>QQ {player.contact_qq || "-"}</p>
        <p className="text-xs text-muted-foreground">Discord {player.contact_discord || "-"}</p>
      </TableCell>
      <TableCell>
        <Select disabled={isUpdatingPlayer} onValueChange={(value) => onReviewChange(value as typeof reviewStatus)} value={reviewStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {reviewStatuses.map((status) => (
              <SelectItem key={status} value={status}>{reviewStatusLabel(status, t)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{reviewStatusLabel(reviewStatus, t)}</Badge>
      </TableCell>
      <TableCell className="text-right">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={isRemovingPlayer || removeDisabled} size="icon" type="button" variant="outline">
              <Trash className="size-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("tournament.admin.teams.removePlayerTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("tournament.admin.teams.removePlayerDescription", { name })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("tournament.common.cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={onKick} variant="destructive">{t("tournament.common.remove")}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  )
}

function TeamInfoDialog({
  isPending,
  onSubmit,
  team,
}: {
  isPending: boolean
  onSubmit: (request: UpdateTournamentTeamInfoRequest) => void
  team: TournamentTeam
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" type="button" variant="outline">
          <NotePencil className="size-4" />
          {t("tournament.common.edit")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <TeamInfoForm key={`${team.id}-${team.updated_time ?? ""}`} isPending={isPending} onSubmit={onSubmit} team={team} />
      </DialogContent>
    </Dialog>
  )
}

function TeamInfoForm({
  isPending,
  onSubmit,
  team,
}: {
  isPending: boolean
  onSubmit: (request: UpdateTournamentTeamInfoRequest) => void
  team: TournamentTeam
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(team.name)
  const [displayName, setDisplayName] = useState(team.display_name || team.name)
  const [avatar, setAvatar] = useState(team.avatar ?? "")
  const [isOpen, setIsOpen] = useState(Boolean(team.is_open))

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit({
      avatar: avatar.trim() || null,
      display_name: displayName.trim(),
      is_open: isOpen,
      name: name.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{t("tournament.admin.teams.editTeamInfo")}</DialogTitle>
        <DialogDescription>
          {t("tournament.admin.teams.editTeamInfoDescription")}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor={`team-${team.id}-name`}>{t("tournament.admin.teams.name")}</Label>
          <Input id={`team-${team.id}-name`} required value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`team-${team.id}-display-name`}>{t("tournament.admin.teams.displayName")}</Label>
          <Input id={`team-${team.id}-display-name`} value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`team-${team.id}-avatar`}>{t("tournament.admin.teams.avatarUrl")}</Label>
          <Input id={`team-${team.id}-avatar`} value={avatar} onChange={(event) => setAvatar(event.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={isOpen} onCheckedChange={(checked) => setIsOpen(checked === true)} />
          {t("tournament.admin.teams.publicTeam")}
        </label>
      </div>
      <DialogFooter>
        <Button disabled={isPending} type="submit">
          {isPending ? t("tournament.admin.form.saving") : t("tournament.admin.teams.saveChanges")}
        </Button>
      </DialogFooter>
    </form>
  )
}

function teamStatusLabel(status: number, t: ReturnType<typeof useTranslation>["t"]) {
  if (status === 1) return t("tournament.admin.teams.approved")
  if (status === 2) return t("tournament.admin.teams.submitted")
  if (status === 3) return t("tournament.admin.teams.locked")
  return t("tournament.admin.teams.created")
}

function reviewStatusLabel(status: "review_pending" | "review_passed" | "review_failed", t: ReturnType<typeof useTranslation>["t"]) {
  if (status === "review_passed") return t("tournament.admin.teams.passed")
  if (status === "review_failed") return t("tournament.admin.teams.failed")
  return t("tournament.admin.teams.pending")
}

function getTeamName(team: TournamentTeam) {
  return team.display_name || team.name || `Team ${team.id}`
}
