import { useTranslation } from "react-i18next"
import type { TocItem } from "../model/types"
import { cn } from "@/lib/utils"

type RichTextTocProps = {
  items: TocItem[]
  className?: string
}

export function RichTextToc({ items, className }: RichTextTocProps) {
  const { t } = useTranslation()

  if (items.length === 0) {
    return (
      <div className={cn("rounded-md border border-dashed p-4 text-sm text-muted-foreground", className)}>
        {t("richText.toc.empty")}
      </div>
    )
  }

  return (
    <nav className={cn("rounded-md border bg-card p-4", className)} aria-label={t("richText.toc.navLabel")}>
      <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">{t("richText.toc.title")}</p>
      <ol className="space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <a
              className={cn(
                "block rounded px-2 py-1 text-sm text-muted-foreground transition hover:bg-accent hover:text-accent-foreground",
                item.depth === 3 && "pl-5 text-xs",
                item.depth >= 4 && "pl-8 text-xs",
              )}
              href={`#${item.id}`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
