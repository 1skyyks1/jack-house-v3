import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useParams, useSearchParams } from "react-router-dom"
import {
  isPackLeaderboardEligibleMap,
  toFiniteNumber,
  usePackDetailQuery,
} from "@/entities/pack"
import { PackComments } from "@/features/comments"
import { useAuthStore, usePermissionsQuery } from "@/features/auth"
import { ManiaWorkbench, ManiaWorkbenchOverlay, useManiaWorkbenchWideLayout } from "@/widgets/mania-workbench"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { PageState } from "@/shared/components"
import { cn } from "@/lib/utils"
import { PackDescription, PackDetailSkeleton, PackInfoPanel, PackShowcase } from "./components"
import { PackLeaderboard } from "./PackLeaderboard"

export function PackDetailPage() {
  const { t } = useTranslation()
  const { packId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const packQuery = usePackDetailQuery(packId)
  const isLogged = useAuthStore((state) => state.isLogged)
  const permissionsQuery = usePermissionsQuery()
  const [selectedMapId, setSelectedMapId] = useState<number | null>(null)
  const [isWorkbenchOpen, setIsWorkbenchOpen] = useState(false)
  const isWideWorkbenchLayout = useManiaWorkbenchWideLayout()
  const maps = useMemo(
    () => [...(packQuery.data?.maps ?? [])].sort((left, right) => toFiniteNumber(left.rating) - toFiniteNumber(right.rating)),
    [packQuery.data?.maps],
  )
  const requestedBeatmapId = Number(searchParams.get("beatmap"))
  const defaultMap = packQuery.data?.leaderboard_enabled
    ? maps.find((map) => isPackLeaderboardEligibleMap(map))
    : maps[0]
  const selectedMap = maps.find((map) => map.beatmap_id === requestedBeatmapId)
    ?? maps.find((map) => map.map_id === selectedMapId)
    ?? defaultMap
    ?? maps[0]
    ?? null
  const canMaintainPack = isLogged && Boolean(permissionsQuery.data?.adminPermissions.includes("*"))

  const selectMap = (mapId: number) => {
    setSelectedMapId(mapId)
    const map = maps.find((item) => item.map_id === mapId)
    const nextParams = new URLSearchParams(searchParams)
    if (map?.beatmap_id) nextParams.set("beatmap", String(map.beatmap_id))
    else nextParams.delete("beatmap")
    setSearchParams(nextParams, { replace: true })
  }

  if (!packId) {
    return <PageState title={t("pack.detail.missingIdTitle")} description={t("pack.detail.missingIdDescription")} />
  }

  if (packQuery.isLoading) {
    return <PackDetailSkeleton />
  }

  if (packQuery.isError) {
    const message = packQuery.error instanceof Error ? packQuery.error.message : t("pack.detail.loadFailedDescription")
    return <PageState title={t("pack.detail.loadFailedTitle")} description={message} />
  }

  if (!packQuery.data) {
    return <PageState title={t("pack.detail.notFoundTitle")} description={t("pack.detail.notFoundDescription")} />
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/pack">{t("pack.detail.breadcrumb")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{packQuery.data.title_unicode || packQuery.data.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className={cn(
        isWorkbenchOpen && isWideWorkbenchLayout
          ? "xl:grid xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start xl:gap-4"
          : "",
      )}>
        <section className="min-w-0">

          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <PackShowcase
              compact={isWorkbenchOpen && isWideWorkbenchLayout}
              maps={maps}
              onSelectMap={selectMap}
              onOpenWorkbench={() => setIsWorkbenchOpen((open) => !open)}
              pack={packQuery.data}
              selectedMap={selectedMap}
              selectedMapId={selectedMap?.map_id ?? null}
            />

            <div className="grid min-h-0 divide-y border-t bg-muted/20 lg:h-[18rem] lg:grid-cols-2 lg:items-stretch lg:divide-x lg:divide-y-0">
              <PackDescription className="h-[18rem] lg:h-full" description={packQuery.data.description} />
              <PackInfoPanel canMaintain={canMaintainPack} pack={packQuery.data} />
            </div>

            {isPackLeaderboardEligibleMap(selectedMap) ? (
              <PackLeaderboard
                beatmapId={selectedMap.beatmap_id}
                key={selectedMap.beatmap_id}
                packId={packQuery.data.pack_id}
                title={packQuery.data.title_unicode || packQuery.data.title}
                version={selectedMap.version}
              />
            ) : null}

            <div className="border-t">
              <PackComments packId={packId} />
            </div>
          </div>
        </section>
        {isWorkbenchOpen && isWideWorkbenchLayout ? (
          <ManiaWorkbench
            beatmapId={selectedMap?.beatmap_id ?? null}
            open={isWorkbenchOpen}
            version={selectedMap?.version}
          />
        ) : null}
      </div>
      {isWorkbenchOpen && !isWideWorkbenchLayout ? (
        <ManiaWorkbenchOverlay
          beatmapId={selectedMap?.beatmap_id ?? null}
          label={t("pack.detail.previewAndAnalyse")}
          onClose={() => setIsWorkbenchOpen(false)}
          version={selectedMap?.version}
        />
      ) : null}
    </div>
  )
}
