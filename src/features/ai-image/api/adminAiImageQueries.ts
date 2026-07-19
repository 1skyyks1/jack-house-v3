import { useQuery } from "@tanstack/react-query"
import { listAdminAiImageJobs } from "./aiImageApi"
import type { ListAdminAiImageJobsParams } from "../model/types"

export const adminAiImageQueryKeys = {
  list: (params: ListAdminAiImageJobsParams) => ["aimg", "admin", "jobs", params] as const,
}

export function useAdminAiImageJobsQuery(params: ListAdminAiImageJobsParams) {
  return useQuery({
    queryFn: () => listAdminAiImageJobs(params),
    queryKey: adminAiImageQueryKeys.list(params),
  })
}
