import { CircleNotch } from "@phosphor-icons/react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Skeleton } from "@/components/ui/skeleton"
import { ManiaAnalysisSummary, useManiaAnalysis, type ManiaAnalysisOptions } from "@/features/mania-analyser"
import { ManiaPreview } from "@/features/mania-preview"
import { useManiaBeatmapSourceQuery } from "@/features/mania-source"
import { getErrorMessage } from "@/shared/components"

const DEFAULT_ANALYSIS_OPTIONS: ManiaAnalysisOptions = {
  algorithm: "Mixed",
  cvtFlag: "",
  etternaVersion: "0.72.3",
  odFlag: null,
  speedRate: 1,
}

type ManiaWorkbenchProps = {
  beatmapId: number | null
  open: boolean
  version?: string | null
}

export function ManiaWorkbench({ beatmapId, open, version }: ManiaWorkbenchProps) {
  const { t } = useTranslation()
  const title = version ? t("pack.workbench.titleWithVersion", { version }) : t("pack.workbench.title")

  if (!open) return null
  return (
    <aside aria-label={title} className="relative mx-auto w-full max-w-[18rem]">
      <WorkbenchBody beatmapId={beatmapId} />
    </aside>
  )
}

function WorkbenchBody({ beatmapId }: { beatmapId: number | null }) {
  const { t } = useTranslation()
  const sourceQuery = useManiaBeatmapSourceQuery(beatmapId)
  const source = sourceQuery.data
  const canAnalyse = source?.beatmap.keyCount === 4
  const options = useMemo(() => DEFAULT_ANALYSIS_OPTIONS, [])
  const analysis = useManiaAnalysis(source?.osuText, options, canAnalyse)

  if (!beatmapId) {
    return <WorkbenchMessage title={t("pack.workbench.unavailable")} />
  }

  if (sourceQuery.isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="aspect-[1/2] w-full rounded-xl" />
        <div className="space-y-4"><Skeleton className="h-48 rounded-xl" /><Skeleton className="h-36 rounded-xl" /></div>
      </div>
    )
  }

  if (sourceQuery.isError || !source) {
    return <WorkbenchMessage description={getErrorMessage(sourceQuery.error)} title={t("pack.workbench.loadFailed")} />
  }

  return (
    <div className="space-y-3">
      <section>
        <ManiaPreview
          key={source.beatmap.beatmapId}
          labels={{
            empty: t("pack.workbench.previewEmpty"),
            invalid: t("pack.workbench.previewInvalid"),
            pause: t("pack.workbench.pause"),
            play: t("pack.workbench.play"),
            speed: t("pack.workbench.scrollSpeed"),
          }}
          osuText={source.osuText}
        />
      </section>

      <section className="min-w-0">
        {!canAnalyse ? (
          <WorkbenchMessage description={t("pack.workbench.previewStillAvailable")} title={t("maniaAnalyser.only4k")} />
        ) : analysis.isAnalysing ? (
          <div className="space-y-3 rounded-xl border bg-card p-5">
            <div className="flex items-center gap-2 text-sm font-medium"><CircleNotch className="size-4 animate-spin" />{t("maniaAnalyser.analysing")}</div>
            <Skeleton className="h-24" />
            <Skeleton className="h-20" />
          </div>
        ) : analysis.error ? (
          <WorkbenchMessage description={analysis.error.message} title={t("maniaAnalyser.errorTitle")} />
        ) : analysis.result ? (
          <ManiaAnalysisSummary
            labels={{
              difficulty: t("maniaAnalyser.difficultyLabel"),
              graph: t("maniaAnalyser.difficultyGraph"),
              reworkStar: t("maniaAnalyser.reworkStar"),
            }}
            result={analysis.result}
          />
        ) : null}
      </section>
    </div>
  )
}

function WorkbenchMessage({ description, title }: { description?: string; title: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center">
      <p className="font-medium">{title}</p>
      {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
    </div>
  )
}
