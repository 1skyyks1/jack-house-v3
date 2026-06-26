import { BracketsCurly, CalendarBlank, ChartBar, UsersThree } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router-dom"
import { getTournamentStatus, useTournamentDetailQuery, useTournamentSectionsQuery } from "@/entities/tournament"
import { hasAdminPermission } from "@/features/admin-permissions"
import { useCurrentUserQuery, usePermissionsQuery } from "@/features/auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { RichTextRenderer } from "@/features/rich-text/renderer"
import { AppAlert, getErrorMessage, PageState } from "@/shared/components"
import { formatDate } from "@/shared/lib/date"

export function TournamentDetailPage() {
  const { t } = useTranslation()
  const { tid } = useParams()
  const tournamentQuery = useTournamentDetailQuery(tid)
  const sectionsQuery = useTournamentSectionsQuery(tid)
  const currentUserQuery = useCurrentUserQuery()
  const permissionsQuery = usePermissionsQuery()

  if (tournamentQuery.isError) {
    return <PageState title={t("tournament.common.tournamentLoadFailed")} description={getErrorMessage(tournamentQuery.error)} />
  }

  if (tournamentQuery.isLoading || !tournamentQuery.data) {
    return <PageState title={t("tournament.common.loadingTournament")} description={t("tournament.common.loadingTournamentDescription")} />
  }

  const tournament = tournamentQuery.data
  const status = getTournamentStatus(tournament)
  const sections = sectionsQuery.data ?? []
  const rules = sections.find((section) => section.type === "rules")
  const currentUserId = currentUserQuery.data?.user_id
  const canManageTournament = hasAdminPermission(permissionsQuery.data?.adminPermissions, "tournaments")
    || Boolean(currentUserId && tournament.staff?.some((staff) => Number(staff.user_id) === Number(currentUserId)))
  const staffByRole = new Map<string, typeof tournament.staff>()
  for (const staff of tournament.staff ?? []) {
    const next = staffByRole.get(staff.role) ?? []
    next.push(staff)
    staffByRole.set(staff.role, next)
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-lg border bg-card">
        {tournament.banner ? (
          <img alt="" className="h-64 w-full object-cover" src={tournament.banner} />
        ) : null}
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">{tournament.acronym}</Badge>
            <Badge variant="outline">{t(`tournament.status.${status.key}`)}</Badge>
          </div>
          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="font-heading text-4xl font-semibold sm:text-5xl">{tournament.name}</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
                {tournament.desc_en || tournament.desc_zh || t("tournament.detail.fallbackDescription")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to={`/t/${tid}/bracket`}>
                  <BracketsCurly className="size-4" weight="bold" />
                  {t("tournament.common.bracket")}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to={`/t/${tid}/teams`}>
                  <UsersThree className="size-4" weight="bold" />
                  {t("tournament.common.teams")}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to={`/t/${tid}/qualifier`}>
                  <ChartBar className="size-4" weight="bold" />
                  {t("tournament.common.qualifier")}
                </Link>
              </Button>
              {canManageTournament ? (
                <Button asChild variant="secondary">
                  <Link to={`/admin/tournaments/${tournament.id}/settings`}>
                    {t("tournament.common.manage")}
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <InfoBlock label={t("tournament.common.registration")} value={`${formatDate(tournament.reg_start)} - ${formatDate(tournament.reg_end)}`} />
        <InfoBlock label={t("tournament.common.qualifier")} value={`${formatDate(tournament.qual_start)} - ${formatDate(tournament.qual_end)}`} />
        <InfoBlock label={t("tournament.common.teamSize")} value={`${tournament.team_size_min ?? 1} - ${tournament.team_size_max ?? 2}`} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-heading text-2xl font-semibold">{rules?.title ?? t("tournament.common.rules")}</h2>
            <CalendarBlank className="size-5 text-muted-foreground" />
          </div>
          <Separator className="my-4" />
          {rules?.content_html ? (
            <RichTextRenderer content={rules.content_html} />
          ) : (
            <AppAlert title={t("tournament.detail.rulesMissingTitle")}>{t("tournament.detail.rulesMissingDescription")}</AppAlert>
          )}
        </div>
        <aside className="rounded-lg border bg-card p-5">
          <h2 className="font-heading text-xl font-semibold">{t("tournament.common.staff")}</h2>
          <div className="mt-4 space-y-4">
            {Array.from(staffByRole.entries()).length > 0 ? Array.from(staffByRole.entries()).map(([role, staff]) => (
              <div key={role}>
                <p className="text-xs font-semibold uppercase text-muted-foreground">{role}</p>
                <div className="mt-2 space-y-1">
                  {(staff ?? []).map((item) => (
                    <Link className="block text-sm hover:text-primary" key={item.id} to={`/user/${item.user_id}`}>
                      {item.user?.user_name ?? t("tournament.common.user", { id: item.user_id })}
                    </Link>
                  ))}
                </div>
              </div>
            )) : <p className="text-sm text-muted-foreground">{t("tournament.common.noStaff")}</p>}
          </div>
        </aside>
      </section>
    </main>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </div>
  )
}
