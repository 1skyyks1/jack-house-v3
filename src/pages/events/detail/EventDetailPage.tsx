import { ChartBar, Trophy } from "@phosphor-icons/react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import {
  getEventStatus,
  useEventRankQuery,
  useEventStageRankQuery,
  useEventStagesQuery,
  useEventUserScoreQuery,
  useSubmitEventScoreMutation,
  type EventUserStageScore,
} from "@/entities/event"
import { useAuthStore } from "@/features/auth"
import { RichTextRenderer, RichTextToc } from "@/features/rich-text/renderer"
import type { TocItem } from "@/features/rich-text/model/types"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppAlert, getErrorMessage, PageState } from "@/shared/components"
import {
  EventDetailSkeleton,
  EventHero,
  EventRules,
  EventSummaryCard,
  LeaderboardCard,
  ScorePanel,
  StageCard,
  StageGrid,
} from "./sections"
import {
  EVENT_LEADERBOARD_PAGE_SIZE,
  HIGHLIGHTED_RANK_COUNT,
  SCORE_COOLDOWN_SECONDS,
  getEventCopy,
  getLeaderboardTotalPages,
  parseStageTab,
  type EventTab,
} from "./utils"

export function EventDetailPage() {
  const { eventId } = useParams()
  const { t } = useTranslation()
  const copy = getEventCopy(t)
  const isLogged = useAuthStore((state) => state.isLogged)
  const openLoginDialog = useAuthStore((state) => state.openLoginDialog)
  const [tab, setTab] = useState<EventTab>("overview")
  const [rankPage, setRankPage] = useState(1)
  const [tocItems, setTocItems] = useState<TocItem[]>([])
  const [cooldown, setCooldown] = useState(0)
  const stagesQuery = useEventStagesQuery(eventId)
  const userScoreQuery = useEventUserScoreQuery(eventId, isLogged)
  const rankQuerySize = HIGHLIGHTED_RANK_COUNT + rankPage * EVENT_LEADERBOARD_PAGE_SIZE
  const eventRankQuery = useEventRankQuery(eventId, { page: 1, pageSize: rankQuerySize })
  const topEventRankQuery = useEventRankQuery(eventId, { page: 1, pageSize: HIGHLIGHTED_RANK_COUNT })
  const activeStageIndex = parseStageTab(tab)
  const activeStage = typeof activeStageIndex === "number" ? stagesQuery.data?.data[activeStageIndex] : undefined
  const stageRankQuery = useEventStageRankQuery(activeStage?.id, { page: 1, pageSize: rankQuerySize })
  const topStageRankQuery = useEventStageRankQuery(activeStage?.id, { page: 1, pageSize: HIGHLIGHTED_RANK_COUNT })
  const submitScoreMutation = useSubmitEventScoreMutation(eventId ?? "")
  const stageScoresById = useMemo(() => {
    const map = new Map<number, EventUserStageScore>()
    userScoreQuery.data?.data.forEach((score) => map.set(score.stage_id, score))
    return map
  }, [userScoreQuery.data?.data])

  useEffect(() => {
    if (cooldown <= 0) return

    const timer = window.setInterval(() => {
      setCooldown((value) => Math.max(value - 1, 0))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [cooldown])

  if (!eventId) {
    return <PageState title={t("event.missingIdTitle")} description={t("event.missingIdDescription")} />
  }

  if (stagesQuery.isLoading) {
    return <EventDetailSkeleton />
  }

  if (stagesQuery.isError) {
    const message = stagesQuery.error instanceof Error ? stagesQuery.error.message : t("event.loadFailedDescription")
    return <PageState title={t("event.loadFailedTitle")} description={message} />
  }

  if (!stagesQuery.data?.event) {
    return <PageState title={t("event.notFoundTitle")} description={t("event.notFoundDescription")} />
  }

  const event = stagesQuery.data.event
  const stages = stagesQuery.data.data
  const status = getEventStatus(event)
  const canSubmitScore = cooldown <= 0 && !submitScoreMutation.isPending

  const submitScore = () => {
    if (!isLogged) {
      openLoginDialog(`/event/${eventId}`)
      return
    }

    if (!canSubmitScore) return

    setCooldown(SCORE_COOLDOWN_SECONDS)
    submitScoreMutation.mutate(undefined, {
      onError: (error) => {
        setCooldown(0)
        toast.error(getErrorMessage(error))
      },
      onSuccess: () => {
        toast.success(t("event.scoreRecorded"))
        void userScoreQuery.refetch()
      },
    })
  }

  return (
    <section className="space-y-6">
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">{t("common.home")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{event.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <EventHero event={event} status={status} copy={copy} />

      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(value as EventTab)
          setRankPage(1)
        }}
      >
        <div className="rounded-2xl border bg-card p-2">
          <TabsList className="h-auto max-w-full flex-wrap justify-start gap-2 bg-transparent p-0">
              <TabsTrigger value="overview">
                <ChartBar className="size-4" weight="bold" />
                {copy.overview}
              </TabsTrigger>
              <TabsTrigger value="leaderboard">
                <Trophy className="size-4" weight="bold" />
                {copy.leaderboard}
              </TabsTrigger>
              {stages.map((stage, index) => (
                <TabsTrigger key={stage.id} value={`stage-${index}`}>
                  {t("event.stageTab", { index: index + 1 })}
                </TabsTrigger>
              ))}
          </TabsList>
        </div>

        <TabsContent className="mt-6" value="overview">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="min-w-0 space-y-6">
              <ScorePanel
                copy={copy}
                cooldown={cooldown}
                isSubmitting={submitScoreMutation.isPending}
                onSubmitScore={submitScore}
                totalScore={userScoreQuery.data?.total}
              />
              {userScoreQuery.isError ? (
                <AppAlert tone="destructive">
                  {getErrorMessage(userScoreQuery.error)}
                </AppAlert>
              ) : null}
              <StageGrid copy={copy} scoresById={stageScoresById} stages={stages} />
              <Card>
                <CardHeader>
                  <CardTitle>{copy.desc}</CardTitle>
                </CardHeader>
                <CardContent>
                  <RichTextRenderer content={event.desc ?? ""} emptyLabel={t("event.noEventDetails")} onTocChange={setTocItems} />
                </CardContent>
              </Card>
            </div>

            <aside className="hidden xl:block">
              <div className="sticky top-24 space-y-4">
                <EventSummaryCard event={event} stageCount={stages.length} />
                <EventRules copy={copy} />
                <RichTextToc items={tocItems} />
              </div>
            </aside>
          </div>
        </TabsContent>

        <TabsContent className="mt-6" value="leaderboard">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="min-w-0">
              <LeaderboardCard
                copy={copy}
                error={eventRankQuery.error ?? topEventRankQuery.error}
                highlightedRows={topEventRankQuery.data?.data ?? []}
                isError={eventRankQuery.isError || topEventRankQuery.isError}
                isLoading={eventRankQuery.isLoading}
                page={rankPage}
                rows={eventRankQuery.data?.data ?? []}
                total={eventRankQuery.data?.total ?? 0}
                totalPages={getLeaderboardTotalPages(eventRankQuery.data?.total ?? 0)}
                type="event"
                onPageChange={setRankPage}
              />
            </div>
            <aside className="hidden xl:block">
              <div className="sticky top-24">
                <EventSummaryCard event={event} stageCount={stages.length} />
              </div>
            </aside>
          </div>
        </TabsContent>

        {stages.map((stage, index) => (
          <TabsContent className="mt-6" key={stage.id} value={`stage-${index}`}>
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
              <div className="min-w-0 space-y-4">
                <StageCard stage={stage} />
                <LeaderboardCard
                  copy={copy}
                  error={activeStage?.id === stage.id ? stageRankQuery.error ?? topStageRankQuery.error : null}
                  highlightedRows={activeStage?.id === stage.id ? topStageRankQuery.data?.data ?? [] : []}
                  isError={activeStage?.id === stage.id ? stageRankQuery.isError || topStageRankQuery.isError : false}
                  isLoading={stageRankQuery.isLoading}
                  page={rankPage}
                  rows={activeStage?.id === stage.id ? stageRankQuery.data?.data ?? [] : []}
                  total={activeStage?.id === stage.id ? stageRankQuery.data?.total ?? 0 : 0}
                  totalPages={activeStage?.id === stage.id ? getLeaderboardTotalPages(stageRankQuery.data?.total ?? 0) : 0}
                  type="stage"
                  onPageChange={setRankPage}
                />
              </div>
              <aside className="hidden xl:block">
                <div className="sticky top-24">
                  <EventSummaryCard event={event} stageCount={stages.length} />
                </div>
              </aside>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  )
}
