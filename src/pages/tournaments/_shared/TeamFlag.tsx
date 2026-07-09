import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export function TeamFlag({
  className,
  name,
  src,
}: {
  className?: string
  name: string
  src?: string | null
}) {
  const [hasError, setHasError] = useState(false)
  const fallback = name.trim().slice(0, 1) || "?"

  useEffect(() => {
    setHasError(false)
  }, [src])

  return (
    <div className={cn("relative flex aspect-[11/8] shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted text-xs font-semibold text-muted-foreground", className)}>
      {src && !hasError ? (
        <img
          alt={name}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          src={src}
          onError={() => setHasError(true)}
        />
      ) : (
        <span>{fallback}</span>
      )}
    </div>
  )
}
