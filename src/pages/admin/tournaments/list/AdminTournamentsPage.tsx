import type { ColumnDef } from "@tanstack/react-table"
import { ChartBar, ClockCounterClockwise, GearSix, Plus, Trophy, UsersThree } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { getTournamentStatus, useTournamentListQuery, type Tournament } from "@/entities/tournament"
import { AdminPage, AdminTable } from "@/features/admin-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getErrorMessage, PageState } from "@/shared/components"
import { formatDate } from "@/shared/lib/date"
import { getTournamentPublicPath } from "@/pages/tournaments/_shared/tournamentVisuals"
import { AdminTournamentBreadcrumb } from "../_shared/AdminTournamentBreadcrumb"

function useColumns(): Array<ColumnDef<Tournament>> {
  const { t } = useTranslation()

  return [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "name",
    cell: ({ row }) => (
      <div>
        <Link className="font-medium hover:underline" to={getTournamentPublicPath(row.original)}>{row.original.name}</Link>
        <p className="text-xs text-muted-foreground">{row.original.acronym}</p>
      </div>
    ),
    header: t("tournament.admin.list.tournament"),
  },
  {
    cell: ({ row }) => {
      const status = getTournamentStatus(row.original)
      return <Badge variant="outline">{t(`tournament.status.${status.key}`)}</Badge>
    },
    header: t("tournament.admin.list.status"),
  },
  {
    cell: ({ row }) => `${formatDate(row.original.reg_start)} - ${formatDate(row.original.reg_end)}`,
    header: t("tournament.common.registration"),
  },
  {
    cell: ({ row }) => row.original.qual_top_n ?? 32,
    header: t("tournament.admin.list.top"),
  },
  {
    cell: ({ row }) => (
      <div className="flex justify-end gap-2">
        <Button asChild size="sm" variant="outline">
          <Link to={`/admin/tournaments/${row.original.id}/settings`}>
            <GearSix className="size-4" />
            {t("tournament.admin.common.settings")}
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link to={`/admin/tournaments/${row.original.id}/teams`}>
            <UsersThree className="size-4" />
            {t("tournament.common.teams")}
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link to={`/admin/tournaments/${row.original.id}/qualifier`}>
            <ChartBar className="size-4" />
            {t("tournament.common.qualifier")}
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link to={`/admin/tournaments/${row.original.id}/audit`}>
            <ClockCounterClockwise className="size-4" />
            {t("tournament.admin.common.audit")}
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link to={`/admin/tournaments/${row.original.id}/bracket`}>
            <Trophy className="size-4" />
            {t("tournament.common.schedule")}
          </Link>
        </Button>
      </div>
    ),
    header: () => <span className="block text-right">{t("tournament.admin.common.actions")}</span>,
    id: "actions",
  },
  ]
}

export function AdminTournamentsPage() {
  const { t } = useTranslation()
  const columns = useColumns()
  const tournamentsQuery = useTournamentListQuery()

  if (tournamentsQuery.isError) {
    return <PageState title={t("tournament.admin.common.tournamentLoadFailed")} description={getErrorMessage(tournamentsQuery.error)} />
  }

  return (
    <AdminPage
      actions={(
        <Button asChild type="button">
          <Link to="/admin/tournaments/new">
            <Plus className="size-4" weight="bold" />
            {t("tournament.admin.list.newTournament")}
          </Link>
        </Button>
      )}
      breadcrumb={<AdminTournamentBreadcrumb />}
    >
      <AdminTable
        columns={columns}
        data={tournamentsQuery.data ?? []}
        emptyLabel={t("tournament.admin.list.noTournaments")}
        isLoading={tournamentsQuery.isLoading}
      />
    </AdminPage>
  )
}
