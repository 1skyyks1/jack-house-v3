import { BracketsCurly, CalendarBlank, ChartBar, UsersThree } from "@phosphor-icons/react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router-dom"
import { getTournamentStatus, useTournamentDetailQuery, useTournamentQualMappoolQuery, useTournamentSectionsQuery, type TournamentSection, type TournamentStaff } from "@/entities/tournament"
import { hasAdminPermission } from "@/features/admin-permissions"
import { useCurrentUserQuery, usePermissionsQuery } from "@/features/auth"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { RichTextRenderer, RichTextToc } from "@/features/rich-text/renderer"
import type { TocItem } from "@/features/rich-text/model/types"
import { AppAlert, getErrorMessage, PageState } from "@/shared/components"
import { formatDate } from "@/shared/lib/date"
import { TournamentBreadcrumb } from "../_shared/TournamentBreadcrumb"
import { getTournamentHeroImage } from "../_shared/tournamentVisuals"

export function TournamentDetailPage() {
  const { i18n, t } = useTranslation()
  const { tid } = useParams()
  const [sectionTocItems, setSectionTocItems] = useState<Record<number, TocItem[]>>({})
  const tournamentQuery = useTournamentDetailQuery(tid)
  const sectionsQuery = useTournamentSectionsQuery(tid)
  const qualMappoolQuery = useTournamentQualMappoolQuery(tid)
  const currentUserQuery = useCurrentUserQuery()
  const permissionsQuery = usePermissionsQuery()
  const sections = useMemo(() => sectionsQuery.data ?? [], [sectionsQuery.data])
  const contentSections = useMemo(
    () => sections.map((section) => ({
      ...getLocalizedSectionContent(section, i18n.language),
      id: section.id,
      type: section.type,
    })).filter((section) => section.title || section.contentHtml),
    [i18n.language, sections],
  )
  const tocItems = useMemo(
    () => contentSections.flatMap((section) => [
      { depth: 2, id: getSectionAnchorId(section.id), text: section.title || section.type },
      ...(sectionTocItems[section.id] ?? []),
    ]),
    [contentSections, sectionTocItems],
  )
  const updateSectionToc = useCallback((sectionId: number, items: TocItem[]) => {
    setSectionTocItems((current) => {
      const existing = current[sectionId] ?? []
      if (existing.length === items.length && existing.every((item, index) => item.id === items[index]?.id && item.text === items[index]?.text && item.depth === items[index]?.depth)) {
        return current
      }
      return { ...current, [sectionId]: items }
    })
  }, [])

  if (tournamentQuery.isError) {
    return <PageState title={t("tournament.common.tournamentLoadFailed")} description={getErrorMessage(tournamentQuery.error)} />
  }

  if (tournamentQuery.isLoading || !tournamentQuery.data) {
    return <PageState title={t("tournament.common.loadingTournament")} description={t("tournament.common.loadingTournamentDescription")} />
  }

  const tournament = tournamentQuery.data
  const status = getTournamentStatus(tournament)
  const heroImage = getTournamentHeroImage(tournament, qualMappoolQuery.data ?? [])
  const description = i18n.language.startsWith("en")
    ? firstText(tournament.desc_en, tournament.desc_zh)
    : firstText(tournament.desc_zh, tournament.desc_en)
  const currentUserId = currentUserQuery.data?.user_id
  const canManageTournament = hasAdminPermission(permissionsQuery.data?.adminPermissions, "tournaments")
    || Boolean(currentUserId && tournament.staff?.some((staff) => Number(staff.user_id) === Number(currentUserId)))
  const staffByRole = new Map<string, TournamentStaff[]>()
  for (const staff of tournament.staff ?? []) {
    const next = staffByRole.get(staff.role) ?? []
    next.push(staff)
    staffByRole.set(staff.role, next)
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
      <TournamentBreadcrumb current={tournament.acronym || tournament.name} />

      <section className="relative min-h-[22rem] overflow-hidden rounded-lg border bg-card text-white">
        {heroImage ? (
          <img alt="" className="absolute inset-0 size-full object-cover" src={heroImage} />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--muted)),hsl(var(--background)))]" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05),rgba(0,0,0,0.84))]" />
        <div className="relative z-10 flex min-h-[22rem] flex-col justify-between p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="border-white/20 bg-black/35 text-white" variant="outline">{tournament.acronym}</Badge>
            <Badge className="border-white/20 bg-black/35 text-white" variant="outline">{t(`tournament.status.${status.key}`)}</Badge>
          </div>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="min-w-0">
              <h1 className="max-w-4xl font-heading text-4xl font-semibold sm:text-5xl">{tournament.name}</h1>
              {description ? (
                <p className="mt-4 max-w-3xl text-base leading-7 text-white/82">
                  {description}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
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
                <Button asChild className="bg-white text-black hover:bg-white/90" variant="secondary">
                  <Link to={`/admin/tournaments/${tournament.id}/settings`}>
                    {t("tournament.common.manage")}
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <InfoBlock label={t("tournament.common.registration")} value={`${formatDate(tournament.reg_start)} - ${formatDate(tournament.reg_end)}`} />
        <InfoBlock label={t("tournament.common.qualifier")} value={`${formatDate(tournament.qual_start)} - ${formatDate(tournament.qual_end)}`} />
        <InfoBlock label={t("tournament.common.teamSize")} value={`${tournament.team_size_min ?? 1} - ${tournament.team_size_max ?? 2}`} />
      </section>

      <StaffSection entries={Array.from(staffByRole.entries())} />

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="space-y-4">
          {contentSections.length > 0 ? contentSections.map((section) => (
            <TournamentContentSection
              contentHtml={section.contentHtml}
              id={section.id}
              key={section.id}
              onTocChange={updateSectionToc}
              title={section.title || section.type}
            />
          )) : (
            <div className="rounded-lg border bg-card p-5">
              <AppAlert title={t("tournament.detail.rulesMissingTitle")} />
            </div>
          )}
        </div>
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <RichTextToc items={tocItems} />
          </div>
        </aside>
      </section>
    </main>
  )
}

function getSectionAnchorId(sectionId: number) {
  return `tournament-section-${sectionId}`
}

function TournamentContentSection({
  contentHtml,
  id,
  onTocChange,
  title,
}: {
  contentHtml: string
  id: number
  onTocChange: (sectionId: number, items: TocItem[]) => void
  title: string
}) {
  const handleTocChange = useCallback((items: TocItem[]) => {
    onTocChange(id, items)
  }, [id, onTocChange])

  return (
    <article className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-heading text-xl font-semibold" id={getSectionAnchorId(id)}>{title}</h2>
        <CalendarBlank className="size-5 text-muted-foreground" />
      </div>
      <Separator className="my-4" />
      <RichTextRenderer content={contentHtml} onTocChange={handleTocChange} />
    </article>
  )
}

function firstText(...values: Array<null | string | undefined>) {
  return values.map((value) => value?.trim()).find(Boolean) ?? ""
}

function getLocalizedSectionContent(section: TournamentSection | undefined, language: string) {
  if (!section) return { contentHtml: "", title: "" }

  if (language.startsWith("en")) {
    return {
      contentHtml: firstText(section.content_html_en, section.content_html_zh, section.content_html),
      title: firstText(section.title_en, section.title_zh, section.title),
    }
  }

  return {
    contentHtml: firstText(section.content_html_zh, section.content_html_en, section.content_html),
    title: firstText(section.title_zh, section.title_en, section.title),
  }
}

function StaffSection({ entries }: { entries: Array<[string, TournamentStaff[]]> }) {
  const { t } = useTranslation()

  return (
    <section className="rounded-lg border bg-card p-5">
      <h2 className="font-heading text-xl font-semibold">{t("tournament.common.staff")}</h2>
      {entries.length > 0 ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {entries.map(([role, staff]) => (
            <div key={role}>
              <p className="text-xs font-semibold uppercase text-muted-foreground">{role}</p>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-2">
                {staff.map((item) => (
                  <Link className="flex min-w-0 items-center gap-2 text-sm hover:text-primary" key={item.id} to={`/user/${item.user_id}`}>
                    <Avatar className="size-7">
                      <AvatarImage src={item.user?.avatar ?? undefined} />
                      <AvatarFallback>{(item.user?.user_name ?? "?").slice(0, 1)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{item.user?.user_name ?? t("tournament.common.user", { id: item.user_id })}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">{t("tournament.common.noStaff")}</p>
      )}
    </section>
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
