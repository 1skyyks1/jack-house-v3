import { useEffect, useMemo } from "react"
import { cn } from "@/lib/utils"
import type { RichTextFormat, TocItem } from "../model/types"
import { sanitizeRichTextHtml } from "./sanitizeHtml"
import "../styles/rich-text.css"

type RichTextRendererProps = {
  content: string
  format?: RichTextFormat
  className?: string
  emptyLabel?: string
  onTocChange?: (items: TocItem[]) => void
}

export function RichTextRenderer({
  content,
  format = "html",
  className,
  emptyLabel = "No content",
  onTocChange,
}: RichTextRendererProps) {
  const processed = useMemo(() => {
    if (format !== "html") {
      return { html: "", toc: [] }
    }

    return sanitizeRichTextHtml(content)
  }, [content, format])

  useEffect(() => {
    onTocChange?.(processed.toc)
  }, [onTocChange, processed.toc])

  if (!processed.html) {
    return (
      <div className={cn("rounded-md border border-dashed p-6 text-sm text-muted-foreground", className)}>
        {emptyLabel}
      </div>
    )
  }

  return (
    <div
      className={cn("rich-text", className)}
      dangerouslySetInnerHTML={{ __html: processed.html }}
    />
  )
}

