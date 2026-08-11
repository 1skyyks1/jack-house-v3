import { ArrowRight, CalendarBlank } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getTournamentStatus, useTournamentListQuery, type Tournament } from "@/entities/tournament"
import { cn } from "@/lib/utils"
import { AppAlert, getErrorMessage, PageState } from "@/shared/components"
import { formatDate } from "@/shared/lib/date"
import { getTournamentPublicPath } from "../_shared/tournamentVisuals"

export function TournamentListPage() {
  const { i18n, t } = useTranslation()
  const tournamentsQuery = useTournamentListQuery()
  const tournaments = tournamentsQuery.data ?? []

  if (tournamentsQuery.isError) {
    return <PageState title={t("tournament.list.loadFailed")} description={getErrorMessage(tournamentsQuery.error)} />
  }

  return (
    <main className="mx-auto w-full max-w-7xl pb-8 sm:pb-12">
      <h1 className="sr-only">{t("tournament.list.title")}</h1>
      <p className="mb-5 pt-1 text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground sm:mb-6 sm:pt-3">
        JACK HOUSE / {t("tournament.list.title")}
      </p>

      {tournamentsQuery.isLoading ? <TournamentListSkeleton /> : null}
      {tournamentsQuery.data?.length === 0 ? (
        <AppAlert title={t("tournament.list.emptyTitle")}>{t("tournament.list.emptyDescription")}</AppAlert>
      ) : null}
      <section className="grid gap-3 sm:gap-4 lg:grid-cols-12" aria-label={t("tournament.list.title")}>
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
      className={cn(
        "group relative isolate flex min-h-[24rem] min-w-0 overflow-hidden rounded-[1.75rem] bg-muted text-white ring-1 ring-black/5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "sm:min-h-[27rem] lg:min-h-[29rem]",
        index === 0 ? "lg:col-span-7" : index === 1 ? "lg:col-span-5" : "lg:col-span-6 lg:min-h-[23rem]",
      )}
      to={getTournamentPublicPath(tournament)}
    >
      {tournament.banner ? (
        <img
          alt=""
          className="absolute inset-0 -z-30 size-full object-cover transition duration-700 ease-out group-hover:scale-[1.035]"
          decoding="async"
          fetchPriority={index === 0 ? "high" : "auto"}
          loading={index === 0 ? "eager" : "lazy"}
          src={tournament.banner}
        />
      ) : (
        <div className="absolute inset-0 -z-30 bg-[radial-gradient(circle_at_80%_10%,hsl(var(--primary)/0.45),transparent_38%),linear-gradient(145deg,hsl(var(--muted)),hsl(var(--background)))]" />
      )}
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,rgba(4,7,16,0.12)_10%,rgba(4,7,16,0.38)_48%,rgba(4,7,16,0.94)_100%)] transition duration-500 group-hover:bg-[linear-gradient(180deg,rgba(4,7,16,0.06)_10%,rgba(4,7,16,0.3)_48%,rgba(4,7,16,0.92)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_38%)] opacity-0 transition duration-500 group-hover:opacity-100" />

      <div className="flex min-w-0 flex-1 flex-col justify-between p-5 sm:p-7 lg:p-8">
        <div className="flex items-start justify-between gap-3">
          <Badge className={statusBadgeClass(status.tone)} variant="outline">
            {t(`tournament.status.${status.key}`)}
          </Badge>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/16 bg-black/18 text-white/80 backdrop-blur-md transition duration-300 group-hover:border-white/30 group-hover:bg-white group-hover:text-black">
            <ArrowRight className="size-4 transition duration-300 group-hover:translate-x-0.5" weight="bold" />
          </span>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/58">{tournament.acronym}</p>
          <h2 className="mt-2 break-words font-heading text-3xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-4xl lg:text-[2.7rem]">
            {tournament.name}
          </h2>
          {description ? <p className="mt-3 line-clamp-2 max-w-xl text-sm leading-6 text-white/68 sm:text-base">{description}</p> : null}
          {registrationRange ? (
            <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-white/58 sm:items-center sm:text-sm">
              <CalendarBlank className="mt-0.5 size-4 shrink-0 sm:mt-0" weight="bold" />
              <span>{registrationRange}</span>
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  )
}

function TournamentListSkeleton() {
  return (
    <section className="grid gap-3 sm:gap-4 lg:grid-cols-12">
      {Array.from({ length: 2 }).map((_, index) => (
        <Skeleton
          className={cn(
            "min-h-[24rem] rounded-[1.75rem] sm:min-h-[27rem] lg:min-h-[29rem]",
            index === 0 ? "lg:col-span-7" : "lg:col-span-5",
          )}
          key={index}
        />
      ))}
    </section>
  )
}

function firstText(...values: Array<null | string | undefined>) {
  return values.map((value) => value?.trim()).find(Boolean) ?? ""
}

function statusBadgeClass(tone: ReturnType<typeof getTournamentStatus>["tone"]) {
  return cn(
    "shrink-0 border-white/16 px-3 py-1 text-white shadow-sm backdrop-blur-md",
    tone === "muted" && "bg-black/35 text-white/78",
    tone === "success" && "bg-emerald-700/55 text-emerald-50",
    tone === "info" && "bg-sky-700/55 text-sky-50",
    tone === "warning" && "bg-amber-700/55 text-amber-50",
  )
}
