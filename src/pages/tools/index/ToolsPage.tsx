import { ArrowRight, Calculator, ChartLineUp, Package } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { TOOL_CATALOG, type ToolDefinition } from "@/entities/tool"

const toolIcons: Record<ToolDefinition["icon"], typeof ChartLineUp> = {
  analysis: ChartLineUp,
  calculator: Calculator,
  package: Package,
}

export function ToolsPage() {
  const { t } = useTranslation()

  return (
    <section>
      <h1 className="sr-only">{t("tools.title")}</h1>
      <div className="space-y-8">
        {TOOL_CATALOG.map((tool) => {
          const Icon = toolIcons[tool.icon]
          return (
            <Link
              className="group grid gap-4 py-1 transition-colors hover:text-primary sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-5"
              key={tool.to}
              to={tool.to}
            >
              <span className="grid size-10 place-items-center text-primary">
                <Icon className="size-5" weight="bold" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-heading text-xl font-semibold text-foreground transition-colors group-hover:text-primary">{t(tool.titleKey)}</h2>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t(tool.descriptionKey)}</p>
              </div>
              <span aria-hidden="true" className="inline-flex items-center text-primary sm:justify-self-end">
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" weight="bold" />
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
