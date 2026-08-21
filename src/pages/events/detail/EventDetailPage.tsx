import { Article, ChartBar, Trophy } from "@phosphor-icons/react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppAlert, getErrorMessage, PageState } from "@/shared/components"
import {
  EventDetailSkeleton,
  EventHero,
  EventRules,
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
  const [eventRankBatch, setEventRankBatch] = useState(1)
  const [stageRankBatch, setStageRankBatch] = useState(1)
  const [tocItems, setTocItems] = useState<TocItem[]>([])
  const [cooldown, setCooldown] = useState(0)
  const stagesQuery = useEventStagesQuery(eventId)
  const userScoreQuery = useEventUserScoreQuery(eventId, isLogged)
  const eventRankQuerySize = HIGHLIGHTED_RANK_COUNT + eventRankBatch * EVENT_LEADERBOARD_PAGE_SIZE
  const stageRankQuerySize = HIGHLIGHTED_RANK_COUNT + stageRankBatch * EVENT_LEADERBOARD_PAGE_SIZE
  const eventRankQuery = useEventRankQuery(eventId, { page: 1, pageSize: eventRankQuerySize })
  const topEventRankQuery = useEventRankQuery(eventId, { page: 1, pageSize: HIGHLIGHTED_RANK_COUNT })
  const activeStageIndex = parseStageTab(tab)
  const activeStage = typeof activeStageIndex === "number" ? stagesQuery.data?.data[activeStageIndex] : undefined
  const stageRankQuery = useEventStageRankQuery(activeStage?.id, { page: 1, pageSize: stageRankQuerySize })
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
      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(value as EventTab)
          setStageRankBatch(1)
        }}
      >
        <EventHero
          copy={copy}
          event={event}
          status={status}
          navigation={(
            <TabsList className="h-auto w-max min-w-full flex-nowrap justify-start gap-2 bg-transparent p-0">
              <TabsTrigger className="flex-none shrink-0" value="overview">
                <ChartBar className="size-4" weight="bold" />
                {copy.overview}
              </TabsTrigger>
              <TabsTrigger className="flex-none shrink-0" value="leaderboard">
                <Trophy className="size-4" weight="bold" />
                {copy.leaderboard}
              </TabsTrigger>
              {stages.map((stage, index) => (
                <TabsTrigger className="flex-none shrink-0" key={stage.id} value={`stage-${index}`}>
                  {t("event.stageTab", { index: index + 1 })}
                </TabsTrigger>
              ))}
            </TabsList>
          )}
        />

        <TabsContent className="mt-4" value="overview">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="min-w-0 space-y-4">
              <section className="space-y-4">
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
              </section>
              <section className="border-t pt-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <Article className="size-4" weight="bold" />
                  </div>
                  <h2 className="font-heading text-lg font-semibold">{copy.desc}</h2>
                </div>
                <div className="mt-3">
                  <RichTextRenderer content={event.desc ?? ""} emptyLabel={t("event.noEventDetails")} onTocChange={setTocItems} />
                </div>
              </section>
            </div>

            <aside className="hidden xl:block">
              <div className="sticky top-24 space-y-4">
                <EventRules copy={copy} />
                {tocItems.length > 0 ? <RichTextToc items={tocItems} /> : null}
              </div>
            </aside>
          </div>
        </TabsContent>

        <TabsContent className="mt-4" value="leaderboard">
          <LeaderboardCard
            copy={copy}
            error={eventRankQuery.error ?? topEventRankQuery.error}
            highlightedRows={topEventRankQuery.data?.data ?? []}
            isError={eventRankQuery.isError || topEventRankQuery.isError}
            isLoading={eventRankQuery.isLoading}
            isLoadingMore={eventRankQuery.isFetching && !eventRankQuery.isLoading}
            hasMore={(eventRankQuery.data?.data.length ?? 0) < (eventRankQuery.data?.total ?? 0)}
            onLoadMore={() => setEventRankBatch((batch) => batch + 1)}
            rows={eventRankQuery.data?.data ?? []}
            type="event"
          />
        </TabsContent>

        {stages.map((stage, index) => (
          <TabsContent className="mt-4" key={stage.id} value={`stage-${index}`}>
            <div className="min-w-0 space-y-4">
              <StageCard stage={stage} />
              <LeaderboardCard
                copy={copy}
                error={activeStage?.id === stage.id ? stageRankQuery.error ?? topStageRankQuery.error : null}
                highlightedRows={activeStage?.id === stage.id ? topStageRankQuery.data?.data ?? [] : []}
                isError={activeStage?.id === stage.id ? stageRankQuery.isError || topStageRankQuery.isError : false}
                isLoading={stageRankQuery.isLoading}
                isLoadingMore={stageRankQuery.isFetching && !stageRankQuery.isLoading}
                hasMore={(stageRankQuery.data?.data.length ?? 0) < (stageRankQuery.data?.total ?? 0)}
                onLoadMore={() => setStageRankBatch((batch) => batch + 1)}
                rows={activeStage?.id === stage.id ? stageRankQuery.data?.data ?? [] : []}
                type="stage"
              />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  )
}
