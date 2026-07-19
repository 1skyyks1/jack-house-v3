import { unwrapData, unwrapPagination } from "@/shared/api/contracts/unwrap"
import type { PaginatedEnvelope } from "@/shared/api/contracts/common"
import { http } from "@/shared/api/http"
import type {
  AiImageAuditJob,
  AiImageConfig,
  AiImageJob,
  ListAdminAiImageJobsParams,
  SubmitAiImageInput,
} from "../model/types"

export async function getAiImageConfig() {
  const response = await http.get("/tool/aimg/config")
  return unwrapData<AiImageConfig>(response)
}

export async function listAiImageJobs(page = 1, pageSize = 12) {
  const response = await http.get("/tool/aimg/jobs", {
    params: { hydrate: true, page, pageSize },
  })
  return unwrapPagination<AiImageJob>(response) as PaginatedEnvelope<AiImageJob>
}

export async function getAiImageJob(jobId: string) {
  const response = await http.get(`/tool/aimg/jobs/${encodeURIComponent(jobId)}`)
  return unwrapData<AiImageJob>(response)
}

export async function getAiImageResult(jobId: string, index = 0) {
  return http.get<Blob, Blob>(
    `/tool/aimg/jobs/${encodeURIComponent(jobId)}/results/${index}`,
    { responseType: "blob" },
  )
}

export async function listAdminAiImageJobs(params: ListAdminAiImageJobsParams) {
  const response = await http.get("/tool/aimg/admin/jobs", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      status: params.status,
      userId: params.userId,
    },
  })
  return unwrapPagination<AiImageAuditJob>(response) as PaginatedEnvelope<AiImageAuditJob>
}

export async function submitAiImage(input: SubmitAiImageInput) {
  const formData = new FormData()
  formData.append("idempotencyKey", input.idempotencyKey)
  formData.append("requestType", input.requestType)
  formData.append("prompt", input.prompt)
  formData.append("size", input.size)
  input.images.forEach((image) => formData.append("images", image))
  if (input.mask) formData.append("mask", input.mask)

  const response = await http.post("/tool/aimg/jobs", formData, {
    timeout: 45_000,
  })
  return unwrapData<AiImageJob>(response)
}
