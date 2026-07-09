import { useEffect, useMemo, useState } from "react"
import { ArrowSquareOut, MapTrifold } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import {
  useTournamentDetailQuery,
  useTournamentRoundsQuery,
  type TournamentMappoolMap,
} from "@/entities/tournament"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { AppAlert, getErrorMessage, PageState } from "@/shared/components"
import { TournamentBreadcrumb } from "../_shared/TournamentBreadcrumb"
import { groupRoundsByMainStage, type StageRoundGroup } from "../_shared/tournamentRoundStages"
import { buildMappoolLabelMap, getMappoolLabel, sortMappoolMaps } from "../_shared/tournamentMappool"
import { getTournamentMapCoverUrl, getTournamentPublicPath } from "../_shared/tournamentVisuals"

export function TournamentMappoolPage() {
  const { t } = useTranslation()
  const { tid } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const tournamentQuery = useTournamentDetailQuery(tid)
  const roundsQuery = useTournamentRoundsQuery(tid)
  const mappoolStages = useMemo(() => groupRoundsByMainStage(roundsQuery.data ?? []).filter((stage) => stage.maps.length > 0), [roundsQuery.data])

  useEffect(() => {
    if (!tournamentQuery.data) return
    const canonicalPath = `${getTournamentPublicPath(tournamentQuery.data)}/mappool`
    if (location.pathname !== canonicalPath) {
      navigate(`${canonicalPath}${location.hash}`, { replace: true })
    }
  }, [location.hash, location.pathname, navigate, tournamentQuery.data])

  if (tournamentQuery.isError || roundsQuery.isError) {
    return <PageState title={t("tournament.mappool.loadFailed")} description={getErrorMessage(tournamentQuery.error ?? roundsQuery.error)} />
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <div>
        <TournamentBreadcrumb current={t("tournament.common.mappool")} tournament={tournamentQuery.data} tournamentId={tid} />
      </div>

      <MainStageMappoolTabs isLoading={roundsQuery.isLoading} stages={mappoolStages} />
    </main>
  )
}

function MainStageMappoolTabs({ isLoading, stages }: { isLoading: boolean; stages: StageRoundGroup[] }) {
  const { t } = useTranslation()
  const [activeStage, setActiveStage] = useState<string>("")
  const selectedStage = stages.find((stage) => stage.key === activeStage) ?? stages[0]

  useEffect(() => {
    function syncStageFromHash() {
      const hashStage = window.location.hash.slice(1).trim().toLowerCase()
      if (stages.some((stage) => stage.key === hashStage)) {
        setActiveStage(hashStage)
      }
    }

    syncStageFromHash()
    window.addEventListener("hashchange", syncStageFromHash)
    return () => window.removeEventListener("hashchange", syncStageFromHash)
  }, [stages])

  if (isLoading) {
    return (
      <section className="py-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapTrifold className="size-5" weight="bold" />
          {t("tournament.qualifier.loadingMaps")}
        </div>
      </section>
    )
  }

  if (stages.length === 0 || !selectedStage) {
    return <AppAlert title={t("tournament.mappool.emptyTitle")}>{t("tournament.mappool.emptyDescription")}</AppAlert>
  }

  return (
    <section>
      <Tabs value={selectedStage.key} onValueChange={(value) => {
        setActiveStage(value)
        if (window.location.hash.slice(1).toLowerCase() !== value) {
          window.location.hash = value
        }
      }}>
        <div className="-mx-1 overflow-x-auto overflow-y-visible px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList className="max-w-none flex-nowrap justify-start gap-2 overflow-visible rounded-none bg-transparent p-0">
            {stages.map((stage) => (
              <TabsTrigger className="shrink-0 flex-none border bg-background data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" key={stage.key} value={stage.key}>
                {stage.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      <div className="mt-4 space-y-3">
        {groupMappoolMapsForStage(selectedStage.maps).map((group) => (
          <div className={getMappoolGroupGridClass(group.maps.length)} key={group.key}>
            {group.maps.map(({ label, map }) => (
              <MainStageMapCard key={map.id} label={label} map={map} />
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

function MainStageMapCard({ label, map }: { label: string; map: TournamentMappoolMap }) {
  const coverUrl = getTournamentMapCoverUrl(map)

  return (
    <a
      className="group relative block h-28 overflow-hidden rounded-md border bg-muted text-white transition hover:border-primary/50"
      href={`https://osu.ppy.sh/beatmaps/${map.map_id}`}
      rel="noreferrer"
      target="_blank"
    >
      {coverUrl ? (
        <img alt="" className="absolute inset-0 size-full object-cover transition duration-300 group-hover:scale-[1.03]" src={coverUrl} />
      ) : null}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.82))]" />
      <div className="relative z-10 flex h-full flex-col justify-between p-3">
        <div className="flex items-start justify-between gap-3">
          <Badge className="border-white/20 bg-black/35 text-white" variant="outline">
            {label}
          </Badge>
          <ArrowSquareOut className="mt-1 size-4 text-white/70" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium">{map.artist} - {map.title}</p>
          <p className="mt-1 truncate text-xs text-white/76">mapped by {map.mapper}</p>
        </div>
      </div>
    </a>
  )
}

function labelMappoolMapsForStage(maps: TournamentMappoolMap[]) {
  const labelById = buildMappoolLabelMap(maps)
  return sortMappoolMaps(maps).map((map) => ({ label: getMappoolLabel(map, labelById), map }))
}

function groupMappoolMapsForStage(maps: TournamentMappoolMap[]) {
  const groups: Array<{ key: string; maps: ReturnType<typeof labelMappoolMapsForStage> }> = []

  for (const item of labelMappoolMapsForStage(maps)) {
    const groupKey = item.label.replace(/\d+$/, "") || item.label
    const group = groups.find((candidate) => candidate.key === groupKey)
    if (group) {
      group.maps.push(item)
    } else {
      groups.push({ key: groupKey, maps: [item] })
    }
  }

  return groups
}

function getMappoolGroupGridClass(count: number) {
  return cn(
    "grid gap-3",
    count <= 1 && "sm:grid-cols-[minmax(16rem,28rem)] sm:justify-center",
    count === 2 && "sm:grid-cols-2",
    count === 3 && "sm:grid-cols-2 lg:grid-cols-3",
    count >= 4 && "sm:grid-cols-2 lg:grid-cols-4",
  )
}
