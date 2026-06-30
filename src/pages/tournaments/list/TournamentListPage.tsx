import { ArrowRight, CalendarBlank, Trophy } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { useTournamentListQuery, getTournamentStatus } from "@/entities/tournament"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AppAlert, getErrorMessage, PageState } from "@/shared/components"
import { formatDate } from "@/shared/lib/date"
import { cn } from "@/lib/utils"

export function TournamentListPage() {
  const { t } = useTranslation()
  const tournamentsQuery = useTournamentListQuery()
  const tournaments = tournamentsQuery.data ?? []
  const heroTournament = tournaments.find((tournament) => tournament.banner)

  if (tournamentsQuery.isError) {
    return <PageState title={t("tournament.list.loadFailed")} description={getErrorMessage(tournamentsQuery.error)} />
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="relative min-h-[22rem] overflow-hidden rounded-lg border bg-card text-white">
        {heroTournament?.banner ? (
          <img alt="" className="absolute inset-0 size-full object-cover" src={heroTournament.banner} />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--muted)),hsl(var(--background)))]" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.06),rgba(0,0,0,0.82))]" />
        <div className="relative z-10 flex min-h-[22rem] flex-col justify-between p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <Badge className="w-fit gap-1 border-white/20 bg-black/35 text-white" variant="outline">
              <Trophy className="size-3.5" weight="bold" />
              {t("tournament.list.eyebrow")}
            </Badge>
            <Badge className="border-white/20 bg-black/35 text-white" variant="outline">
              {t("tournament.list.mainFormatValue")}
            </Badge>
          </div>
          <div className="max-w-3xl">
            {heroTournament?.acronym ? (
              <p className="text-xs font-semibold uppercase text-white/70">{heroTournament.acronym}</p>
            ) : null}
            <h1 className="mt-2 font-heading text-4xl font-semibold tracking-normal sm:text-5xl">
              {heroTournament?.name ?? t("tournament.list.title")}
            </h1>
            {heroTournament ? (
              <Button asChild className="mt-6 bg-white text-black hover:bg-white/90">
                <Link to={`/t/${heroTournament.acronym || heroTournament.id}`}>
                  {t("tournament.common.openTournament")}
                  <ArrowRight className="size-4" weight="bold" />
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </section>

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
                <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <span className="flex items-center gap-2">
                    <CalendarBlank className="size-4" />
                    {t("tournament.list.registrationRange", { start: formatDate(tournament.reg_start), end: formatDate(tournament.reg_end) })}
                  </span>
                  <span>{t("tournament.list.topN", { count: tournament.qual_top_n ?? 32 })}</span>
                </div>
                <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                  {t("tournament.common.openTournament")}
                  <ArrowRight className="size-4" weight="bold" />
                </span>
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
