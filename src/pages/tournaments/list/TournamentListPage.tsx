import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { useTournamentListQuery, getTournamentStatus } from "@/entities/tournament"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AppAlert, getErrorMessage, PageState } from "@/shared/components"
import { cn } from "@/lib/utils"

export function TournamentListPage() {
  const { t } = useTranslation()
  const tournamentsQuery = useTournamentListQuery()
  const tournaments = tournamentsQuery.data ?? []

  if (tournamentsQuery.isError) {
    return <PageState title={t("tournament.list.loadFailed")} description={getErrorMessage(tournamentsQuery.error)} />
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 py-6 sm:px-6 lg:px-8">
      <header>
        <h1 className="font-heading text-3xl font-semibold">{t("tournament.list.title")}</h1>
      </header>

      {tournamentsQuery.isLoading ? <TournamentListSkeleton /> : null}
      {tournamentsQuery.data?.length === 0 ? (
        <AppAlert title={t("tournament.list.emptyTitle")}>{t("tournament.list.emptyDescription")}</AppAlert>
      ) : null}
      <section className="grid gap-4 md:grid-cols-2">
        {tournaments.map((tournament) => {
          const status = getTournamentStatus(tournament)

          return (
            <Link
              className="group overflow-hidden rounded-lg border bg-card transition hover:border-primary/40"
              key={tournament.id}
              to={`/t/${tournament.acronym || tournament.id}`}
            >
              {tournament.banner ? (
                <img alt="" className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.02]" src={tournament.banner} />
              ) : (
                <div className="h-44 bg-[linear-gradient(135deg,hsl(var(--muted)),hsl(var(--accent)))]" />
              )}
              <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{tournament.acronym}</p>
                    <h2 className="mt-1 font-heading text-2xl font-semibold">{tournament.name}</h2>
                  </div>
                  <Badge className={cn(status.tone === "success" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300")} variant="outline">
                    {t(`tournament.status.${status.key}`)}
                  </Badge>
                </div>
              </div>
            </Link>
          )
        })}
      </section>
    </main>
  )
}

function TournamentListSkeleton() {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="rounded-lg border bg-card p-4" key={index}>
          <Skeleton className="h-44 w-full rounded-md" />
          <Skeleton className="mt-5 h-7 w-2/3" />
          <Skeleton className="mt-3 h-4 w-full" />
        </div>
      ))}
    </section>
  )
}
