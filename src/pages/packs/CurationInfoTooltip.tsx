import { Question } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function CurationInfoTooltip() {
  const { i18n, t } = useTranslation()
  const separator = i18n.resolvedLanguage?.startsWith("zh") ? "：" : ": "

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            aria-label={t("pack.curationHelpLabel")}
            className="inline-flex h-7 w-5 shrink-0 cursor-help items-center justify-center text-muted-foreground transition hover:text-foreground sm:h-8"
            role="button"
            tabIndex={0}
          >
            <Question aria-hidden="true" className="size-4" weight="bold" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="w-80 max-w-[calc(100vw-2rem)] flex-col items-start gap-2 whitespace-normal p-3 leading-5">
          <CurationDescription description={t("pack.featuredDescription")} separator={separator} title={t("pack.featured")} />
          <CurationDescription description={t("pack.picksDescription")} separator={separator} title={t("pack.recommended")} />
          <CurationDescription description={t("pack.originalsDescription")} separator={separator} title={t("pack.originals")} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function CurationDescription({ description, separator, title }: { description: string; separator: string; title: string }) {
  return (
    <p>
      <span className="font-semibold">{title}{separator}</span>
      {description}
    </p>
  )
}
