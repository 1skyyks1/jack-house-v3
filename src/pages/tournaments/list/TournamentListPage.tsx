import { ArrowUpRight, CalendarBlank } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { useTournamentListQuery, getTournamentStatus, type Tournament } from "@/entities/tournament"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AppAlert, getErrorMessage, PageState } from "@/shared/components"
import { formatDate } from "@/shared/lib/date"
import { cn } from "@/lib/utils"
import { getTournamentPublicPath } from "../_shared/tournamentVisuals"

export function TournamentListPage() {
  const { i18n, t } = useTranslation()
  const tournamentsQuery = useTournamentListQuery()
  const tournaments = tournamentsQuery.data ?? []

  if (tournamentsQuery.isError) {
    return <PageState title={t("tournament.list.loadFailed")} description={getErrorMessage(tournamentsQuery.error)} />
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col">
      <h1 className="sr-only">{t("tournament.list.title")}</h1>

      {tournamentsQuery.isLoading ? <TournamentListSkeleton /> : null}
      {tournamentsQuery.data?.length === 0 ? (
        <AppAlert title={t("tournament.list.emptyTitle")}>{t("tournament.list.emptyDescription")}</AppAlert>
      ) : null}
      <section className="space-y-4" aria-label={t("tournament.list.title")}>
        {tournaments.map((tournament, index) => (
          <TournamentListItem
            index={index}
            key={tournament.id}
            language={i18n.language}
            tournament={tournament}
          />
        ))}
      </section>
    </main>
  )
}

function TournamentListItem({ index, language, tournament }: { index: number; language: string; tournament: Tournament }) {
  const { t } = useTranslation()
  const status = getTournamentStatus(tournament)
  const description = language.startsWith("en")
    ? firstText(tournament.desc_en, tournament.desc_zh)
    : firstText(tournament.desc_zh, tournament.desc_en)
  const registrationRange = tournament.reg_start && tournament.reg_end
    ? t("tournament.list.registrationRange", { start: formatDate(tournament.reg_start), end: formatDate(tournament.reg_end) })
    : null

  return (
    <Link
      className="group grid gap-5 rounded-3xl p-2 transition hover:bg-muted/35 sm:p-3 md:grid-cols-[minmax(16rem,0.44fr)_minmax(0,1fr)] md:items-center md:gap-8"
      to={getTournamentPublicPath(tournament)}
    >
      <div className="relative aspect-[16/8.5] overflow-hidden rounded-2xl bg-muted md:aspect-[16/9]">
        {tournament.banner ? (
          <img
            alt=""
            className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-[1.025]"
            decoding="async"
            fetchPriority={index === 0 ? "high" : "auto"}
            loading={index === 0 ? "eager" : "lazy"}
            src={tournament.banner}
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.3),transparent_45%),linear-gradient(135deg,hsl(var(--muted)),hsl(var(--accent)))]" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_50%,rgba(4,7,16,0.48))]" />
        <p className="absolute bottom-4 left-4 text-xs font-semibold uppercase tracking-[0.22em] text-white/75 md:hidden">{tournament.acronym}</p>
      </div>

      <div className="min-w-0 px-2 pb-3 md:px-0 md:py-5 md:pr-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="hidden text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground md:block">{tournament.acronym}</p>
            <h2 className="font-heading text-2xl font-semibold tracking-tight md:mt-2 md:text-3xl">{tournament.name}</h2>
          </div>
          <Badge className={statusBadgeClass(status.tone)} variant="outline">
            {t(`tournament.status.${status.key}`)}
          </Badge>
        </div>

        {description ? <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">{description}</p> : null}

        <div className="mt-5 flex items-center justify-between gap-4 text-sm text-muted-foreground">
          {registrationRange ? (
            <span className="flex min-w-0 items-center gap-2">
              <CalendarBlank className="size-4 shrink-0" weight="bold" />
              <span className="truncate">{registrationRange}</span>
            </span>
          ) : <span />}
          <ArrowUpRight className="size-5 shrink-0 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" weight="bold" />
        </div>
      </div>
    </Link>
  )
}

function TournamentListSkeleton() {
  return (
    <section className="space-y-4">
      {Array.from({ length: 2 }).map((_, index) => (
        <div className="grid gap-5 rounded-3xl p-2 sm:p-3 md:grid-cols-[minmax(16rem,0.44fr)_minmax(0,1fr)] md:items-center md:gap-8" key={index}>
          <Skeleton className="aspect-[16/8.5] w-full rounded-2xl md:aspect-[16/9]" />
          <div className="space-y-4 px-2 pb-3 md:px-0 md:py-5 md:pr-5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        </div>
      ))}
    </section>
  )
}

function firstText(...values: Array<null | string | undefined>) {
  return values.map((value) => value?.trim()).find(Boolean) ?? ""
}

function statusBadgeClass(tone: ReturnType<typeof getTournamentStatus>["tone"]) {
  return cn(
    "shrink-0",
    tone === "success" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    tone === "info" && "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    tone === "warning" && "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  )
}
