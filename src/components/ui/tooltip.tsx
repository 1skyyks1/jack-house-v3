import * as React from "react"
import { Tooltip as TooltipPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

type TooltipContextValue = {
  open: boolean
  ownerId: string
  setOpen: (open: boolean) => void
  setTouchOpen: (open: boolean) => void
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null)

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

function Tooltip({
  defaultOpen = false,
  onOpenChange,
  open: controlledOpen,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const ownerId = React.useId()
  const touchPinnedOpen = React.useRef(false)
  const suppressPrimitiveUntil = React.useRef(0)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = React.useCallback((nextOpen: boolean) => {
    if (controlledOpen === undefined) setUncontrolledOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }, [controlledOpen, onOpenChange])
  const setTouchOpen = React.useCallback((nextOpen: boolean) => {
    touchPinnedOpen.current = nextOpen
    // A touch pointerup is followed by synthetic click/focus events. Ignore
    // their Tooltip state changes so the explicit tap state remains stable.
    suppressPrimitiveUntil.current = Date.now() + 500
    setOpen(nextOpen)
  }, [setOpen])
  const handlePrimitiveOpenChange = React.useCallback((nextOpen: boolean) => {
    if (Date.now() < suppressPrimitiveUntil.current) return
    if (!nextOpen && touchPinnedOpen.current) return
    setOpen(nextOpen)
  }, [setOpen])

  React.useEffect(() => {
    if (!open) touchPinnedOpen.current = false
  }, [open])

  React.useEffect(() => {
    if (!open) return

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return
      const owner = event.target.closest<HTMLElement>("[data-tooltip-owner]")
      if (owner?.dataset.tooltipOwner === ownerId) return
      touchPinnedOpen.current = false
      setOpen(false)
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer)
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer)
  }, [open, ownerId, setOpen])

  return (
    <TooltipContext.Provider value={{ open, ownerId, setOpen, setTouchOpen }}>
      <TooltipPrimitive.Root
        data-slot="tooltip"
        onOpenChange={handlePrimitiveOpenChange}
        open={open}
        {...props}
      />
    </TooltipContext.Provider>
  )
}

function TooltipTrigger({
  onPointerDownCapture,
  onPointerUp,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  const tooltip = React.useContext(TooltipContext)
  const touchStartedOpen = React.useRef(false)

  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      data-tooltip-owner={tooltip?.ownerId}
      onPointerDownCapture={(event) => {
        onPointerDownCapture?.(event)
        if (event.pointerType === "touch" || event.pointerType === "pen") {
          touchStartedOpen.current = tooltip?.open ?? false
        }
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event)
        if (
          !event.defaultPrevented
          && tooltip
          && (event.pointerType === "touch" || event.pointerType === "pen")
        ) {
          tooltip.setTouchOpen(!touchStartedOpen.current)
        }
      }}
      {...props}
    />
  )
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  const tooltip = React.useContext(TooltipContext)

  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        data-tooltip-owner={tooltip?.ownerId}
        sideOffset={sideOffset}
        className={cn(
          "z-50 inline-flex w-fit max-w-xs origin-(--radix-tooltip-content-transform-origin) items-center gap-1.5 rounded-2xl bg-foreground px-3 py-1.5 text-xs text-background has-data-[slot=kbd]:pr-1.5 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-4xl data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground data-[side=left]:translate-x-[-1.5px] data-[side=right]:translate-x-[1.5px]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
