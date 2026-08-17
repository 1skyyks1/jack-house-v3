import { ArrowRight, Calculator, ChartLineUp, Package, Sparkle } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { TOOL_CATALOG, type ToolDefinition } from "@/entities/tool"

const toolIcons: Record<ToolDefinition["icon"], typeof ChartLineUp> = {
  analysis: ChartLineUp,
  calculator: Calculator,
  package: Package,
  sparkle: Sparkle,
}

export function ToolsPage() {
  const { t } = useTranslation()

  return (
    <section>
      <h1 className="sr-only">{t("tools.title")}</h1>
      <div className="space-y-5 sm:space-y-8">
        {TOOL_CATALOG.map((tool) => {
          const Icon = toolIcons[tool.icon]
          return (
            <Link
              className="group grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-3 py-1 transition-colors hover:text-primary sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-5"
              key={tool.to}
              to={tool.to}
            >
              <span className="grid size-9 place-items-center text-primary sm:size-10">
                <Icon className="size-5" weight="bold" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate font-heading text-lg font-semibold text-foreground transition-colors group-hover:text-primary sm:text-xl">{t(tool.titleKey)}</h2>
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground sm:line-clamp-none">{t(tool.descriptionKey)}</p>
              </div>
              <span aria-hidden="true" className="inline-flex items-center justify-self-end text-primary">
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" weight="bold" />
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
