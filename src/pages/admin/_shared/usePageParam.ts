import { useSearchParams } from "react-router-dom"

export function usePageParam(key: string = "page"): [number, (page: number) => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parsePage(searchParams.get(key))

  const setPage = (nextPage: number) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set(key, String(Math.max(nextPage, 1)))
    setSearchParams(nextParams)
  }

  return [page, setPage]
}

function parsePage(value: string | null) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}
