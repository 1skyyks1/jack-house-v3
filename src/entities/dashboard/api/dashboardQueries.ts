import { useQuery } from "@tanstack/react-query"
import { getDashboardCounts } from "./dashboardApi"

export const dashboardQueryKeys = {
  counts: ["dashboard", "counts"] as const,
}

export function useDashboardCountsQuery() {
  return useQuery({
    queryFn: getDashboardCounts,
    queryKey: dashboardQueryKeys.counts,
  })
}
