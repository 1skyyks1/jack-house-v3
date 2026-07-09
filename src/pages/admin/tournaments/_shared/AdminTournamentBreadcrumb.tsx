import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import type { Tournament } from "@/entities/tournament"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

type AdminTournamentBreadcrumbProps = {
  current?: string
  tournament?: Pick<Tournament, "acronym" | "id" | "name"> | null
  tournamentId?: string
}

export function AdminTournamentBreadcrumb({ current, tournament, tournamentId }: AdminTournamentBreadcrumbProps) {
  const { t } = useTranslation()
  const tournamentLabel = tournament?.acronym || tournament?.name || tournamentId
  const tournamentPath = tournament?.id || tournamentId ? `/admin/tournaments/${tournament?.id ?? tournamentId}/settings` : "/admin/tournaments"

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {current || tournamentLabel ? (
            <BreadcrumbLink asChild>
              <Link to="/admin/tournaments">{t("admin.nav.tournaments")}</Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage>{t("admin.nav.tournaments")}</BreadcrumbPage>
          )}
        </BreadcrumbItem>
        {tournamentLabel ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {current ? (
                <BreadcrumbLink asChild>
                  <Link to={tournamentPath}>{tournamentLabel}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{tournamentLabel}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </>
        ) : null}
        {current ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{current}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
