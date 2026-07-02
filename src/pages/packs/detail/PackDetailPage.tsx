import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router-dom"
import {
  toFiniteNumber,
  usePackDetailQuery,
} from "@/entities/pack"
import { PackComments } from "@/features/comments"
import { useAuthStore, usePermissionsQuery } from "@/features/auth"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { PageState } from "@/shared/components"
import { PackDescription, PackDetailSkeleton, PackInfoPanel, PackShowcase } from "./components"

export function PackDetailPage() {
  const { t } = useTranslation()
  const { packId } = useParams()
  const packQuery = usePackDetailQuery(packId)
  const isLogged = useAuthStore((state) => state.isLogged)
  const permissionsQuery = usePermissionsQuery()
  const [selectedMapId, setSelectedMapId] = useState<number | null>(null)
  const maps = useMemo(
    () => [...(packQuery.data?.maps ?? [])].sort((left, right) => toFiniteNumber(left.rating) - toFiniteNumber(right.rating)),
    [packQuery.data?.maps],
  )
  const selectedMap = maps.find((map) => map.map_id === selectedMapId) ?? maps[0] ?? null
  const canMaintainPack = isLogged && Boolean(permissionsQuery.data?.adminPermissions.includes("*"))

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
    <section>
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

      <div className="space-y-4">
        <PackShowcase
          maps={maps}
          onSelectMap={setSelectedMapId}
          pack={packQuery.data}
          selectedMap={selectedMap}
          selectedMapId={selectedMap?.map_id ?? null}
        />

        <div className="grid min-h-0 gap-4 lg:h-[18rem] lg:grid-cols-2 lg:items-stretch">
          <PackDescription className="h-[18rem] lg:h-full" description={packQuery.data.description} />
          <PackInfoPanel canMaintain={canMaintainPack} pack={packQuery.data} />
        </div>

        <PackComments packId={packId} />
      </div>
    </section>
  )
}
