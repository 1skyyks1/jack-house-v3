import { ArrowLeft, Eye, Plus, Trash } from "@phosphor-icons/react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import {
  useCreateTournamentStaffMutation,
  useDeleteTournamentStaffMutation,
  useTournamentDetailQuery,
  useTournamentStaffQuery,
  type TournamentStaff,
  type TournamentStaffRole,
} from "@/entities/tournament"
import { useUserListQuery } from "@/entities/user"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AppAlert, getErrorMessage, MutationErrorAlert, PageState } from "@/shared/components"

const staffRoles: TournamentStaffRole[] = ["host", "pooler", "referee", "streamer", "commentator"]

const emptyStaff: TournamentStaff[] = []

export function AdminTournamentStaffPage() {
  const { t } = useTranslation()
  const { tid } = useParams()
  const tournamentQuery = useTournamentDetailQuery(tid)
  const staffQuery = useTournamentStaffQuery(tid)
  const createMutation = useCreateTournamentStaffMutation(tid ?? "")
  const deleteMutation = useDeleteTournamentStaffMutation(tid ?? "")
  const [searchDraft, setSearchDraft] = useState("")
  const [search, setSearch] = useState("")
  const [role, setRole] = useState<TournamentStaffRole>("referee")
  const [userId, setUserId] = useState("")
  const usersQuery = useUserListQuery({ page: 1, pageSize: 20, search })

  const staff = staffQuery.data ?? emptyStaff
  const groupedStaff = useMemo(() => {
    const groups = new Map<string, TournamentStaff[]>()
    for (const staffItem of staff) {
      groups.set(staffItem.role, [...(groups.get(staffItem.role) ?? []), staffItem])
    }
    return groups
  }, [staff])

  const selectedUser = usersQuery.data?.data.find((user) => String(user.user_id) === userId)

  if (tournamentQuery.isError || staffQuery.isError) {
    return <PageState title={t("tournament.admin.staff.loadFailed")} description={getErrorMessage(tournamentQuery.error ?? staffQuery.error)} />
  }

  const addStaff = () => {
    const parsedUserId = Number(userId)
    if (!parsedUserId) return
    createMutation.mutate({ role, user_id: parsedUserId }, {
      onSuccess: () => {
        toast.success(t("tournament.admin.staff.added"))
        setUserId("")
      },
    })
  }

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
              <Link to={`/t/${tournamentQuery.data.acronym || tournamentQuery.data.id}`}>
                <Eye className="size-4" />
                {t("tournament.admin.common.view")}
              </Link>
            </Button>
          ) : null}
        </>
      )}
    >
      {tournamentQuery.isLoading || staffQuery.isLoading ? <PageState title={t("tournament.admin.staff.loading")} description={t("tournament.admin.staff.loadingDescription")} /> : null}
      {createMutation.isError ? <MutationErrorAlert className="mb-4" error={createMutation.error} title={t("tournament.admin.staff.addFailed")} /> : null}
      {deleteMutation.isError ? <MutationErrorAlert className="mb-4" error={deleteMutation.error} title={t("tournament.admin.staff.removeFailed")} /> : null}

      {!staffQuery.isLoading ? (
        <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
          <Card className="self-start">
            <CardHeader>
              <CardTitle>{t("tournament.admin.staff.addStaff")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="staff-user-search">{t("tournament.admin.staff.searchUser")}</Label>
                <div className="flex gap-2">
                  <Input
                    id="staff-user-search"
                    onChange={(event) => setSearchDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") setSearch(searchDraft.trim())
                    }}
                    placeholder={t("tournament.admin.staff.searchPlaceholder")}
                    value={searchDraft}
                  />
                  <Button onClick={() => setSearch(searchDraft.trim())} type="button" variant="outline">{t("tournament.admin.common.search")}</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff-user">{t("tournament.admin.staff.user")}</Label>
                <Select disabled={usersQuery.isLoading} onValueChange={setUserId} value={userId}>
                  <SelectTrigger className="w-full" id="staff-user">
                    <SelectValue placeholder={usersQuery.isLoading ? t("tournament.admin.staff.loadingUsers") : t("tournament.admin.staff.selectUser")} />
                  </SelectTrigger>
                  <SelectContent>
                    {(usersQuery.data?.data ?? []).map((user) => (
                      <SelectItem key={user.user_id} value={String(user.user_id)}>
                        {user.user_name} · {user.osu_uid ?? t("tournament.admin.staff.noOsu")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff-role">{t("tournament.admin.staff.role")}</Label>
                <Select onValueChange={(value) => setRole(value as TournamentStaffRole)} value={role}>
                  <SelectTrigger className="w-full" id="staff-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {staffRoles.map((staffRole) => (
                      <SelectItem key={staffRole} value={staffRole}>{t(`tournament.admin.staff.roles.${staffRole}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedUser ? (
                <div className="rounded-lg border bg-background p-3 text-sm">
                  <p className="font-medium">{selectedUser.user_name}</p>
                  <p className="text-muted-foreground">user #{selectedUser.user_id} · osu {selectedUser.osu_uid ?? "-"}</p>
                </div>
              ) : null}

              <Button className="w-full" disabled={!userId || createMutation.isPending} onClick={addStaff} type="button">
                <Plus className="size-4" weight="bold" />
                {createMutation.isPending ? t("tournament.admin.staff.adding") : t("tournament.admin.staff.addStaff")}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {staff.length === 0 ? <AppAlert title={t("tournament.admin.staff.noStaffTitle")}>{t("tournament.admin.staff.noStaffDescription")}</AppAlert> : null}
            {staffRoles.map((staffRole) => {
              const roleStaff = groupedStaff.get(staffRole) ?? []
              return (
                <Card key={staffRole}>
                  <CardHeader className="flex-row items-center justify-between">
                    <CardTitle>{t(`tournament.admin.staff.roles.${staffRole}`)}</CardTitle>
                    <Badge variant="outline">{roleStaff.length}</Badge>
                  </CardHeader>
                  <CardContent className="grid gap-2 md:grid-cols-2">
                    {roleStaff.length === 0 ? <p className="text-sm text-muted-foreground">{t("tournament.admin.staff.noRoleAssigned", { role: t(`tournament.admin.staff.roles.${staffRole}`).toLowerCase() })}</p> : null}
                    {roleStaff.map((staffItem) => (
                      <StaffCard
                        isDeleting={deleteMutation.isPending}
                        key={staffItem.id}
                        onDelete={() => {
                          deleteMutation.mutate(staffItem.id, {
                            onSuccess: () => toast.success(t("tournament.admin.staff.removed")),
                          })
                        }}
                        staff={staffItem}
                      />
                    ))}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ) : null}
    </AdminPage>
  )
}

function StaffCard({ isDeleting, onDelete, staff }: { isDeleting: boolean; onDelete: () => void; staff: TournamentStaff }) {
  const { t } = useTranslation()
  const name = staff.user?.user_name ?? t("tournament.common.user", { id: staff.user_id })

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="size-9">
          <AvatarImage src={staff.user?.avatar ?? undefined} />
          <AvatarFallback>{name.slice(0, 1)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <Link className="truncate font-medium hover:text-primary" to={`/user/${staff.user_id}`}>{name}</Link>
          <p className="text-xs text-muted-foreground">user #{staff.user_id}</p>
        </div>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button disabled={isDeleting} size="sm" type="button" variant="outline">
            <Trash className="size-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("tournament.admin.staff.removeTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("tournament.admin.staff.removeDescription", { name, role: staff.role })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("tournament.common.cancel")}</AlertDialogCancel>
            <AlertDialogAction disabled={isDeleting} onClick={onDelete} variant="destructive">
              {t("tournament.common.remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
