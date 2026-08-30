import axios from "axios"
import type { PaginatedEnvelope } from "@/shared/api/contracts/common"
import { unwrapData, unwrapPagination } from "@/shared/api/contracts/unwrap"
import { http, UPLOAD_REQUEST_TIMEOUT_MS } from "@/shared/api/http"
import type {
  FulfillmentStatus,
  PointTransaction,
  RedemptionOrder,
  RewardItem,
  RewardItemStatus,
  RewardItemType,
  ShippingInfo,
} from "../model/types"

export async function getPointBalance() {
  const response = await http.get("/rewards/me")
  return unwrapData<{ balance: number }>(response)
}

export async function getRewardItems(admin = false) {
  const response = await http.get(admin ? "/rewards/admin/items" : "/rewards/items")
  return unwrapData<RewardItem[]>(response)
}

export async function getPointLedger(page = 1, admin = false): Promise<PaginatedEnvelope<PointTransaction>> {
  const response = await http.get(admin ? "/rewards/admin/ledger" : "/rewards/ledger", { params: { page, pageSize: admin ? 30 : 20 } })
  return unwrapPagination<PointTransaction>(response)
}

export async function getRedemptionOrders(page = 1, admin = false): Promise<PaginatedEnvelope<RedemptionOrder>> {
  const response = await http.get(admin ? "/rewards/admin/orders" : "/rewards/orders", { params: { page, pageSize: 20 } })
  return unwrapPagination<RedemptionOrder>(response)
}

export type RedeemRequest = {
  items: Array<{ rewardItemId: number; quantity: number; expectedUnitPoints: number; virtualId?: string; remark?: string }>
  shipping?: ShippingInfo
}

export async function redeemRewards(request: RedeemRequest) {
  const response = await http.post("/rewards/redeem", request)
  return unwrapData<RedemptionOrder>(response)
}

export type SaveRewardItemRequest = {
  name_zh: string
  name_en: string
  description_zh: string
  description_en: string
  image_url: string
  type: RewardItemType
  point_cost: number
  stock: number
  limit_per_user: number | null
  status: RewardItemStatus
  starts_at: string | null
  ends_at: string | null
  sort_order: number
  id_label_zh: string
  id_label_en: string
  id_placeholder_zh: string
  id_placeholder_en: string
}

type RewardImageUploadGrant = {
  expiresAt: string | null
  strategyId: number
  token: string
  uploadUrl: string
}

type PngUrlUploadResponse = {
  status: boolean
  message?: string
  data?: {
    key: string
    url: string
    width: number
    height: number
    size: number
    mimetype: string
  }
}

export type UploadRewardImageRequest = {
  file: File
  onProgress?: (progress: number) => void
}

export async function uploadRewardImage({ file, onProgress }: UploadRewardImageRequest) {
  const grantResponse = await http.post("/rewards/admin/image-upload-token")
  const grant = unwrapData<RewardImageUploadGrant>(grantResponse)
  const formData = new FormData()
  formData.append("file", file)
  formData.append("strategy_id", String(grant.strategyId))
  formData.append("permission", "0")

  try {
    const response = await axios.post<PngUrlUploadResponse>(grant.uploadUrl, formData, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${grant.token}`,
      },
      onUploadProgress: (event) => {
        if (!event.total) return
        onProgress?.(Math.min(100, Math.round((event.loaded / event.total) * 100)))
      },
      timeout: UPLOAD_REQUEST_TIMEOUT_MS,
    })
    const result = response.data

    if (!result.status || !result.data?.url) {
      throw new Error(result.message || "PNGURL image upload failed")
    }

    return result.data
  } catch (error) {
    if (axios.isAxiosError<PngUrlUploadResponse>(error)) {
      throw new Error(error.response?.data?.message || error.message || "PNGURL image upload failed", { cause: error })
    }
    throw error
  }
}

export async function createRewardItem(request: SaveRewardItemRequest) {
  const response = await http.post("/rewards/admin/items", withLegacyRewardFields(request))
  return unwrapData<RewardItem>(response)
}

export async function updateRewardItem(id: number, request: SaveRewardItemRequest) {
  const response = await http.put(`/rewards/admin/items/${id}`, withLegacyRewardFields(request))
  return unwrapData<RewardItem>(response)
}

function withLegacyRewardFields(request: SaveRewardItemRequest) {
  return {
    ...request,
    name: request.name_zh,
    description: request.description_zh,
    id_label: request.id_label_zh,
    id_placeholder: request.id_placeholder_zh,
  }
}

export async function adjustPoints(request: { user_id: number; amount: number; reason: string }) {
  const response = await http.post("/rewards/admin/points", request)
  return unwrapData<{ balance: number }>(response)
}

export async function updateOrderItem(request: { id: number; status: FulfillmentStatus; detail: string }) {
  const response = await http.patch(`/rewards/admin/order-items/${request.id}`, { status: request.status, detail: request.detail })
  return unwrapData(response)
}
