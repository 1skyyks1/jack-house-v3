import { useEffect } from "react"
import { createPortal } from "react-dom"
import { ManiaWorkbench } from "./ManiaWorkbench"

type ManiaWorkbenchOverlayProps = {
  beatmapId: number | null
  label: string
  onClose: () => void
  version?: string | null
}

export function ManiaWorkbenchOverlay({ beatmapId, label, onClose, version }: ManiaWorkbenchOverlayProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", closeOnEscape)
    }
  }, [onClose])

  return createPortal(
    <div
      aria-label={label}
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/65 backdrop-blur-sm"
      onMouseDown={onClose}
      role="dialog"
    >
      <div className="flex min-h-full items-start justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-[18rem]" onMouseDown={(event) => event.stopPropagation()}>
          <ManiaWorkbench beatmapId={beatmapId} open version={version} />
        </div>
      </div>
    </div>,
    document.body,
  )
}
