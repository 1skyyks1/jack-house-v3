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
import { getTournamentPublicPath } from "./tournamentVisuals"

type TournamentBreadcrumbProps = {
  current: string
  tournament?: Pick<Tournament, "acronym" | "id" | "name"> | null
  tournamentId?: string
  trail?: Array<{
    label: string
    to: string
  }>
}

export function TournamentBreadcrumb({ current, tournament, tournamentId, trail = [] }: TournamentBreadcrumbProps) {
  const { t } = useTranslation()
  const tournamentPath = tournament ? getTournamentPublicPath(tournament) : tournamentId ? `/t/${tournamentId}` : "/t"
  const tournamentLabel = tournament?.acronym || tournament?.name

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/t">{t("tournament.common.tournaments")}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {tournamentLabel ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={tournamentPath}>{tournamentLabel}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        ) : null}
        {trail.map((item) => (
          <BreadcrumbSegment key={item.to} label={item.label} to={item.to} />
        ))}
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{current}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

function BreadcrumbSegment({ label, to }: { label: string; to: string }) {
  return (
    <>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink asChild>
          <Link to={to}>{label}</Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
    </>
  )
}
