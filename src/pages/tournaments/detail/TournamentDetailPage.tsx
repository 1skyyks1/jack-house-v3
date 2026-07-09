import { BracketsCurly, CalendarBlank, ChartBar, ChatText, ClipboardText, Info, MapTrifold, Trophy, UsersThree } from "@phosphor-icons/react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router-dom"
import { useTournamentDetailQuery, useTournamentQualMappoolQuery, useTournamentSectionsQuery, type TournamentSection, type TournamentStaff } from "@/entities/tournament"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { RichTextRenderer, RichTextToc } from "@/features/rich-text/renderer"
import type { TocItem } from "@/features/rich-text/model/types"
import { AppAlert, getErrorMessage, PageState } from "@/shared/components"
import { TournamentBreadcrumb } from "../_shared/TournamentBreadcrumb"
import { getTournamentHeroImage, getTournamentPublicPath } from "../_shared/tournamentVisuals"

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
    return <PageState title={t("tournament.common.loadingTournament")} description={t("tournament.common.loadingTournamentDescription")} />
  }

  const tournament = tournamentQuery.data
  const publicTournamentPath = getTournamentPublicPath(tournament)
  const heroImage = getTournamentHeroImage(tournament, qualMappoolQuery.data ?? [])
  const description = i18n.language.startsWith("en")
    ? firstText(tournament.desc_en, tournament.desc_zh)
    : firstText(tournament.desc_zh, tournament.desc_en)
  const staffByRole = new Map<string, TournamentStaff[]>()
  for (const staff of tournament.staff ?? []) {
    const next = staffByRole.get(staff.role) ?? []
    next.push(staff)
    staffByRole.set(staff.role, next)
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <TournamentBreadcrumb current={tournament.acronym || tournament.name} />

      <section className="relative min-h-[22rem] overflow-hidden rounded-lg border bg-card text-white">
        {heroImage ? (
          <img alt="" className="absolute inset-0 size-full object-cover" src={heroImage} />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--muted)),hsl(var(--background)))]" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05),rgba(0,0,0,0.84))]" />
        <div className="relative z-10 flex min-h-[22rem] flex-col justify-end p-6 sm:p-8">
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
                <Link to={`${publicTournamentPath}/bracket`}>
                  <BracketsCurly className="size-4" weight="bold" />
                  {t("tournament.common.schedule")}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to={`${publicTournamentPath}/mappool`}>
                  <MapTrifold className="size-4" weight="bold" />
                  {t("tournament.common.mappool")}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to={`${publicTournamentPath}/leaderboard`}>
                  <Trophy className="size-4" weight="bold" />
                  {t("tournament.common.leaderboard")}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to={`${publicTournamentPath}/teams`}>
                  <UsersThree className="size-4" weight="bold" />
                  {t("tournament.common.teams")}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to={`${publicTournamentPath}/qualifier`}>
                  <ChartBar className="size-4" weight="bold" />
                  {t("tournament.common.qualifier")}
                </Link>
              </Button>
            </div>
          </div>
        </div>
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
              type={section.type}
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
  type,
}: {
  contentHtml: string
  id: number
  onTocChange: (sectionId: number, items: TocItem[]) => void
  title: string
  type: string
}) {
  const handleTocChange = useCallback((items: TocItem[]) => {
    onTocChange(id, items)
  }, [id, onTocChange])

  return (
    <article className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-heading text-xl font-semibold" id={getSectionAnchorId(id)}>{title}</h2>
        <SectionTypeIcon type={type} />
      </div>
      <Separator className="my-4" />
      <RichTextRenderer content={contentHtml} onTocChange={handleTocChange} />
    </article>
  )
}

function SectionTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "description":
      return <Info className="size-5 text-muted-foreground" weight="bold" />
    case "faq":
      return <ChatText className="size-5 text-muted-foreground" weight="bold" />
    case "prize":
      return <Trophy className="size-5 text-muted-foreground" weight="bold" />
    case "rules":
      return <ClipboardText className="size-5 text-muted-foreground" weight="bold" />
    default:
      return <CalendarBlank className="size-5 text-muted-foreground" weight="bold" />
  }
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
