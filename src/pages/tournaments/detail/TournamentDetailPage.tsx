import { BracketsCurly, CalendarBlank, ChartBar, ChartLineUp, ChatText, ClipboardText, Info, MapTrifold, Trophy, UsersThree } from "@phosphor-icons/react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router-dom"
import { TOURNAMENT_STAFF_ROLES, useTournamentDetailQuery, useTournamentQualMappoolQuery, useTournamentSectionsQuery, type TournamentSection, type TournamentStaff } from "@/entities/tournament"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RichTextRenderer, RichTextToc } from "@/features/rich-text/renderer"
import type { TocItem } from "@/features/rich-text/model/types"
import { AppAlert, DetailPageSkeleton, getErrorMessage, PageState } from "@/shared/components"
import { cn } from "@/lib/utils"
import { TournamentBreadcrumb } from "../_shared/TournamentBreadcrumb"
import { getTournamentHeroImage, getTournamentPublicPath } from "../_shared/tournamentVisuals"
import { TournamentPageHeader, type TournamentNavigationItem } from "./TournamentPageHeader"
import "./tournament-detail.css"

export function TournamentDetailPage() {
  const { i18n, t } = useTranslation()
  const { tid } = useParams()
  const [sectionTocItems, setSectionTocItems] = useState<Record<number, TocItem[]>>({})
  const tournamentQuery = useTournamentDetailQuery(tid)
  const sectionsQuery = useTournamentSectionsQuery(tid)
  const qualMappoolQuery = useTournamentQualMappoolQuery(tid)
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
    return <DetailPageSkeleton />
  }

  const tournament = tournamentQuery.data
  const publicTournamentPath = getTournamentPublicPath(tournament)
  const heroImage = getTournamentHeroImage(tournament, qualMappoolQuery.data ?? [])
  const description = i18n.language.startsWith("en")
    ? firstText(tournament.desc_en, tournament.desc_zh)
    : firstText(tournament.desc_zh, tournament.desc_en)
  const staffByRole = new Map<string, TournamentStaff[]>()
  for (const staff of tournament.staff ?? []) {
    staffByRole.set(staff.role, [...(staffByRole.get(staff.role) ?? []), staff])
  }
  const staffEntries = Array.from(staffByRole.entries()).sort(([left], [right]) => roleSortIndex(left) - roleSortIndex(right))
  const navigationItems: TournamentNavigationItem[] = [
    { href: `${publicTournamentPath}/bracket`, icon: BracketsCurly, label: t("tournament.common.schedule") },
    { href: `${publicTournamentPath}/mappool`, icon: MapTrifold, label: t("tournament.common.mappool") },
    { href: `${publicTournamentPath}/leaderboard`, icon: Trophy, label: t("tournament.common.leaderboard") },
    { href: `${publicTournamentPath}/performance`, icon: ChartLineUp, label: t("tournament.common.performance") },
    { href: `${publicTournamentPath}/teams`, icon: UsersThree, label: t("tournament.common.teams") },
    { href: `${publicTournamentPath}/qualifier`, icon: ChartBar, label: t("tournament.common.qualifier") },
  ]

  return (
    <main className="tournament-detail-page mx-auto flex w-full max-w-7xl flex-col">
      <div className="mb-4">
        <TournamentBreadcrumb current={tournament.acronym || tournament.name} />
      </div>

      <TournamentPageHeader
        acronym={tournament.acronym}
        description={description}
        heroImage={heroImage}
        name={tournament.name}
        navigationItems={navigationItems}
        navigationLabel={t("tournament.common.tournament")}
      />

      <StaffSection entries={staffEntries} />

      <section className={cn(tocItems.length > 0 && "grid gap-12 lg:grid-cols-[minmax(0,1fr)_17rem]")}>
        <div>
          {contentSections.length > 0 ? contentSections.map((section) => (
            <TournamentContentSection
              contentHtml={section.contentHtml}
              id={section.id}
              key={section.id}
              onTocChange={updateSectionToc}
              title={section.title || section.type}
              type={section.type}
            />
          )) : (
            <div className="py-10">
              <AppAlert title={t("tournament.detail.rulesMissingTitle")} />
            </div>
          )}
        </div>
        {tocItems.length > 0 ? (
          <aside className="hidden py-10 lg:block">
            <div className="tournament-detail-toc sticky pl-4">
              <RichTextToc items={tocItems} />
            </div>
          </aside>
        ) : null}
      </section>
    </main>
  )
}

function TournamentContentSection({ contentHtml, id, onTocChange, title, type }: {
  contentHtml: string
  id: number
  onTocChange: (sectionId: number, items: TocItem[]) => void
  title: string
  type: string
}) {
  const handleTocChange = useCallback((items: TocItem[]) => onTocChange(id, items), [id, onTocChange])
  return (
    <article className="py-10 sm:py-12">
      <div className="mb-7 flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <SectionTypeIcon type={type} />
        </span>
        <h2 className="tournament-detail-anchor font-heading text-2xl font-semibold tracking-tight" id={getSectionAnchorId(id)}>{title}</h2>
      </div>
      <RichTextRenderer className="tournament-detail-rich-text" content={contentHtml} onTocChange={handleTocChange} />
    </article>
  )
}

function StaffSection({ entries }: { entries: Array<[string, TournamentStaff[]]> }) {
  const { t } = useTranslation()
  return (
    <section aria-labelledby="tournament-staff-heading" className="py-9 sm:py-11">
      <div className="mb-5">
        <h2 className="font-heading text-2xl font-semibold" id="tournament-staff-heading">{t("tournament.common.staff")}</h2>
      </div>
      {entries.length > 0 ? (
        <div className="space-y-5">
          {entries.map(([role, staff]) => (
            <div className="sm:grid sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-start sm:gap-5" key={role}>
              <p className="pt-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t(`tournament.admin.staff.roles.${role}`)}</p>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3 sm:mt-0">
                {staff.map((item) => (
                  <Link className="flex min-w-0 items-center gap-2.5 text-sm transition hover:text-primary" key={item.id} to={`/user/${item.user_id}`}>
                    <Avatar className="size-7">
                      <AvatarImage src={item.user?.avatar ?? undefined} />
                      <AvatarFallback>{(item.user?.user_name ?? "?").slice(0, 1)}</AvatarFallback>
                    </Avatar>
                    <span className="whitespace-nowrap">{item.user?.user_name ?? t("tournament.common.user", { id: item.user_id })}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-muted-foreground">{t("tournament.common.noStaff")}</p>}
    </section>
  )
}

function SectionTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "description": return <Info className="size-4" weight="bold" />
    case "faq": return <ChatText className="size-4" weight="bold" />
    case "prize": return <Trophy className="size-4" weight="bold" />
    case "rules": return <ClipboardText className="size-4" weight="bold" />
    default: return <CalendarBlank className="size-4" weight="bold" />
  }
}

function getSectionAnchorId(sectionId: number) {
  return `tournament-section-${sectionId}`
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

function roleSortIndex(role: string) {
  const index = TOURNAMENT_STAFF_ROLES.indexOf(role as typeof TOURNAMENT_STAFF_ROLES[number])
  return index === -1 ? TOURNAMENT_STAFF_ROLES.length : index
}
