import { Eye, FileArrowUp, MagnifyingGlass, NotePencil, Trash, UsersThree } from "@phosphor-icons/react"
import type { FormEvent } from "react"
import { useMemo, useState } from "react"
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
  useUploadTournamentTeamAvatarMutation,
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
import { AppAlert, CardGridSkeleton, getErrorMessage, MutationErrorAlert, PageState } from "@/shared/components"
import { TeamFlag } from "@/pages/tournaments/_shared/TeamFlag"
import { getTournamentPublicPath } from "@/pages/tournaments/_shared/tournamentVisuals"
import { AdminTournamentBreadcrumb } from "../_shared/AdminTournamentBreadcrumb"

const teamStatuses = [0, 1, 2, 3] as const
const reviewStatuses = ["review_pending", "review_passed", "review_failed"] as const
const PAGE_SIZE = 10
const EMPTY_TEAMS: TournamentTeam[] = []

export function AdminTournamentTeamsPage() {
  const { t } = useTranslation()
  const { tid } = useParams()
  const tournamentQuery = useTournamentDetailQuery(tid)
  const teamsQuery = useTournamentTeamsQuery(tid)
  const updateTeamMutation = useUpdateTournamentTeamStatusMutation(tid ?? "")
  const updateTeamInfoMutation = useUpdateTournamentTeamInfoMutation(tid ?? "")
  const uploadTeamAvatarMutation = useUploadTournamentTeamAvatarMutation(tid ?? "")
  const updatePlayerMutation = useUpdateTournamentPlayerMutation(tid ?? "")
  const kickMutation = useKickTournamentPlayerMutation(tid ?? "")
  const approveAllMutation = useApproveAllTournamentTeamsMutation(tid ?? "")
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const teams = teamsQuery.data ?? EMPTY_TEAMS
  const filteredTeams = useMemo(() => {
    const query = normalizeSearch(searchTerm)
    if (!query) return teams
    return teams.filter((team) => normalizeSearch(getTeamSearchText(team)).includes(query))
  }, [searchTerm, teams])
  const pageCount = Math.max(1, Math.ceil(filteredTeams.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pagedTeams = filteredTeams.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const players = teams.flatMap((team) => team.players ?? [])
  const passedPlayers = players.filter((player) => player.review_status === "review_passed").length
  const failedPlayers = players.filter((player) => player.review_status === "review_failed").length

  if (tournamentQuery.isError || teamsQuery.isError) {
    return <PageState title={t("tournament.admin.teams.loadFailed")} description={getErrorMessage(tournamentQuery.error ?? teamsQuery.error)} />
  }

  return (
    <AdminPage
      actions={(
        <>
          {tournamentQuery.data ? (
            <Button asChild type="button" variant="outline">
              <Link to={`${getTournamentPublicPath(tournamentQuery.data)}/teams`}>
                <Eye className="size-4" />
                {t("tournament.admin.common.view")}
              </Link>
            </Button>
          ) : null}
          <Button asChild type="button" variant="outline">
            <Link to={`/admin/tournaments/${tid}/import`}>
              <FileArrowUp className="size-4" />
              {t("tournament.admin.common.import")}
            </Link>
          </Button>
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
      breadcrumb={<AdminTournamentBreadcrumb current={t("tournament.common.teams")} tournament={tournamentQuery.data} tournamentId={tid} />}
    >
      {teamsQuery.isLoading || tournamentQuery.isLoading ? <CardGridSkeleton count={6} /> : null}

      {approveAllMutation.isError ? <MutationErrorAlert className="mb-4" error={approveAllMutation.error} title={t("tournament.admin.teams.approveAllFailed")} /> : null}
      {updateTeamMutation.isError ? <MutationErrorAlert className="mb-4" error={updateTeamMutation.error} title={t("tournament.admin.teams.updateTeamFailed")} /> : null}
      {updateTeamInfoMutation.isError ? <MutationErrorAlert className="mb-4" error={updateTeamInfoMutation.error} title={t("tournament.admin.teams.updateTeamInfoFailed")} /> : null}
      {uploadTeamAvatarMutation.isError ? <MutationErrorAlert className="mb-4" error={uploadTeamAvatarMutation.error} title={t("tournament.admin.teams.avatarUploadFailed")} /> : null}
      {updatePlayerMutation.isError ? <MutationErrorAlert className="mb-4" error={updatePlayerMutation.error} title={t("tournament.admin.teams.updatePlayerFailed")} /> : null}
      {kickMutation.isError ? <MutationErrorAlert className="mb-4" error={kickMutation.error} title={t("tournament.admin.teams.removePlayerFailed")} /> : null}

      {!teamsQuery.isLoading && !tournamentQuery.isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Metric label={t("tournament.common.teams")} value={teams.length} />
            <Metric label={t("tournament.admin.teams.players")} value={players.length} />
            <Metric label={t("tournament.admin.teams.reviewPassed")} value={passedPlayers} />
            <Metric label={t("tournament.admin.teams.reviewFailed")} value={failedPlayers} />
          </div>

          {teams.length === 0 ? <AppAlert title={t("tournament.admin.teams.noTeamsTitle")}>{t("tournament.admin.teams.noTeamsDescription")}</AppAlert> : null}

          {teams.length > 0 ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative w-full max-w-md">
                  <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    aria-label={t("tournament.common.quickSearch")}
                    className="pl-9"
                    placeholder={t("tournament.common.teamPlayerSearchPlaceholder")}
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(event.target.value)
                      setPage(1)
                    }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">{filteredTeams.length} / {teams.length}</p>
              </div>

              <TeamManagementTable
                isRemovingPlayer={kickMutation.isPending}
                isUpdatingPlayer={updatePlayerMutation.isPending}
                isUpdatingTeam={updateTeamMutation.isPending}
                isUpdatingTeamInfo={updateTeamInfoMutation.isPending}
                isUploadingTeamAvatar={uploadTeamAvatarMutation.isPending}
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
                onTeamAvatarUpload={async (team, file) => {
                  const updated = await uploadTeamAvatarMutation.mutateAsync({
                    file,
                    teamId: team.id,
                  })
                  toast.success(t("tournament.admin.teams.avatarUploaded"))
                  return updated
                }}
                onTeamStatusChange={(team, status) => {
                  updateTeamMutation.mutate({
                    request: { status },
                    teamId: team.id,
                  }, {
                    onSuccess: () => toast.success(t("tournament.admin.teams.teamStatusUpdated")),
                  })
                }}
                defaultTeamAvatar={tournamentQuery.data?.default_team_avatar}
                teams={pagedTeams}
              />

              <div className="flex items-center justify-end gap-2">
                <Button disabled={currentPage <= 1} type="button" variant="outline" onClick={() => setPage((value) => Math.max(1, value - 1))}>
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">{currentPage} / {pageCount}</span>
                <Button disabled={currentPage >= pageCount} type="button" variant="outline" onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>
                  Next
                </Button>
              </div>
            </>
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
  defaultTeamAvatar,
  isRemovingPlayer,
  isUpdatingPlayer,
  isUpdatingTeam,
  isUpdatingTeamInfo,
  isUploadingTeamAvatar,
  onKickPlayer,
  onTeamAvatarUpload,
  onPlayerReviewChange,
  onTeamInfoUpdate,
  onTeamStatusChange,
  teams,
}: {
  defaultTeamAvatar?: string | null
  isRemovingPlayer: boolean
  isUpdatingPlayer: boolean
  isUpdatingTeam: boolean
  isUpdatingTeamInfo: boolean
  isUploadingTeamAvatar: boolean
  onKickPlayer: (team: TournamentTeam, player: TournamentPlayer) => void
  onTeamAvatarUpload: (team: TournamentTeam, file: File) => Promise<TournamentTeam>
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
                    <TeamFlag className="h-10" name={getTeamName(team)} src={team.avatar ?? defaultTeamAvatar} />
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
                  <Badge variant="outline">{teamStatusLabel(team.status ?? 0, t)}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <TeamInfoDialog
                    isAvatarUploadPending={isUploadingTeamAvatar}
                    isPending={isUpdatingTeamInfo || isUpdatingTeam}
                    onAvatarUpload={(file) => onTeamAvatarUpload(team, file)}
                    onStatusChange={(status) => onTeamStatusChange(team, status)}
                    onSubmit={(request) => onTeamInfoUpdate(team, request)}
                    team={team}
                  />
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
            <p className="text-xs text-muted-foreground">osu_uid {player.user?.osu_uid ?? "-"}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline">QQ {player.contact_qq || "-"}</Badge>
          <Badge variant="outline">Discord {player.contact_discord || "-"}</Badge>
        </div>
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
      <TableCell />
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
  isAvatarUploadPending,
  isPending,
  onAvatarUpload,
  onStatusChange,
  onSubmit,
  team,
}: {
  isAvatarUploadPending: boolean
  isPending: boolean
  onAvatarUpload: (file: File) => Promise<TournamentTeam>
  onStatusChange: (status: number) => void
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
        <TeamInfoForm
          key={`${team.id}-${team.updated_time ?? ""}`}
          isAvatarUploadPending={isAvatarUploadPending}
          isPending={isPending}
          onAvatarUpload={onAvatarUpload}
          onStatusChange={onStatusChange}
          onSubmit={onSubmit}
          team={team}
        />
      </DialogContent>
    </Dialog>
  )
}

function TeamInfoForm({
  isAvatarUploadPending,
  isPending,
  onAvatarUpload,
  onStatusChange,
  onSubmit,
  team,
}: {
  isAvatarUploadPending: boolean
  isPending: boolean
  onAvatarUpload: (file: File) => Promise<TournamentTeam>
  onStatusChange: (status: number) => void
  onSubmit: (request: UpdateTournamentTeamInfoRequest) => void
  team: TournamentTeam
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(team.name)
  const [displayName, setDisplayName] = useState(team.display_name || team.name)
  const [isOpen, setIsOpen] = useState(Boolean(team.is_open))
  const [status, setStatus] = useState(String(team.status ?? 0))

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit({
      display_name: displayName.trim(),
      is_open: isOpen,
      name: name.trim(),
    })
    if (Number(status) !== Number(team.status ?? 0)) {
      onStatusChange(Number(status))
    }
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
          <Label htmlFor={`team-${team.id}-avatar-file`}>{t("tournament.admin.teams.avatarUpload")}</Label>
          <Input
            accept="image/jpeg,image/png,image/gif,image/webp"
            disabled={isAvatarUploadPending}
            id={`team-${team.id}-avatar-file`}
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.currentTarget.value = ""
              if (!file) return
              void onAvatarUpload(file)
                .catch(() => undefined)
            }}
            type="file"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={isOpen} onCheckedChange={(checked) => setIsOpen(checked === true)} />
          {t("tournament.admin.teams.publicTeam")}
        </label>
        <div className="grid gap-2">
          <Label>{t("tournament.admin.list.status")}</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {teamStatuses.map((teamStatus) => (
                <SelectItem key={teamStatus} value={String(teamStatus)}>{teamStatusLabel(teamStatus, t)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button disabled={isPending || isAvatarUploadPending} type="submit">
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

function normalizeSearch(value: string) {
  return value.trim().toLowerCase()
}

function getTeamSearchText(team: TournamentTeam) {
  return [
    team.name,
    team.display_name,
    String(team.id),
    ...(team.players ?? []).flatMap((player) => [
      player.user_name_snapshot,
      player.user?.user_name,
      player.user?.osu_uid ? String(player.user.osu_uid) : "",
      player.contact_discord,
      player.contact_qq,
    ]),
  ].filter(Boolean).join(" ")
}
