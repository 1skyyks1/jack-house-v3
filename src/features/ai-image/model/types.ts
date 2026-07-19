export type AiImageRequestType = "generation" | "edit"
export type AiImageJobStatus = "submitting" | "pending" | "running" | "done" | "failed" | "cancelled" | "expired"

export type AiImageJob = {
  id: string
  requestType: AiImageRequestType
  prompt: string
  size: string
  referenceCount: number
  hasMask: boolean
  status: AiImageJobStatus
  resultUrls: string[]
  resultExpired: boolean
  createdAt: string | null
  startedAt: string | null
  finishedAt: string | null
  expiresAt: string | null
}

export type AiImageFileAuditMetadata = {
  mimeType: string
  name: string
  sha256: string
  size: number
}

export type AiImageAuditJob = AiImageJob & {
  upstreamJobId: string | null
  model: string
  quotaRefunded: boolean
  errorCode: string | null
  errorMessage: string | null
  audit: {
    maskMetadata: AiImageFileAuditMetadata | null
    referenceMetadata: AiImageFileAuditMetadata[] | null
    sourceIp: string | null
    userAgent: string | null
  }
  user: {
    role: number
    user_id: number
    user_name: string
  } | null
}

export type ListAdminAiImageJobsParams = {
  page: number
  pageSize: number
  status?: AiImageJobStatus
  userId?: number
}

export type AiImageConfig = {
  allowedSizes: string[]
  quota: {
    date: string
    limit: number | null
    remaining: number | null
    used: number
  }
  activeJob: AiImageJob | null
  maxReferences: number
  maxPromptLength: number
}

export type SubmitAiImageInput = {
  idempotencyKey: string
  requestType: AiImageRequestType
  prompt: string
  size: string
  images: File[]
  mask: File | null
}
