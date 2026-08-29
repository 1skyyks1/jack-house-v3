import { useEffect, useState } from "react"

const WIDE_WORKBENCH_QUERY = "(min-width: 1280px)"

export function useManiaWorkbenchWideLayout() {
  const [isWide, setIsWide] = useState(() => window.matchMedia(WIDE_WORKBENCH_QUERY).matches)

  useEffect(() => {
    const mediaQuery = window.matchMedia(WIDE_WORKBENCH_QUERY)
    const update = () => setIsWide(mediaQuery.matches)
    mediaQuery.addEventListener("change", update)
    update()
    return () => mediaQuery.removeEventListener("change", update)
  }, [])

  return isWide
}
