import { lazy, Suspense } from "react"
import { cn } from "@/lib/utils"
import type { RichTextEditorProps } from "./RichTextEditor"

const RichTextEditor = lazy(() => import("./RichTextEditor").then((module) => ({ default: module.RichTextEditor })))

export function LazyRichTextEditor(props: RichTextEditorProps) {
  return (
    <Suspense fallback={<RichTextEditorFallback minHeightClassName={props.minHeightClassName} />}>
      <RichTextEditor {...props} />
    </Suspense>
  )
}

function RichTextEditorFallback({ minHeightClassName = "min-h-64" }: { minHeightClassName?: string }) {
  return (
    <div className="space-y-2">
      <div className={cn("rounded-lg border bg-muted/40", minHeightClassName)} />
    </div>
  )
}
